/**
 * Route: /questions
 * -----------------
 * Handles GET requests for interview question generation.
 * - Delegates logic to the questions controller (`getQuestions`).
 * - Swagger JSDoc block documents the endpoint for API docs.
 *
 * Path: /questions
 * Method: GET
 * Query Params:
 *   - title (string, required): The job title to generate questions for.
 *
 * Responses:
 *   200: Returns an array of generated interview questions.
 *   400: Invalid or missing job title.
 *   500: Internal error while fetching questions.
 */


import { Router } from "express";
import { getQuestions } from "../controllers/questions.controller";

const router = Router();

/**
 * @swagger
 * /questions:
 *   get:
 *     summary: Generate interview questions for a given job title
 *     description: Calls the Gemini API to generate 3 thoughtful interview questions.
 *     parameters:
 *       - in: query
 *         name: title
 *         required: true
 *         schema:
 *           type: string
 *         description: The job title (e.g. "Customer Success Manager")
 *     responses:
 *       '200':
 *         description: A list of generated interview questions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: string
 *             examples:
 *               success:
 *                 value:
 *                   questions:
 *                     - "What motivated you to apply for this role?"
 *                     - "How do you handle customer complaints?"
 *                     - "Describe a time you improved a process."
 */
router.get("/", getQuestions);

export default router;

