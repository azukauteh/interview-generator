/*
 
feat(auth): implement signup route with JWT and bcrypt

- Added /api/auth/signup endpoint in auth.ts
- Validates required fields: email, password, and role
- Enforces role restriction to interviewer or candidate
- Hashes passwords securely using bcryptjs before storing
- Integrated Postgres pool for user persistence
- Configured JWT_SECRET with runtime validation
- Returns JWT token and role on successful signup
- Provides error responses for missing fields, invalid role, duplicate email, and server errors
*/

import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../utils/db";

const router = express.Router();

const JWT_SECRET =
	process.env.JWT_SECRET ??
	(() => {
		throw new Error("JWT_SECRET missing");
	})();

/* SIGNUP*/

router.post("/signup", async (req, res) => {
	const { email, password, role } = req.body;

	if (!email || !password || !role) {
		return res.status(400).json({
			error: "Email, password, and role are required",
		});
	}

	if (!["interviewer", "candidate"].includes(role)) {
		return res.status(400).json({
			error: "Invalid role",
		});
	}

	try {
		const hashedPassword = await bcrypt.hash(password, 10);

		const result = await pool.query(
			`
            INSERT INTO users (email, password_hash, role)
            VALUES ($1, $2, $3)
            RETURNING id
            `,
			[email, hashedPassword, role],
		);

		const userId = result.rows[0].id;

		const token = jwt.sign(
			{
				id: userId,
				role,
			},
			JWT_SECRET,
			{
				expiresIn: "1h",
			},
		);

		return res.status(201).json({
			token,
			role,
		});
	} catch (err: unknown) {
		console.error("Signup error:", err);

		if (
			typeof err === "object" &&
			err !== null &&
			"code" in err &&
			(err as { code: string }).code === "23505"
		) {
			return res.status(409).json({
				error: "An account with this email already exists.",
			});
		}

		return res.status(500).json({
			error: "Signup failed. Please try again.",
		});
	}
});

/* LOGIN*/

router.post("/login", async (req, res) => {
	const { email, password, role } = req.body;

	if (!email || !password || !role) {
		return res.status(400).json({
			error: "Email, password, and role are required",
		});
	}

	if (!["interviewer", "candidate"].includes(role)) {
		return res.status(400).json({
			error: "Invalid role",
		});
	}

	try {
		const result = await pool.query(
			`
            SELECT id, email, password_hash, role
            FROM users
            WHERE email = $1 AND role = $2
            `,
			[email, role],
		);

		const user = result.rows[0];

		if (!user) {
			return res.status(401).json({
				error: "Invalid credentials",
			});
		}

		const passwordMatches = await bcrypt.compare(password, user.password_hash);

		if (!passwordMatches) {
			return res.status(401).json({
				error: "Invalid credentials",
			});
		}

		const token = jwt.sign(
			{
				id: user.id,
				role: user.role,
			},
			JWT_SECRET,
			{
				expiresIn: "1h",
			},
		);

		return res.status(200).json({
			token,
			role: user.role,
		});
	} catch (err: unknown) {
		console.error("Login error:", err);

		return res.status(500).json({
			error: "Login failed. Please try again.",
		});
	}
});

export default router;
