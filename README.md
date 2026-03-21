# AI Book Editor

An AI-native long-form book writing environment. Authors create books, generate structured outlines, draft chapters with intelligent context management, and edit content with inline AI assistance — all while the system maintains narrative consistency across the entire manuscript.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, Vite, TipTap v2, Zustand, Tailwind CSS, React Router v6, Axios |
| Backend | Python 3.11+, FastAPI, SQLAlchemy, SQLite, Alembic, Pydantic v2 |
| AI | OpenAI GPT-4o (primary), Ollama qwen2.5:7b (fallback) |

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
cp .env.example .env         # add your OPENAI_API_KEY
alembic upgrade head
uvicorn main:app --reload
```

API runs at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

## Architecture

Feature-based modular monolith. Each feature (`book`, `chapter`, `ai`) owns its routes, service, models, and schemas.

```
backend/
├── features/book/      # CRUD for books
├── features/chapter/   # CRUD for chapters
├── features/ai/        # LLM client, agents, AI endpoints
├── memory/             # Context builder + memory persistence
├── prompts/            # Isolated prompt templates
└── middleware/          # Error handling

frontend/src/
├── app/store/          # Zustand state management
├── features/book/      # Dashboard, create modal
├── features/chapter/   # Sidebar, editor view
├── features/ai/        # AI side panel, API layer
└── components/Editor/  # TipTap rich text editor
```

See [AI_USAGE.md](AI_USAGE.md) for a deep dive into the AI architecture and memory system.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/books/` | Create book |
| GET | `/api/books/` | List books |
| GET | `/api/books/{id}` | Get book with chapters |
| PUT | `/api/books/{id}` | Update book |
| DELETE | `/api/books/{id}` | Delete book (cascades) |
| POST | `/api/books/{id}/chapters` | Create chapter |
| GET | `/api/books/{id}/chapters` | List chapters |
| GET | `/api/chapters/{id}` | Get chapter |
| PUT | `/api/chapters/{id}` | Update chapter (auto-save) |
| DELETE | `/api/chapters/{id}` | Delete chapter |
| PATCH | `/api/chapters/{id}/reorder` | Reorder chapter |
| POST | `/api/ai/outline` | Generate chapter outline |
| POST | `/api/ai/generate-chapter` | Generate chapter (SSE stream) |
| POST | `/api/ai/rewrite` | Rewrite/improve/continue text |
| POST | `/api/ai/summarize` | Summarize chapter |
| GET | `/api/chapters/{id}/history` | AI action audit trail |

## License

MIT
