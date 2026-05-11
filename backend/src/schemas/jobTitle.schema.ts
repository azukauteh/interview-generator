

/**
 * Schema: JobTitleSchema
 * ----------------------
 * Defines validation rules for the "title" query parameter.
 * - Uses Zod to enforce type safety and input validation.
 * - Ensures that "title" is a string with a minimum length of 2 characters.
 *
 * Usage:
 *   In controllers, call `JobTitleSchema.safeParse(req.query)` to validate
 *   incoming requests. If validation fails, return a 400 Bad Request.
 *
 * TODO:
 *   - Refine schema for future use (e.g., add max length, regex for allowed characters).
 */

import { z } from "zod";



export const JobTitleSchema = z.object({
  title: z.string().min(2), // must be a string, at least 2 characters long
});

