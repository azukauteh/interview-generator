import jwt, { type SignOptions } from "jsonwebtoken";

const JWT_SECRET: string =
	process.env.JWT_SECRET ??
	(() => {
		throw new Error("JWT_SECRET is not defined in environment variables");
	})();

export function signToken(
	payload: { id: string; role: "interviewer" | "candidate" },
	expiresIn: SignOptions["expiresIn"] = "15m",
) {
	return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string) {
	return jwt.verify(token, JWT_SECRET);
}
