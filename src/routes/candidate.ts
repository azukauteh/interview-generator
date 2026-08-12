import express from "express";
import Groq from "groq-sdk";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const CandidateRequestSchema = z.object({
	jobRole: z.string().min(2).max(100),
});

router.post(
	"/questions",
	requireAuth,
	requireRole("candidate"),
	async (req, res) => {
		const validation = CandidateRequestSchema.safeParse(req.body);
		if (!validation.success) {
			return res
				.status(400)
				.json({ error: validation.error.issues[0].message });
		}

		const { jobRole } = validation.data;

		const prompt = `
Generate exactly 3 interview questions AND sample answers for a "${jobRole}" role.
Return ONLY raw JSON — no markdown, no explanation:
{"questions": ["..."], "answers": ["..."]}
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

			if (!Array.isArray(parsed.questions) || !Array.isArray(parsed.answers)) {
				throw new Error("Unexpected response shape.");
			}

			return res.json({
				questions: parsed.questions.slice(0, 3),
				answers: parsed.answers.slice(0, 3),
			});
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Unknown error";
			console.error("[candidate/questions error]", message);
			return res.status(500).json({ error: message });
		}
	},
);

export { router };
