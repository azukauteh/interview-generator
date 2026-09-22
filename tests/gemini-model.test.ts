import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock must be declared before importing the module under test, since
// gemini.ts constructs the GoogleGenAI client at module load time.
const generateContentMock = vi.fn();

vi.mock("@google/genai", () => ({
	// Must be a real `function`, not an arrow function — Vitest 4 requires
	// the mock implementation itself be constructor-capable since gemini.ts
	// calls `new GoogleGenAI(...)`.
	GoogleGenAI: vi.fn().mockImplementation(function GoogleGenAI() {
		return { models: { generateContent: generateContentMock } };
	}),
}));

function overloadedError() {
	return Object.assign(new Error("UNAVAILABLE"), { status: 503 });
}

function notFoundError() {
	return Object.assign(new Error("NOT_FOUND"), { status: 404 });
}

describe("gemini.generateText", () => {
	const ORIGINAL_ENV = { ...process.env };

	beforeEach(() => {
		vi.resetModules();
		vi.useFakeTimers();
		generateContentMock.mockReset();
		process.env.GEMINI_API_KEY = "test-key";
		process.env.GEMINI_MODEL = "gemini-3.5-flash";
	});

	afterEach(() => {
		vi.useRealTimers();
		process.env = { ...ORIGINAL_ENV };
	});

	// Backoff sleeps use real timers underneath; fake timers let the retry
	// and fallback tests resolve instantly instead of taking the full 2s/4s
	// production delay per attempt (up to 18s worst case across the chain).
	async function runWithTimers<T>(promise: Promise<T>): Promise<T> {
		await vi.runAllTimersAsync();
		return promise;
	}

	it("throws at import time if GEMINI_API_KEY is unset", async () => {
		delete process.env.GEMINI_API_KEY;
		await expect(import("../src/services/gemini")).rejects.toThrow(
			"GEMINI_API_KEY is not configured.",
		);
	});

	it("reads the primary model from GEMINI_MODEL, not a hardcoded string", async () => {
		process.env.GEMINI_MODEL = "gemini-3.6-flash";
		generateContentMock.mockResolvedValueOnce({ text: "{}" });

		const { generateText } = await import("../src/services/gemini");
		await generateText("prompt");

		expect(generateContentMock).toHaveBeenCalledWith(
			expect.objectContaining({ model: "gemini-3.6-flash" }),
		);
	});

	it("defaults to gemini-3.5-flash when GEMINI_MODEL is unset", async () => {
		delete process.env.GEMINI_MODEL;
		generateContentMock.mockResolvedValueOnce({ text: "{}" });

		const { generateText } = await import("../src/services/gemini");
		await generateText("prompt");

		expect(generateContentMock).toHaveBeenCalledWith(
			expect.objectContaining({ model: "gemini-3.5-flash" }),
		);
	});

	it("never defaults to a decommissioned model (gemini-2.5-flash)", async () => {
		delete process.env.GEMINI_MODEL;
		generateContentMock.mockResolvedValueOnce({ text: "{}" });

		const { generateText } = await import("../src/services/gemini");
		await generateText("prompt");

		expect(generateContentMock).not.toHaveBeenCalledWith(
			expect.objectContaining({ model: "gemini-2.5-flash" }),
		);
	});

	it("returns the response text on first success, no retry", async () => {
		generateContentMock.mockResolvedValueOnce({ text: '{"questions":[]}' });

		const { generateText } = await import("../src/services/gemini");
		const result = await generateText("prompt");

		expect(result).toBe('{"questions":[]}');
		expect(generateContentMock).toHaveBeenCalledTimes(1);
	});

	it("retries the same model up to 3 times on 503 before falling back", async () => {
		generateContentMock
			.mockRejectedValueOnce(overloadedError())
			.mockRejectedValueOnce(overloadedError())
			.mockResolvedValueOnce({ text: "recovered" });

		const { generateText } = await import("../src/services/gemini");
		const result = await runWithTimers(generateText("prompt"));

		expect(result).toBe("recovered");
		expect(generateContentMock).toHaveBeenCalledTimes(3);
		// all 3 calls on the same (primary) model
		for (const call of generateContentMock.mock.calls) {
			expect(call[0]).toMatchObject({ model: "gemini-3.5-flash" });
		}
	});

	it("falls back to the next model in the chain after exhausting retries on 503", async () => {
		generateContentMock
			.mockRejectedValueOnce(overloadedError()) // primary attempt 1
			.mockRejectedValueOnce(overloadedError()) // primary attempt 2
			.mockRejectedValueOnce(overloadedError()) // primary attempt 3, exhausted
			.mockResolvedValueOnce({ text: "from fallback" }); // fallback model, attempt 1

		const { generateText } = await import("../src/services/gemini");
		const result = await runWithTimers(generateText("prompt"));

		expect(result).toBe("from fallback");
		expect(generateContentMock).toHaveBeenCalledTimes(4);
		expect(generateContentMock.mock.calls[3][0]).toMatchObject({
			model: "gemini-3.5-flash-lite",
		});
	});

	it("walks the full chain and throws the last error if every model 503s", async () => {
		// mockImplementation (not mockRejectedValue) so each call produces a
		// fresh rejected promise instead of nine callers sharing one, which
		// Vitest can flag as an unhandled rejection under fake timers.
		generateContentMock.mockImplementation(() =>
			Promise.reject(overloadedError()),
		);

		const { generateText } = await import("../src/services/gemini");

		// Attach the rejection handler before advancing timers — advancing
		// first (as runWithTimers does) lets the promise reject before
		// anything is listening, which Vitest flags as an unhandled
		// rejection even though it's caught a tick later.
		const assertion = expect(generateText("prompt")).rejects.toMatchObject({
			status: 503,
		});
		await vi.runAllTimersAsync();
		await assertion;

		// 3 models x 3 attempts each = 9 total calls
		expect(generateContentMock).toHaveBeenCalledTimes(9);
	});

	it("does not retry or fall back on a non-503 error (e.g. 404 bad model)", async () => {
		generateContentMock.mockRejectedValueOnce(notFoundError());

		const { generateText } = await import("../src/services/gemini");

		await expect(generateText("prompt")).rejects.toMatchObject({
			status: 404,
		});
		expect(generateContentMock).toHaveBeenCalledTimes(1);
	});

	it("backs off with increasing delay between retries on the same model", async () => {
		generateContentMock
			.mockRejectedValueOnce(overloadedError())
			.mockRejectedValueOnce(overloadedError())
			.mockResolvedValueOnce({ text: "ok" });

		const { generateText } = await import("../src/services/gemini");
		const promise = generateText("prompt");

		// Still pending: attempt 1 has failed, waiting on sleep(1 * 2000).
		await vi.advanceTimersByTimeAsync(1999);
		expect(generateContentMock).toHaveBeenCalledTimes(1);

		// Crossing the 2000ms mark fires attempt 2, which also fails and
		// starts sleep(2 * 2000).
		await vi.advanceTimersByTimeAsync(1);
		expect(generateContentMock).toHaveBeenCalledTimes(2);

		// Not yet at the 4000ms mark for attempt 3.
		await vi.advanceTimersByTimeAsync(3999);
		expect(generateContentMock).toHaveBeenCalledTimes(2);

		await vi.advanceTimersByTimeAsync(1);
		expect(generateContentMock).toHaveBeenCalledTimes(3);

		const result = await promise;
		expect(result).toBe("ok");
	});
});
