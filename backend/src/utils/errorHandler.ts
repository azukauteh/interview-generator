/**
 * Middleware: errorHandler
 * ------------------------
 * Global error-handling middleware for Express.
 * - Captures any unhandled errors passed down the middleware chain.
 * - Logs the error stack trace to the console for debugging.
 * - Returns a generic 500 Internal Server Error response to the client.
 *
 * Parameters:
 *   - err: The error object thrown in controllers/services.
 *   - req: The incoming HTTP request.
 *   - res: The HTTP response object used to send error details.
 *   - next: The next middleware function (not used here, but required by Express signature).
 *
 * Usage:
 *   Place this middleware after all routes in index.ts:
 *     app.use(errorHandler);
 *
 * TODO:
 *   - Customize error responses (e.g., include error codes or messages).
 *   - Differentiate between client errors (400) and server errors (500).
 */

import { Request, Response, NextFunction } from "express";


export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log full error stack trace for debugging
  console.error(err.stack);

  // Send generic error response to client
  res.status(500).json({ error: "oopss! Something went wrong!" });
};

