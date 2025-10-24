4-minute pitch — Prompt-based Customer Service Chatbot

Start (30s)
- Hello, I’m Dinesh. I built a prompt-based customer service chatbot to demonstrate both AI-facing logic and full-stack skills.

Problem (30s)
- Many small businesses need a fast, explainable assistant for common tasks: order tracking, refunds, and complaints. They want something lightweight and transparent, not a black box.

Solution (45s)
- This project uses a prompt-engine: keyword and template-based NLU that recognizes intents, fills response templates, and can escalate to human support. It’s explainable, easy to extend, and shows how real prompt engineering works for practical tasks.

Tech (30s)
- Frontend: React + Tailwind; dark UI with accessible controls.
- Backend: Node + Express, a `promptProcessor` module for intent detection and slot filling.
- Tests, Docker, CI for production-quality demonstration.

Demo (60s)
- Show greeting, order status (ORD1001), start refund, create a ticket.
- Explain the template injection in `responseTemplates.json` and how `promptProcessor` computes confidence.

Conclusion (25s)
- The project demonstrates clear, explainable AI logic, good UI/UX, and production-ready infra. Next steps: add embeddings for semantic NLU and integrate a gated LLM adapter.

Thank you — any questions?
