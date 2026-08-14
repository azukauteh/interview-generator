/**
 * server.ts
 *
 * Clean entry point for Interviewer.ai backend.
 *
 * Features:
 * - Express setup with CORS and JSON middleware
 * - Role-based API routes:
 *   • /api/auth → authentication (signup/login)
 *   • /api/interviewer → interviewer dashboard flows
 *   • /api/candidate → candidate prep flows
 *   • /api/questions → shared question generation
 * - Swagger UI mounted at /docs for API documentation
 * - Static frontend served from /public and /assets
 * - Role-specific pages:
 *   • /interviewer → interviewer.html
 *   • /candidate → candidate.html
 *   • / → index.html (login)
 * - Startup logs confirm server port and docs URL
 *
 * Usage:
 *   yarn dev to start the server.
 *   Access Swagger docs at http://localhost:3000/docs
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
app.use("/api", questionsRouter);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));


//Routes
const publicDir = path.join(__dirname, "public");
const assetsDir = path.join(__dirname, "assets");

//Static frontend
app.use("/assets", express.static(assetsDir));
app.use(express.static(publicDir));

// Role-specific pages 
app.get("/interviewer", (_req, res) => {
	res.sendFile(path.join(publicDir, "interviewer.html"));
});

app.get("/candidate", (_req, res) => {
	res.sendFile(path.join(publicDir, "candidate.html"));
});

// Default — login page
app.get("/", (_req, res) => {
	res.sendFile(path.join(publicDir, "index.html"));
});

// Start server 
app.listen(PORT, () => {
	console.log(`🚀 Server running on port ${PORT}`);
	console.log(`📖 Swagger docs available at /docs`);
});
