````md id="7jz2wp"
# Backend Developer Guide

Backend service for the Interview Questions Generator platform.

This API is built with a production-oriented TypeScript architecture using Express, Zod validation, Swagger documentation, and Gemini AI integration.

The backend is responsible for:
- validating incoming requests
- generating AI-powered interview questions
- handling API errors consistently
- exposing documented REST endpoints

---

# Overview

The backend acts as a secure intermediary between the frontend application and the Gemini API.

```text
Frontend (React + TypeScript)
        ↓
Express API (TypeScript)
        ↓
Gemini API
````

This architecture keeps API keys secure while enabling centralized validation, logging, and error handling.

---

# Tech Stack

| Tool / Stack | Purpose                         |
| ------------ | ------------------------------- |
| Express      | Backend API framework           |
| TypeScript   | Type-safe backend development   |
| Zod          | Request validation              |
| Swagger      | Interactive API documentation   |
| Biome        | Linting and formatting          |
| dotenv       | Environment variable management |
| Render       | Backend deployment              |
| Vercel       | Frontend deployment             |

---

# Local Development Setup

## 1. Install Dependencies

Using Yarn:

```bash id="rwkn22"
yarn install
```

---

## 2. Configure Environment Variables

Create a `.env` file in the backend root directory:

```env id="b6hj0z"
GEMINI_API_KEY=your-api-key
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

---

## 3. Start Development Server

```bash id="v1d3xg"
yarn dev
```

The backend server will run on:

```text id="vtcefk"
http://localhost:4000
```

---

# Production Build

Build the application:

```bash id="9vx2r6"
yarn build
```

Start production server:

```bash id="z5hff9"
yarn start
```

---

# Project Structure

```text id="3y1t74"
backend/
├── src/
│   ├── controllers/          # Route controller logic
│   ├── routes/               # Express route definitions
│   ├── services/             # External API integrations
│   ├── schemas/              # Zod validation schemas
│   ├── middleware/           # Error handling & middleware
│   ├── docs/                 # Swagger/OpenAPI configuration
│   ├── config/               # Environment configuration
│   ├── types/                # Shared TypeScript interfaces
│   └── index.ts              # Express application entry
│
├── tsconfig.json             # TypeScript configuration
├── package.json              # Project dependencies & scripts
├── biome.json                # Biome configuration
└── README.md                 # Backend developer guide
```

---

# API Endpoints

## Generate Interview Questions

```http id="e52nzs"
POST /api/questions
```

### Request Body

```json id="n7mz7o"
{
  "jobTitle": "Customer Success Manager"
}
```

### Successful Response

```json id="8d9cw6"
{
  "success": true,
  "data": {
    "jobTitle": "Customer Success Manager",
    "questions": [
      "How do you reduce customer churn?",
      "What metrics define customer success?",
      "Describe handling a difficult client relationship."
    ]
  }
}
```

### Error Response

```json id="8mjlwm"
{
  "success": false,
  "message": "Invalid request body"
}
```

---

# API Documentation

Interactive Swagger/OpenAPI documentation is available at:

```text id="kt2myj"
/docs
```

Swagger documentation includes:

* endpoint definitions
* request schemas
* response schemas
* validation rules
* example payloads
* error responses

---

# Validation Strategy

All incoming requests are validated using Zod schemas before reaching business logic.

Example schema responsibilities:

* validate required fields
* enforce string length limits
* prevent malformed requests

Example:

```typescript id="13a0lh"
jobTitle: z.string().min(2).max(100)
```

### Future Validation Improvements

```text id="xjnlmr"
TODO:
- Add sanitization middleware
- Add profanity filtering
- Add AI prompt safety validation
- Add request rate limiting
- Add role category validation
```

---

# Development Workflow

## Linting

```bash id="x4j2tc"
yarn lint
```

Auto-fix issues:

```bash id="njlwmv"
yarn lint:fix
```

---

## Type Checking

```bash id="1x6h3r"
yarn typecheck
```

---

## Formatting

```bash id="qv7w3v"
yarn format
```

---

# Error Handling

Centralized error handling middleware ensures:

* consistent API responses
* cleaner controller logic
* safer production behavior

Error responses follow a standardized JSON structure.

---

# Postman Testing

A Postman collection is included for endpoint testing.

Location:

```text id="3nk5x8"
docs/postman_collection.json
```

Included test cases:

* successful request
* validation failure
* malformed request
* missing job title
* Gemini API failure simulation

---

# Deployment

## Backend Deployment

Backend is deployed using:

[Render](https://render.com?utm_source=chatgpt.com)

### Render Configuration

Build command:

```bash id="1r0g9v"
yarn build
```

Start command:

```bash id="jlwmvh"
yarn start
```

### Production Environment Variables

```env id="q8r89t"
GEMINI_API_KEY=your-production-key
NODE_ENV=production
FRONTEND_URL=https://frontend.vercel.app
```

---

## Frontend Deployment

Frontend is deployed separately using:

[Vercel](https://vercel.com?utm_source=chatgpt.com)

The frontend consumes the backend API via environment variables.

Example:

```env id="hj2z3j"
VITE_API_URL=https://backend.onrender.com
```

---

# Engineering Practices

This project follows several production-oriented engineering practices:

* Type-safe backend architecture
* Schema-first validation
* RESTful API conventions
* Modular folder structure
* Separation of concerns
* Centralized error handling
* Environment-based configuration
* Interactive API documentation
* Consistent response formatting

---

# Future Improvements

```text id="t9rv0q"
- Add authentication and authorization
- Add persistent database storage
- Add Redis caching
- Add request analytics
- Add AI model selection
- Add logging and monitoring
- Add automated testing pipeline
- Add CI/CD workflows
```

```
```

