# AI Book Editor

A writing app for **long-form fiction**: the AI plans outlines, drafts chapters with streaming, and keeps a **compressed memory** of the whole book so later chapters stay coherent—even when the full manuscript would not fit in one prompt.

---

## Tech stack

| Layer | Stack |
|-------|-------|
| Frontend | React 18, Vite, TipTap v2, Zustand, Tailwind CSS |
| Backend | Python 3.11, FastAPI, SQLAlchemy, SQLite, Alemb ic |
| AI | OpenAI (default `gpt-4o-mini` via env), local model Ollama fallback |

---

## Quick start

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
cp .env.example .env            # add OPENAI_API_KEY (optional if using Ollama)
alembic upgrade head
uvicorn main:app --reload
```

- API: http://localhost:8000  
- Interactive docs: http://localhost:8000/docs  

### Frontend

```bash
cd frontend
npm install
npm run dev
```

- App: http://localhost:5173  

### Tests

```bash
cd backend
pip install -r requirements.txt
python -m pytest tests -v
```

---

## What you can do

- Create books (title, genre, brief) and **generate an AI outline** (chapters with titles + briefs).
- Open a chapter, **generate or edit** prose in a rich-text editor; changes **auto-save** after a short debounce.
- Use the AI panel: generate chapter (SSE), rewrite / improve / continue / tone, summarize, scrap draft, view **chapter + book memory** summaries.
- **Export** the book as PDF; delete or reorder chapters.

---

## Architecture (high level)

Feature-based **modular monolith**: each area owns routes, services, models, and schemas.

```
backend/
├── features/book/     # CRUD, PDF export
├── features/chapter/  # CRUD, reorder
├── features/ai/       # agents, LLM client, orchestration
├── memory/            # context builder + summary persistence
├── prompts/           # prompt templates per agent
└── middleware/        # error handling

frontend/src/
├── app/store/         # Zustand (books + editor)
├── features/book|chapter|ai/
└── components/        # TipTap editor, UI (toasts, etc.)
```

**Agents:** planner (outline JSON), writer (streaming chapter), summarizer (chapter + rolling global summary), editor (rewrite-style actions). They do not talk to HTTP or the DB directly; a **service layer** wires them to persistence and audit logs (`ai_actions`).

---

## API reference

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/books/` | Create book |
| GET | `/api/books/` | List books |
| GET | `/api/books/{id}` | Book + chapter list |
| PUT | `/api/books/{id}` | Update metadata |
| DELETE | `/api/books/{id}` | Delete book (cascade) |
| POST | `/api/books/{id}/chapters` | Add chapter |
| GET | `/api/books/{id}/chapters` | List chapters |
| GET | `/api/chapters/{id}` | Get chapter |
| PUT | `/api/chapters/{id}` | Update content |
| DELETE | `/api/chapters/{id}` | Delete chapter |
| PATCH | `/api/chapters/{id}/reorder` | Reorder |
| POST | `/api/ai/outline` | Generate outline |
| POST | `/api/ai/generate-chapter` | Stream chapter (SSE) |
| POST | `/api/ai/rewrite` | Edit actions on text |
| POST | `/api/ai/summarize` | Summarize chapter |
| GET | `/api/chapters/{id}/history` | AI action history |
| GET | `/api/books/{id}/export/pdf` | Download PDF |

---

## Bonus questions

*Short answers required for the assignment; implementation details live in `memory/context_builder.py` and `features/ai/`.*

### 1. How does your system preserve context across a long book?

After each generated chapter, the pipeline saves the text, produces a **~150-word chapter summary**, and updates a **rolling global summary** (~200 words) for the whole story so far. For the **next** generation, a **context builder** sends: book metadata and brief, the global summary, **all other chapters’ summaries** (not full text), the **full text of only the immediately previous chapter**, and the current chapter’s title/brief (and any user draft). That keeps prompt size **roughly bounded**—chapter 30 costs about as much context as chapter 3 in terms of design, instead of pasting the entire book.

### 2. How do you prevent the AI from losing consistency over time?

Three levers: **(1)** the global summary gives a story-wide anchor; **(2)** the previous chapter in full preserves voice, pacing, and what just happened; **(3)** per-chapter **briefs** from the outline keep each chapter aimed at a defined beat. Summaries can still drop minor details (e.g. a small character from an early chapter); a stronger fix would be structured **entity memory** (see question 4).

### 3. Why did you choose your architecture?

**FastAPI** fits async, streaming (SSE), and clear OpenAPI docs. **SQLite** is zero-config for a prototype; the stack is easy to point at Postgres later. **React + TipTap** gives a real document model and programmatic updates for streaming. Splitting **planner / writer / summarizer / editor** keeps prompts and failure modes separate; the **service layer** owns orchestration and DB writes so agents stay testable in isolation.

### 4. What would you improve with more time?

- **Entity memory** — characters, places, open threads, updated with summaries.  
- **Diff UI** for AI rewrites (side-by-side or inline), not only accept/reject blocks.  
- **DOCX export** alongside PDF.  
- **Broader automated tests** (including mocked or contract tests for LLM routes) and optional **E2E** against a running stack.  
- **Collaboration** (e.g. Yjs + TipTap) if the product moves beyond single-user.

### 5. Where did AI tools help you, and where did you rely fully on your own implementation?

**AI coding tools** (e.g. Cursor) sped up boilerplate, scaffolding, and repetitive CRUD; **the product’s** LLM powers outlines, generation, summarization, and edits. **My own work** includes the **memory and context design** (what to compress vs. send in full), **agent boundaries**, **prompt intent and structure**, **streaming + finalize pipeline**, integration debugging, and validation of behavior end-to-end.

For a **transparent, line-by-line** breakdown of what was AI-assisted vs. hand-written, see **[AI_USAGE.md](AI_USAGE.md)**.

---

## Assumptions and tradeoffs

| Choice | Rationale |
|--------|-----------|
| SQLite | Simple local dev; schema ports to Postgres with config change. |
| Configurable OpenAI model | Cost/quality tradeoff via env; Ollama path when API is unavailable. |
| No auth | Single-user prototype scope. |
| No list pagination | Fine for demo-scale libraries. |
| Debounced auto-save | Fewer “lost work” incidents; power users could get an explicit-save toggle later. |

---

## Demo / walkthrough

<!-- Optional: add your Loom or screen recording URL here. -->

---

## License

MIT — see [LICENSE](LICENSE).
