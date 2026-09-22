import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured.");
}

const ai = new GoogleGenAI({ apiKey });

const MODEL_CHAIN = [
  process.env.GEMINI_MODEL ?? "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
];

const MAX_ATTEMPTS_PER_MODEL = 3;
const DEFAULT_MAX_OUTPUT_TOKENS = 1500;

export type GeminiResponseSchema = Record<string, unknown>;

export interface GenerateTextOptions {
  responseSchema?: GeminiResponseSchema;
  maxOutputTokens?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isOverloaded(error: unknown): boolean {
  // Treat AbortError, ECONNRESET, and Undici timeout as retryable
  if (error instanceof Error && error.name === "AbortError") return true;
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: string }).code;
    if (code === "UND_ERR_HEADERS_TIMEOUT" || code === "ECONNRESET") return true;
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
        // Manual timeout wrapper
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000);

        const response = await ai.models.generateContent({
          model,
          contents: [{ parts: [{ text: prompt }] }], // explicit format
          config: {
            temperature: 0.7,
            maxOutputTokens: options.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
            responseMimeType: "application/json",
            ...(options.responseSchema ? { responseSchema: options.responseSchema } : {}),
          },
          signal: controller.signal,
        });

        clearTimeout(timeout);

        // Prefer structured response, fallback to .text
        const text =
          response.text ??
          response.candidates?.[0]?.content?.parts?.[0]?.text ??
          "";

        return text.trim();
      } catch (error: unknown) {
        lastError = error;
        console.error(
          `[Gemini] Request failed (model=${model}, attempt ${attempt}/${MAX_ATTEMPTS_PER_MODEL})`,
          error,
        );

        if (!isOverloaded(error)) {
          throw error; // Non-retryable error
        }

        if (attempt < MAX_ATTEMPTS_PER_MODEL) {
          await sleep(attempt * 2000); // exponential backoff
        }
      }
    }
    console.error(
      `[Gemini] Exhausted retries on model=${model}, falling back to next model in chain`,
    );
  }

  throw lastError;
}

