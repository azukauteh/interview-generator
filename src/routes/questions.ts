import dotenv from "dotenv";
import express from "express";
import Groq from "groq-sdk";
import { z } from "zod";

dotenv.config();

const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const QuestionRequestSchema = z.object({
	jobTitle: z.string().min(2).max(100),
	difficultyTier: z
		.enum(["Standard", "Advanced"])
		.optional()
		.default("Standard"),
});

router.post("/generate-questions", async (req, res) => {
	const validation = QuestionRequestSchema.safeParse(req.body);
	if (!validation.success) {
		return res.status(400).json({ error: validation.error.issues[0].message });
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

		return res.json({ questions: parsed.questions.slice(0, 3) });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Unknown error";
		console.error("[generate-questions error]", message);
		return res.status(500).json({ error: message });
	}
});

export { router };
