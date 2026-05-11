
---

# Backend Developer Guide

This backend powers the **Interview Generator API**. It’s built with **Express + TypeScript**, validated with **Zod**, and documented via **Swagger**.  
Deployment is handled via **Render** (backend) and Vercel (frontend).
---

## ⚙️ Setup

1. **Install dependencies**
   ```bash
   yarn install
   ```

2. **Create `.env` file**
   ```env
   GEMINI_API_KEY=your-api-key
   PORT=4000
   NODE_ENV=development
   ```

3. **Run dev server**
   ```bash
   yarn dev
   ```

4. **Build for production**
   ```bash
   yarn build
   yarn start
   ```

---

## 📂 Project Structure

```
backend/
├── src/
│   ├── controllers/          # Business logic (e.g., getQuestions)
│   ├── routes/               # Express routers
│   ├── schemas/              # Zod schemas for validation
│   ├── middleware/           # Error handler, logging
│   ├── docs/                 # Swagger config
│   └── index.ts              # App entry point
├── tsconfig.json             # TypeScript config
├── package.json              # Dependencies & scripts
└── README.md                 # Developer guide
```

---

## 🧪 Development Workflow

- **Linting**  
  ```bash
  yarn lint
  yarn lint:fix
  ```

- **Type checking**  
  ```bash
  yarn typecheck
  ```

- **Formatting**  
  ```bash
  yarn format
  ```

---

## 🔑 API Endpoints

- **GET /questions**  
  Query params: title=Customer Success Manager  
  Returns: array of interview questions

- **GET /docs**  
  Swagger UI documentation

---

## 🚀 Deployment (Render)

- **Build command**: `yarn build`  
- **Start command**: `yarn start`  
- **Environment variables** configured in Render dashboard:
  - `GEMINI_API_KEY`
  - `NODE_ENV=production`
  - `FRONTEND_URL=https://frontend.vercel.app`

Render provides a persistent Node.js environment, ideal for Express apps.  
Frontend is deployed separately on Vercel, consuming backend via `NEXT_PUBLIC_API_URL`.

---

## 🛠 Tools & Stack

| Tool / Stack | Purpose |
|--------------|---------|
| **Express** | Web framework for API routes |
| **TypeScript** | Strong typing for backend |
| **Zod** | Schema validation |
| **Swagger** | API documentation |
| **Biome** | Linting & formatting |
| **dotenv** | Environment variable management |
| **Render** | Backend hosting |
| **Vercel** | Frontend hosting |

---
