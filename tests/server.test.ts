/**

  test(server): add unit tests for schema validation and response parsing

- Created server.test.ts using Vitest
- Replicated QuestionRequestSchema from server.ts with Zod
- Added tests for jobTitle validation (length, required, max 100 chars)
- Verified difficultyTier defaults to Standard and accepts Advanced
- Ensured invalid difficultyTier values are rejected
- Implemented parseQuestionsResponse helper to strip markdown fences
- Added tests for parsing clean JSON, fenced JSON, and slicing to 3 questions
- Covered error cases: invalid JSON and missing questions field

    Run: yarn test
*/



import { describe, expect, it } from "vitest";
import { z } from "zod";

/* Replicate the schema from server.ts */
const QuestionRequestSchema = z.object({
	jobTitle: z.string().min(2).max(100),
	difficultyTier: z
		.enum(["Standard", "Advanced"])
		.optional()
		.default("Standard"),
});

/* Replicate the response parser from server.ts */
function parseQuestionsResponse(raw: string): string[] {
	const cleaned = raw.replace(/```json|```/g, "").trim();
	const parsed = JSON.parse(cleaned);
	if (!Array.isArray(parsed.questions)) {
		throw new Error("Unexpected response shape.");
	}
	return parsed.questions.slice(0, 3);
}

/*  Schema validation tests */
describe("QuestionRequestSchema", () => {
	it("accepts a valid job title", () => {
		const result = QuestionRequestSchema.safeParse({
			jobTitle: "Customer Success Manager",
		});
		expect(result.success).toBe(true);
	});

	it("rejects a job title that is too short", () => {
		const result = QuestionRequestSchema.safeParse({ jobTitle: "A" });
		expect(result.success).toBe(false);
	});

	it("rejects an empty job title", () => {
		const result = QuestionRequestSchema.safeParse({ jobTitle: "" });
		expect(result.success).toBe(false);
	});

	it("rejects a job title over 100 characters", () => {
		const result = QuestionRequestSchema.safeParse({
			jobTitle: "A".repeat(101),
		});
		expect(result.success).toBe(false);
	});

	it("defaults difficultyTier to Standard when not provided", () => {
		const result = QuestionRequestSchema.safeParse({
			jobTitle: "Frontend Engineer",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.difficultyTier).toBe("Standard");
		}
	});

	it("accepts Advanced as a valid difficultyTier", () => {
		const result = QuestionRequestSchema.safeParse({
			jobTitle: "Engineering Manager",
			difficultyTier: "Advanced",
		});
		expect(result.success).toBe(true);
	});

	it("rejects an invalid difficultyTier value", () => {
		const result = QuestionRequestSchema.safeParse({
			jobTitle: "Designer",
			difficultyTier: "Expert",
		});
		expect(result.success).toBe(false);
	});

	it("rejects a missing jobTitle field", () => {
		const result = QuestionRequestSchema.safeParse({});
		expect(result.success).toBe(false);
	});
});

/* Response parser tests */
describe("parseQuestionsResponse", () => {
	it("parses a clean JSON response", () => {
		const raw = JSON.stringify({
			questions: ["Question one?", "Question two?", "Question three?"],
		});
		const result = parseQuestionsResponse(raw);
		expect(result).toHaveLength(3);
		expect(result[0]).toBe("Question one?");
	});

	it("strips markdown fences before parsing", () => {
		const raw = '```json\n{"questions": ["Q1", "Q2", "Q3"]}\n```';
		const result = parseQuestionsResponse(raw);
		expect(result).toHaveLength(3);
		expect(result[0]).toBe("Q1");
	});

	it("slices to a maximum of 3 questions", () => {
		const raw = JSON.stringify({
			questions: ["Q1", "Q2", "Q3", "Q4", "Q5"],
		});
		const result = parseQuestionsResponse(raw);
		expect(result).toHaveLength(3);
	});

	it("throws on invalid JSON", () => {
		expect(() => parseQuestionsResponse("not json")).toThrow();
	});

	it("throws when questions field is missing", () => {
		const raw = JSON.stringify({ data: [] });
		expect(() => parseQuestionsResponse(raw)).toThrow(
			"Unexpected response shape.",
		);
	});
});
