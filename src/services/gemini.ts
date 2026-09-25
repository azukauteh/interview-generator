const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
	throw new Error("GEMINI_API_KEY is not configured.");
}

const MODEL_CHAIN = [
	process.env.GEMINI_MODEL ?? "gemini-3.5-flash",
	"gemini-3.5-flash-lite",
	"gemini-3.1-flash-lite",
];

const MAX_ATTEMPTS_PER_MODEL = 3;
const DEFAULT_MAX_OUTPUT_TOKENS = 1500;

export interface GenerateTextOptions {
	maxOutputTokens?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isOverloaded(error: unknown): boolean {
	if (error instanceof Error && error.name === "AbortError") return true;
	if (typeof error === "object" && error !== null && "code" in error) {
		const code = (error as { code?: string }).code;
		if (code === "UND_ERR_HEADERS_TIMEOUT" || code === "ECONNRESET")
			return true;
	}
	return (
		typeof error === "object" &&
		error !== null &&
		"status" in error &&
		(error as { status?: unknown }).status === 503
	);
}

export async function generateText(
	prompt: string,
	options: GenerateTextOptions = {},
): Promise<string> {
	let lastError: unknown;

	for (const model of MODEL_CHAIN) {
		for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt++) {
			try {
				const controller = new AbortController();
				const timeout = setTimeout(() => controller.abort(), 60000);

				const response = await fetch(
					`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							contents: [{ parts: [{ text: prompt }] }],
							generationConfig: {
								temperature: 0.7,
								maxOutputTokens:
									options.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
							},
						}),
						signal: controller.signal,
					},
				);

				clearTimeout(timeout);

				if (!response.ok) {
					const err = await response.text();
					throw new Error(`Gemini API error: ${response.status} ${err}`);
				}

				const data = await response.json();
				const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

				return text.trim();
			} catch (error: unknown) {
				lastError = error;
				console.error(
					`[Gemini] Request failed (model=${model}, attempt ${attempt}/${MAX_ATTEMPTS_PER_MODEL})`,
					error,
				);

				if (!isOverloaded(error)) {
					throw error;
				}

				if (attempt < MAX_ATTEMPTS_PER_MODEL) {
					await sleep(attempt * 2000);
				}
			}
		}
		console.error(
			`[Gemini] Exhausted retries on model=${model}, falling back to next model in chain`,
		);
	}

	throw lastError;
}
