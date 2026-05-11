
/**
 * Schema: QuestionsResponseSchema
 * -------------------------------
 * Defines the expected shape of the API response for /questions.
 * - Uses Zod to enforce type safety and response validation.
 * - Ensures that the response contains a "questions" property.
 * - "questions" must be an array of strings (each string = one interview question).
 *
 * Usage:
 *   In controllers or tests, you can validate the response object:
 *     QuestionsResponseSchema.parse(responseBody);
 *
 * TODO:
 *   - Refine schema for future use (e.g., add constraints like min/max array length).
 *   - Consider adding metadata (e.g., job title, timestamp) for future versions.
 */

import { z } from "zod";



export const QuestionsResponseSchema = z.object({
  questions: z.array(z.string()), // must be an array of strings
});

