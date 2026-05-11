/**
 * Controller: getQuestions
 * ------------------------
 * Handles GET /questions requests.
 * - Validates query params using Zod schema (JobTitleSchema).
 * - Calls Gemini service to generate interview questions.
 * - Returns JSON response with questions or error message.
 */

import { Request, Response } from "express";
import { fetchQuestions } from "../services/ai.service";
import { JobTitleSchema } from "../schemas/jobTitle.schema";



export const getQuestions = async (req: Request, res: Response) => {
  // Validate query parameters against schema
  const parseResult = JobTitleSchema.safeParse(req.query);

  if (!parseResult.success) {
    // If validation fails, return 400 Bad Request
    return res.status(400).json({ error: "job title invalid" });
  }

  // Extract validated job title
  const { title } = parseResult.data;

  try {
    // Call Gemini AI service to generate questions
    const questions = await fetchQuestions(title);

    // Return questions in JSON format
    res.json({ questions });
  } catch (err) {
    // Catch unexpected errors (e.g., API failure)
    res.status(500).json({ error: "Failed to fetch questions" });
  }
};

