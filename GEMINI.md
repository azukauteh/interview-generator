# interview-generator (Interviewer.ai)

AI-powered interview question generator. Job title in, AI-generated interview
questions out. Role-based flows for interviewers and candidates. Started as a
take-home assessment, now an active product build.

## Package manager

**yarn, not npm.** Never run `npm install` in this repo — use `yarn add` /
`yarn add -D`. Global tool installs (CLIs, not project deps) are the only
exception and don't matter either way since they're outside the project.

## Stack

- Frontend: vanilla TypeScript, Vite, Tailwind CSS. Three HTML pages: login,
  interviewer dashboard, candidate prep.
- Backend: Node.js, Express 5, TypeScript. `server.ts` at repo root. Routes in
  `src/routes/`, shared utilities in `src/utils/`, AI layer in
  `src/services/gemini.ts`.
- Database: Supabase PostgreSQL via the connection pooler (port 6543 — WSL
  breaks on the direct connection due to IPv6 incompatibility, always use the
  pooler URL).
- Auth: bcryptjs + JWT.
- Validation: Zod.
- AI: Google Gemini via `@google/genai` SDK. See "AI backend" below.
- Testing: Vitest — `npx vitest run` with `GEMINI_API_KEY=test-key` (or real
  key) set in the environment.
- Linting/formatting: Biome — `npx @biomejs/biome check --write`.
- API docs: Swagger UI.
- CI/CD: GitHub Actions. Deploy: Render, auto-deploys on push to the active
  branch (currently `feat/AI_interview`).

## Import style

ESM with `.js` extensions on relative TypeScript imports
(`import { foo } from "./bar.js"`, even though the source file is
`bar.ts`). Preserve this on every new import — it's required for the ESM
build to resolve, not a style preference.

## AI backend — read this before touching src/services/gemini.ts

Migrated from Groq to Google Gemini after Groq deprecated
`llama-3.3-70b-versatile`. Model availability on both providers has been
volatile — hardcoding a model string has broken this service multiple times
(404s on decommissioned models, 503s on undersupplied new-release models).

Current approach: `src/services/gemini.ts` reads the primary model from
`GEMINI_MODEL` in `.env` (never hardcode a model string as the only option)
and falls through a `MODEL_CHAIN` on 503/UNAVAILABLE only — non-503 errors
(404 bad model, 400, 403) fail fast, they're config errors that won't
resolve by retrying or switching models.

Before changing the model chain, verify what's actually live on the current
API key — don't guess from a blog post or training data, model
availability differs per key and changes often:

```bash
export $(grep -v '^#' .env | xargs)
curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY" | jq -r '.models[].name'
```

Any change to `src/services/gemini.ts` requires the matching update to
`tests/gemini-model.test.ts` in the same commit — it locks in env-driven
model selection, retry/fallback behavior, and backoff timing. Don't ship
one without the other.

## Gemini CLI itself (this tool)

This project's `.gemini/.env` pins `GEMINI_MODEL` for CLI sessions
separately from the app's own `.env` — project `.env` vars are excluded
from gemini-cli by design, they don't leak in automatically. If the model
shown in the CLI status bar doesn't match what you expect, check
`.gemini/.env` first, not the project root `.env`.

Gemini CLI sessions call the same `generativelanguage.googleapis.com` API,
same key, same rate-limit pool as the running app. Heavy CLI use while the
dev server is also making Gemini calls can exhaust the free-tier quota
faster than either alone would.

## Roadmap context

Currently Phase 1–2 (functional MVP complete, UI/UX polish underway:
empty states, loading states, inline styles, question card display).
Long-term: WhatsApp API integration, B2B SaaS pricing, South African
payment providers (Ozow, PayFast).

## Working conventions

- Centralize shared clients/utilities as singletons (see `gemini.ts`'s
  module-level client) rather than re-instantiating per route file.
- Regression tests exist specifically to catch hardcoded/deprecated model
  strings creeping back in — don't remove or weaken them to make a change
  land faster.
- Express 5 requires `/{*path}` for wildcard routes, not `*`.
- Production Vite build outputs to `dist/public/` — explicit Express
  routes are needed for `/assets`, and redirect paths differ between dev
  and prod.
