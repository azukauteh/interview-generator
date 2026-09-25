import { Type } from "@google/genai";
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
		const prompt =
			`Generate exactly 3 interview questions AND a sample answer for each question for a "${jobRole}" role at the ${level} experience level.
				${levelModifier[level]}
				Return a JSON object with exactly this structure:
				{
				  "questions": [
				  "question one",
				  "question two",
				  "question three" ],
				  "answers": [
				  "sample answer one",
				  "sample answer two",
				  "sample answer three"
				  ]
			}
			Each question must have a corresponding answer at the same array index.
				Do not include markdown, code fences, explanations, or additional fields.`.trim();
		try {
			// Questions + prose answers is a bigger payload than the
			// interviewer route's questions-only response — needs its own
			// token budget, not the shared default. responseSchema forces
			// the shape (two arrays, both length 3), so a truncation now
			// shows up as a token-budget problem worth re-tuning, not a
			// shape/markdown-fence problem.
			const text = await generateText(prompt, {
				maxOutputTokens: 2048,
				responseSchema: {
					type: Type.OBJECT,
					properties: {
						questions: {
							type: Type.ARRAY,
							items: { type: Type.STRING },
							minItems: 3,
							maxItems: 3,
						},
						answers: {
							type: Type.ARRAY,
							items: { type: Type.STRING },
							minItems: 3,
							maxItems: 3,
						},
					},
					required: ["questions", "answers"],
				},
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
