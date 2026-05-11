/**
 * Application Entry Point (index.ts)
 * ----------------------------------
 * - Initializes the Express application.
 * - Registers middleware (JSON parsing).
 * - Mounts API routes ( /questions).
 * - Sets up Swagger UI for API documentation.
 * - Starts the server on the configured port.
 */


import express from "express";
import dotenv from "dotenv";
import * as swaggerUi from "swagger-ui-express";
import swaggerSpec from "./docs/swagger";
import questionsRouter from "./routes/questions";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use("/questions", questionsRouter);

// Swagger Docs
app.use("/docs", swaggerUi.serve as any, swaggerUi.setup(swaggerSpec) as any);


// Root
app.get("/", (req, res) => {
  res.send("Interview Questions API is running 🚀");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

