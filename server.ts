/*feat(server): clean entry point with role-based routes and Swagger docs

- Added Express setup with CORS and JSON middleware
- Mounted /api/auth, /api/interviewer, and /api/candidate routes
- Integrated Swagger UI at /docs using src/docs/swagger.ts
- Served static frontend from /public directory
- Added role-specific pages (interviewer.html, candidate.html)
- Default route serves index.html for login
- Ensured server listens on PORT with startup logs
*/

import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./src/docs/swagger.js";
import authRoutes from "./src/routes/auth";
import { router as candidateRoutes } from "./src/routes/candidate";
import interviewerRoutes from "./src/routes/interviewer";
import { router as questionsRouter } from "./src/routes/questions.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/interviewer", interviewerRoutes);
app.use("/api/candidate", candidateRoutes);

/*Routes */
app.use("/api", questionsRouter);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/*Static frontend*/
app.use(express.static(path.join(__dirname, "public")));

/* Role-specific pages */
app.get("/api/interviewer", (_req, res) => {
	res.sendFile(path.join(__dirname, "public", "interviewer.html"));
});
app.get("/api/candidate", (_req, res) => {
	res.sendFile(path.join(__dirname, "public", "candidate.html"));
});

/* Default — login page*/
app.get("/{*path}", (_req, res) => {
	res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* Start server */
app.listen(PORT, () => {
	console.log(`🚀 Server running at http://localhost:${PORT}`);
	console.log(`📖 Swagger docs  at http://localhost:${PORT}/docs`);
});
