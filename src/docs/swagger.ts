/**
 * swagger.ts — OpenAPI 3.0 docs for Interviewer.ai
 *
 * Defines authentication, interviewer, and candidate endpoints.
 * Uses helper functions to keep schemas and responses DRY.
 */

const bearer = { bearerAuth: [] };

/* Shared Schemas */
const errorSchema = {
	type: "object",
	properties: { error: { type: "string", example: "Invalid request" } },
};

const authResponseSchema = {
	type: "object",
	properties: {
		token: { type: "string", description: "JWT access token" },
		role: { type: "string", enum: ["interviewer", "candidate"] },
	},
};

/* Helpers */
function jsonBody(schema: object) {
	return { required: true, content: { "application/json": { schema } } };
}

function jsonResponse(description: string, schema: object) {
	return { description, content: { "application/json": { schema } } };
}

const authResponses = {
	400: jsonResponse("Validation error", errorSchema),
	401: jsonResponse("Missing or invalid token", errorSchema),
	403: jsonResponse("Insufficient permissions", errorSchema),
	500: jsonResponse("Server error", errorSchema),
};

/* Swagger Document */
const swaggerDocument = {
	openapi: "3.0.0",
	info: {
		title: "Interviewer.ai API",
		version: "1.0.0",
		description:
			"Role-based interview question generator. Interviewers generate questions; candidates receive sample answers.",
	},
	components: {
		securitySchemes: {
			bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
		},
		schemas: { Error: errorSchema, AuthResponse: authResponseSchema },
	},

	paths: {
		/* Auth */
		"/api/auth/signup": {
			post: {
				tags: ["Auth"],
				summary: "Register a new user",
				requestBody: jsonBody({
					type: "object",
					required: ["email", "password", "role"],
					properties: {
						email: {
							type: "string",
							format: "email",
							example: "user@example.com",
						},
						password: { type: "string", minLength: 8, example: "password123" },
						role: { type: "string", enum: ["interviewer", "candidate"] },
					},
				}),
				responses: {
					200: jsonResponse("Account created", authResponseSchema),
					400: jsonResponse("Missing or invalid fields", errorSchema),
					409: jsonResponse("Email already registered", errorSchema),
					500: jsonResponse("Server error", errorSchema),
				},
			},
		},

		"/api/auth/login": {
			post: {
				tags: ["Auth"],
				summary: "Login and receive a JWT",
				requestBody: jsonBody({
					type: "object",
					required: ["email", "password", "role"],
					properties: {
						email: {
							type: "string",
							format: "email",
							example: "user@example.com",
						},
						password: { type: "string", example: "password123" },
						role: { type: "string", enum: ["interviewer", "candidate"] },
					},
				}),
				responses: {
					200: jsonResponse("Login successful", authResponseSchema),
					400: jsonResponse("Missing fields", errorSchema),
					401: jsonResponse("Invalid credentials", errorSchema),
					500: jsonResponse("Server error", errorSchema),
				},
			},
		},

		/*Interviewer */
		"/api/interviewer/questions": {
			post: {
				tags: ["Interviewer"],
				summary: "Generate 3 interview questions",
				security: [bearer],
				requestBody: jsonBody({
					type: "object",
					required: ["jobTitle"],
					properties: {
						jobTitle: {
							type: "string",
							minLength: 2,
							maxLength: 100,
							example: "Customer Success Manager",
						},
						difficultyTier: {
							type: "string",
							enum: ["Standard", "Advanced"],
							default: "Standard",
						},
					},
				}),
				responses: {
					200: jsonResponse("Questions generated", {
						type: "object",
						properties: {
							questions: { type: "array", items: { type: "string" } },
						},
					}),
					...authResponses,
				},
			},
		},

		/* Candidate */
		"/api/candidate/questions": {
			post: {
				tags: ["Candidate"],
				summary: "Generate questions with sample answers",
				security: [bearer],
				requestBody: jsonBody({
					type: "object",
					required: ["jobRole"],
					properties: {
						jobRole: {
							type: "string",
							minLength: 2,
							maxLength: 100,
							example: "Customer Success Manager",
						},
					},
				}),
				responses: {
					200: jsonResponse("Questions and answers generated", {
						type: "object",
						properties: {
							questions: { type: "array", items: { type: "string" } },
							answers: { type: "array", items: { type: "string" } },
						},
					}),
					...authResponses,
				},
			},
		},
	},
};

export default swaggerDocument;
