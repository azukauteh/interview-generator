/*
chore(types): extend Express Request with user object

- Augmented express-serve-static-core Request interface
- Added optional user property containing id and role
- Supported roles: interviewer | candidate
- Enables type-safe access to authenticated user context in middleware and routes
*/

import "express";

declare module "express-serve-static-core" {
	interface Request {
		user?: {
			id: string;
			role: "interviewer" | "candidate";
		};
	}
}
