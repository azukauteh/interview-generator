import { Type } from "@google/genai";
import express from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { generateText } from "../services/gemini.js";

/*
 * Interviewer question generation endpoint.
 *
 * - Requires an authenticated user with the interviewer role.
 * - Validates the requested job title and difficulty tier with Zod.
 * - Builds a role-specific interview question prompt.
 * - Uses Gemini to generate exactly three questions.
 * - Cleans and parses the AI response as JSON.
 * - Validates the expected response structure.
 * - Returns a consistent JSON response to the interviewer dashboard.
 */
const router = express.Router();
const QuestionRequestSchema = z.object({
	jobTitle: z.string().min(2).max(100),
	difficultyTier: z
		.enum(["Standard", "Advanced"])
		.optional()
		.default("Standard"),
});
router.post(
	"/questions",
	requireAuth,
	requireRole("interviewer"),
	async (req, res) => {
		const validation = QuestionRequestSchema.safeParse(req.body);
		if (!validation.success) {
			return res.status(400).json({
				error: validation.error.issues[0].message,
			});
		}
		const { jobTitle, difficultyTier } = validation.data;
		const modifier =
			difficultyTier === "Advanced"
				? "Questions must be senior-level, testing deep expertise and leadership."
				: "Questions should focus on general strategy and behavioral aspects.";
		const prompt =
			`Generate exactly 3 thoughtful interview questions for a "${jobTitle}" position.${modifier}
				Return a JSON object with exactly this structure:
					{
					"questions": [
					"question one",
					"question two",
					"question three"
					]
				}
				Do not include markdown or any additional fields.`.trim();
		try {
			const text = await generateText(prompt, {
				maxOutputTokens: 800,
				responseSchema: {
					type: Type.OBJECT,
					properties: {
						questions: {
							type: Type.ARRAY,
							items: { type: Type.STRING },
							minItems: 3,
							maxItems: 3,
						},
					},
					required: ["questions"],
				},
			});
			const cleaned = text.replace(/```json|```/g, "").trim();
			const parsed = JSON.parse(cleaned);
			if (!Array.isArray(parsed.questions)) {
				throw new Error("Unexpected response shape.");
			}
			return res.json({
				questions: parsed.questions.slice(0, 3),
			});
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Unknown error";
			console.error("[interviewer/questions error]", message);
			return res.status(500).json({
				error: message,
			});
		}
	},
);
export default router;
