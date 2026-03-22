# AI Book Editor

A writing environment built for long-form content. Instead of treating AI as a chatbot that spits out text, this tool treats it as a collaborator that understands your entire manuscript — even when the manuscript is too long to fit in a single prompt.

The core idea: after every chapter the AI writes, the system automatically summarizes it and feeds that compressed memory forward. By chapter 20, the AI still knows what happened in chapter 1, without needing the full text.

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 18, Vite, TipTap v2, Zustand, Tailwind CSS |
| Backend | Python 3.11, FastAPI, SQLAlchemy, SQLite, Alembic |
| AI | OpenAI GPT-4o-mini (primary), Ollama qwen2.5:7b (local fallback) |

## Getting Started

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate  # macOS / Linux
pip install -r requirements.txt
cp .env.example .env         # then add your OPENAI_API_KEY
alembic upgrade head
uvicorn main:app --reload
```

API: http://localhost:8000 — Swagger docs at http://localhost:8000/docs

### Tests

```bash
cd backend
pip install -r requirements.txt   # includes pytest
python -m pytest tests -v
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

## Demo / Walkthrough

<!-- Add your Loom or video walkthrough URL here -->

## How It Works

You create a book (title + genre + concept brief), then hit "Generate Outline" to get a chapter structure. Click into any chapter, hit "Generate Chapter" in the AI panel, and watch it stream in real-time. After that you can edit freely, ask the AI to rewrite sections, or just keep writing manually. Everything auto-saves.

The interesting part is what happens behind the scenes. Every time a chapter is generated, the system kicks off a background pipeline: save the content, summarize it down to ~150 words, update the book's rolling global summary. When you generate the next chapter, the AI gets your book brief, the global summary, all chapter summaries, and the previous chapter's full text. That's how it stays consistent without blowing up the context window.

## Architecture

I went with a feature-based modular monolith. Each domain (book, chapter, AI) owns its own routes, service layer, models, and schemas. The AI layer is further split into agents (planner, writer, summarizer, editor), each with dedicated prompt templates.

```
backend/
├── features/
│   ├── book/          routes, service, models, schemas
│   ├── chapter/       routes, service, models, schemas
│   └── ai/            agents, LLM client, service, schemas
├── memory/            context builder + persistence
├── prompts/           isolated prompt templates
└── middleware/         error handling

frontend/src/
├── app/store/         Zustand state (book + editor)
├── features/
│   ├── book/          dashboard, create modal
│   ├── chapter/       sidebar, editor page
│   └── ai/            side panel, API layer
└── components/
    ├── Editor/        TipTap rich text editor
    └── ui/            toast, step indicator, skeleton
```

Why this structure? It keeps things navigable. When I need to change how chapters work, everything related is in one folder. The AI agents don't know about HTTP or databases — they just take messages and return text. The service layer handles orchestration.

## API Endpoints

| Method | Path | What it does |
|--------|------|--------------|
| POST | `/api/books/` | Create a book |
| GET | `/api/books/` | List all books |
| GET | `/api/books/{id}` | Get book with chapters |
| PUT | `/api/books/{id}` | Update book metadata |
| DELETE | `/api/books/{id}` | Delete book (cascades chapters) |
| POST | `/api/books/{id}/chapters` | Add a chapter |
| GET | `/api/books/{id}/chapters` | List chapters for a book |
| GET | `/api/chapters/{id}` | Get single chapter |
| PUT | `/api/chapters/{id}` | Update chapter content |
| DELETE | `/api/chapters/{id}` | Delete chapter |
| PATCH | `/api/chapters/{id}/reorder` | Change chapter position |
| POST | `/api/ai/outline` | Generate chapter outline from brief |
| POST | `/api/ai/generate-chapter` | Stream a chapter draft (SSE) |
| POST | `/api/ai/rewrite` | Rewrite / improve / continue text |
| POST | `/api/ai/summarize` | Summarize a chapter |
| GET | `/api/chapters/{id}/history` | View AI action audit log |
| GET | `/api/books/{id}/export/pdf` | Download book as PDF |

## Bonus Questions

### 1. How does your system preserve context across a long book?

Through a rolling summary memory system. Every chapter gets auto-summarized after generation (~150 words). There's also a global summary that captures the entire story arc so far. When generating a new chapter, the context builder assembles: book metadata + global summary + all chapter summaries + the previous chapter's full text + the current chapter's brief. This keeps token usage roughly constant regardless of book length — chapter 30 costs about the same as chapter 3.

### 2. How do you prevent the AI from losing consistency over time?

Three mechanisms working together. First, the global summary is updated after every chapter, so the AI always has a compressed view of the full story. Second, the immediately preceding chapter is sent in full (not summarized), which preserves prose style and narrative flow. Third, every chapter's brief acts as a guardrail — the planner agent creates these upfront during outline generation, so each chapter has a clear purpose even before it's written.

It's not perfect. If a minor character appears in chapter 2 and then again in chapter 15, the summary might not preserve that detail. With more time I'd add entity tracking (characters, locations, plot threads) as a separate memory layer.

### 3. Why did you choose your architecture?

Practical reasons mostly. FastAPI because it handles async natively and streaming (SSE) is straightforward. SQLite because it's zero-config and fine for a prototype — swapping to Postgres later is a one-line config change. React + TipTap because TipTap gives you a real editor (not a textarea) with programmatic content insertion, which matters when you're streaming AI text into it.

The agent pattern (planner/writer/summarizer/editor) came from the observation that each AI task has fundamentally different prompts and expectations. The planner returns JSON, the writer returns prose, the summarizer returns compressed text. Keeping them separate makes prompts cleaner and bugs easier to trace.

### 4. What would you improve with more time?

A few things I'd add:

- **Entity memory**: right now the summary captures plot events but can lose track of minor characters or specific details. I'd add a structured entity store (characters, locations, plot threads) that gets updated alongside summaries.
- **Diff view**: when the AI rewrites content, you should see a proper before/after diff, not just accept/reject on the full result.
- **DOCX export**: PDF export exists; DOCX would round out the export options.
- **Collaborative editing**: TipTap supports Yjs for real-time collaboration, which would be a natural extension.

### 5. Where did AI tools help you, and where did you rely on your own implementation?

See [AI_USAGE.md](AI_USAGE.md) for the full breakdown.

## Assumptions and Tradeoffs

- **SQLite over Postgres**: simpler setup for a prototype. The schema is designed to port easily.
- **GPT-4o-mini as default**: cheaper and faster than GPT-4o, good enough for draft generation. The LLM client supports swapping models via env var.
- **No auth**: this is a single-user prototype. Adding auth would be straightforward with FastAPI's dependency injection.
- **No pagination**: book/chapter lists aren't paginated. Fine for a demo, not for production.
- **Auto-save over explicit save**: the editor debounces and saves after 1.5 seconds of inactivity. Some authors might prefer manual save — could add a toggle.

## License

MIT — see [LICENSE](LICENSE).
