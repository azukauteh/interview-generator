/*
 
feat(auth): add JWT auth and role-based middleware

- Implemented requireAuth middleware to validate JWT tokens
  • Ensures JWT_SECRET is defined at runtime
  • Extracts token from Authorization header and verifies with jsonwebtoken
  • Attaches user object (id, role) to Express Request
  • Returns 401 for missing header, invalid, or expired tokens
- Implemented requireRole middleware for role-based access control
  • Accepts interviewer or candidate role
  • Validates authenticated user and enforces correct role
  • Returns 401 if not authenticated, 403 if role mismatch
- Provides consistent error responses for unauthorized and forbidden requests
*/

import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET =
	process.env.JWT_SECRET ??
	(() => {
		throw new Error("JWT_SECRET missing");
	})();

export function requireAuth(req: Request, res: Response, next: NextFunction) {
	const authHeader = req.headers.authorization;
	if (!authHeader)
		return res.status(401).json({ error: "Missing Authorization header" });

	const token = authHeader.split(" ")[1];
	try {
		const payload = jwt.verify(token, JWT_SECRET) as {
			id: string;
			role: string;
		};
		req.user = {
			id: payload.id as string,
			role: payload.role as "interviewer" | "candidate",
		};
		next();
	} catch {
		return res.status(401).json({ error: "Invalid token" });
	}
}

export function requireRole(role: "interviewer" | "candidate") {
	return (req: Request, res: Response, next: NextFunction) => {
		const user = req.user;
		if (!user) return res.status(401).json({ error: "Not authenticated" });
		if (user.role !== role)
			return res.status(403).json({ error: "Forbidden: wrong role" });
		next();
	};
}
