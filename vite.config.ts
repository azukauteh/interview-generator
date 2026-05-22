/**
 * vite.config.ts
 *
 * Vite configuration for Interviewer.ai frontend.
 *
 * Responsibilities:
 * - Bundles and serves the TypeScript + Tailwind CSS frontend
 * - Proxies /api and /docs requests to the Express backend (port 3000)
 *   so the frontend can call the API without CORS issues in development
 * - Supports path aliasing via "@" for cleaner imports
 * - Respects DISABLE_HMR env var (used in AI Studio / agent environments)
 *
 * Dev servers:
 * - Frontend → http://localhost:5173
 * - Backend  → http://localhost:3000 (see server.ts)
 *
 * @author  Uteh.A
 * @version 1.0.0
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
	plugins: [tailwindcss()],
	resolve: {
		alias: { "@": path.resolve(__dirname, ".") },
	},
	server: {
		port: 5173,
		hmr: process.env.DISABLE_HMR !== "true",
		watch: process.env.DISABLE_HMR === "true" ? null : {},
		proxy: {
			"/api": "http://localhost:3000",
			"/docs": "http://localhost:3000",
		},
	},
});
