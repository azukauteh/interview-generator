/**
 
feat(auth): add JWT authentication middleware

- Implemented requireAuth middleware to validate JWT tokens
- Ensures JWT_SECRET is defined at runtime, throws error if missing
- Extracts token from Authorization header and verifies with jsonwebtoken
- Attaches user object (id, role) to Express Request for downstream use
- Handles error cases: missing token, invalid payload, expired token
- Provides consistent 401 responses for unauthorized requests
*/

import type { NextFunction, Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";

const JWT_SECRET: string =
	process.env.JWT_SECRET ??
	(() => {
		throw new Error("JWT_SECRET is not defined");
	})();

export function requireAuth(req: Request, res: Response, next: NextFunction) {
	const token = req.headers.authorization?.split(" ")[1];
	if (!token) return res.status(401).json({ error: "Missing token" });

	try {
		const payload = jwt.verify(token, JWT_SECRET) as JwtPayload | string;
		if (typeof payload === "string") {
			return res.status(401).json({ error: "Invalid token payload" });
		}
		req.user = {
			id: payload.id as string,
			role: payload.role as "interviewer" | "candidate",
		};
		next();
	} catch {
		return res.status(401).json({ error: "Invalid or expired token" });
	}
}
