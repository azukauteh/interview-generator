/*
 * feat(vite): add page redirects and multi-page build config
 * Introduced custom Vite plugin `page-redirects` to handle route mapping
 *  • "/" → /public/index.html
 *  "/interviewer" → /public/interviewer.html
 *  • "/candidate" → /public/candidate.html
 *  Integrated TailwindCSS plugin with Vite
 *  Added path alias "@" pointing to project root
 *  Configured Rollup build inputs for login, interviewer, and candidate pages
 *   Ensured clean resolution of __dirname and __filename in ESM context
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pageRedirects: Plugin = {
	name: "page-redirects",
	configureServer(server) {
		server.middlewares.use((req, _res, next) => {
			const map: Record<string, string> = {
				"/": "/public/index.html",
				"/interviewer": "/public/interviewer.html",
				"/candidate": "/public/candidate.html",
			};
			if (req.url && map[req.url]) req.url = map[req.url];
			next();
		});
	},
};

export default defineConfig({
	plugins: [tailwindcss(), pageRedirects],
	resolve: {
		alias: { "@": path.resolve(__dirname, ".") },
	},
	build: {
		rollupOptions: {
			input: {
				login: path.resolve(__dirname, "public/index.html"),
				interviewer: path.resolve(__dirname, "public/interviewer.html"),
				candidate: path.resolve(__dirname, "public/candidate.html"),
			},
		},
	},
	server: {
		port: 5173,
		hmr: process.env.DISABLE_HMR !== "true",
		watch: process.env.DISABLE_HMR === "true" ? null : {},
		proxy: {
			"/api": "http://localhost:3000",
			"/auth": "http://localhost:3000",
			"/docs": "http://localhost:3000",
		},
	},
});
