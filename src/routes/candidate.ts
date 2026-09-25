import express from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { generateText } from "../services/gemini.js";

/*
 * Candidate interview preparation endpoint.
 *
 * - Requires an authenticated user with the candidate role.
 * - Validates the target job role with Zod.
 * - Builds a role-specific preparation prompt.
 * - Uses Gemini to generate three interview questions and sample answers.
 * - Cleans and parses the AI response as JSON.
 * - Validates the expected questions and answers structure.
 * - Returns a consistent response to the candidate dashboard.
 */
const router = express.Router();

const CandidateRequestSchema = z.object({
	jobRole: z.string().min(2).max(100),
	level: z
		.enum(["Entry", "Junior", "Mid", "Senior"])
		.optional()
		.default("Entry"),
});

router.post(
	"/questions",
	requireAuth,
	requireRole("candidate"),
	async (req, res) => {
		const validation = CandidateRequestSchema.safeParse(req.body);
		if (!validation.success) {
			return res.status(400).json({
				error: validation.error.issues[0].message,
			});
		}

		const { jobRole, level } = validation.data;
		const levelModifier: Record<string, string> = {
			Entry:
				"Questions should suit someone with little to no professional experience — focus on fundamentals, willingness to learn, and basic problem-solving.",
			Junior:
				"Questions should suit 1-2 years of experience — some independent work, but still developing judgment and depth.",
			Mid: "Questions should suit 3-5 years of experience — solid independent ownership, some mentoring, and deeper technical/domain judgment.",
			Senior:
				"Questions should suit 6+ years of experience — leadership, architectural/strategic decisions, and mentoring others.",
		};

		const prompt = (
			`Generate exactly 3 interview questions AND a sample answer for each question ` +
			`for a "${jobRole}" role at the ${level} experience level.\n\n` +
			`${levelModifier[level]}\n\n` +
			`Return a JSON object with exactly this structure:\n` +
			`{\n  "questions": [\n    "question one",\n    "question two",\n    "question three"\n  ],\n` +
			`  "answers": [\n    "sample answer one",\n    "sample answer two",\n    "sample answer three"\n  ]\n}\n\n` +
			`Each question must have a corresponding answer at the same array index.\n` +
			`Do not include markdown, code fences, explanations, or additional fields.`
		).trim();

		try {
			const text = await generateText(prompt, {
				maxOutputTokens: 2048,
			});

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
			return res.status(500).json({
				error: message,
			});
		}
	},
);

export { router };
