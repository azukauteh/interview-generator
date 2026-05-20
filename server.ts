/**
 * server.ts
 *
 * Entry point for the Interviewer.ai Express backend.
 *
 * Responsibilities:
 * - Serves the static frontend (index.html + assets)
 * - Exposes POST /api/generate-questions for AI question generation
 * - Validates requests using Zod before reaching the AI layer
 * - Integrates Groq SDK (LLaMA 3.3 70B) for question generation
 * - Mounts Swagger UI at /docs for API exploration
 *
 * Environment variables required:
 * - GROQ_API_KEY  — Groq API key (https://console.groq.com)
 * - PORT          — Server port (defaults to 3000)
 *
 * @author  Uteh.A
 * @version 1.0.0
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import Groq from "groq-sdk";
import swaggerUi from "swagger-ui-express";
import { z } from "zod";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── Groq client ───────────────────────────────────────────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Zod schema ────────────────────────────────────────────────────
const QuestionRequestSchema = z.object({
	jobTitle: z.string().min(2).max(100),
	difficultyTier: z
		.enum(["Standard", "Advanced"])
		.optional()
		.default("Standard"),
});

// ── Swagger ───────────────────────────────────────────────────────
const swaggerDocument = {
	openapi: "3.0.0",
	info: { title: "Interviewer.ai API", version: "1.0.0" },
	paths: {
		"/api/generate-questions": {
			post: {
				summary: "Generate 3 interview questions",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									jobTitle: {
										type: "string",
										example: "Customer Success Manager",
									},
									difficultyTier: {
										type: "string",
										enum: ["Standard", "Advanced"],
									},
								},
							},
						},
					},
				},
				responses: {
					200: {
						description: "Success",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										questions: { type: "array", items: { type: "string" } },
									},
								},
							},
						},
					},
				},
			},
		},
	},
};

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ── POST /api/generate-questions ──────────────────────────────────
app.post("/api/generate-questions", async (req, res) => {
	const validation = QuestionRequestSchema.safeParse(req.body);
	if (!validation.success) {
		res.status(400).json({ error: validation.error.issues[0].message });
		return;
	}

	const { jobTitle, difficultyTier } = validation.data;

	const modifier =
		difficultyTier === "Advanced"
			? "Questions must be senior-level, testing deep expertise and leadership."
			: "Questions should focus on general strategy and behavioral aspects.";

	const prompt = `
Generate exactly 3 thoughtful interview questions for a "${jobTitle}" position.
${modifier}
Return ONLY raw JSON — no markdown, no explanation:
{"questions": ["question one", "question two", "question three"]}
`.trim();

	try {
		const completion = await groq.chat.completions.create({
			model: "llama-3.3-70b-versatile",
			messages: [{ role: "user", content: prompt }],
			temperature: 0.7,
			max_tokens: 500,
		});

		const text = completion.choices[0]?.message?.content ?? "";
		const cleaned = text.replace(/```json|```/g, "").trim();
		const parsed = JSON.parse(cleaned);

		if (!Array.isArray(parsed.questions)) {
			throw new Error("Unexpected response shape.");
		}

		res.json({ questions: parsed.questions.slice(0, 3) });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Unknown error";
		console.error("[generate-questions error]", message);
	}
});

// ── Serve static frontend ─────────────────────────────────────────
app.use(express.static(path.join(__dirname)));

app.get("/{*path}", (_req, res) => {
	res.sendFile(path.join(__dirname, "index.html"));
});

// ── Start ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
	console.log(`🚀 Server running at http://localhost:${PORT}`);
	console.log(`📖 Swagger docs  at http://localhost:${PORT}/docs`);
});
