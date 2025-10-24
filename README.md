<<<<<<< HEAD
# Prompt-based Customer Service Chatbot

**Short:** A dark-themed portfolio project demonstrating a prompt-based customer service assistant built with React + Tailwind (frontend) and Node.js + Express (backend). It contains a small prompt-engine (intent detection + templating) and optional adapters for LLMs.

## Features
- Prompt-based NLU (intent detection, slot filling)
- Prebuilt intents: greeting, order_status, refund, shipping, cancel, complaint, escalation
- Demo orders dataset and response templates
- Chat UI (dark theme), localStorage save, session ID, request human support
- Unit tests and CI
- Docker + docker-compose

## Architecture (simple ASCII)

```
[Frontend (React+Tailwind)] <--> [Backend Express / promptProcessor] --> [mock data / optional OpenAI adapter]
```

## Run locally (dev)
1. Clone repo
2. Copy `.env.example` to `.env` and edit if needed
3. Start backend:
```bash
cd backend
npm ci
npm run dev
```
4. Start frontend:
```bash
cd frontend
npm ci
npm run dev
```
5. Open http://localhost:5173

## Backend endpoints

POST /api/chat → { sessionId, message } returns { reply, intent, confidence, metadata }

POST /api/ticket → create simulated ticket

GET /api/mock-orders/:orderId → get demo order

## How prompt-based engine works

Uses keywords and token overlap to detect intent.

Finds slots (orderId) by regex, fills response templates from data/responseTemplates.json.

Returns confidence score (heuristic).

Logs decision for transparency (useful in interview).

## Tests

Backend tests: cd backend && npm test

Frontend test (if added): cd frontend && npm test

## Deploy

Frontend: Vercel (build command npm run build, output dist).

Backend: Render / Heroku / Render Docker using backend/Dockerfile.

## Future improvements

Replace heuristic NLU with embeddings + classifier

Add analytics and conversation transcripts storage (MongoDB)

Real LLM integration with rate-limits and safety checks
=======
# Customer-Service-Chatbot
>>>>>>> b86d274f1a6cc193c55c086536205a31d296e450
