# AI-Powered Book Writing Editor — Build Plan

This document is the canonical specification and phase order for the project. Implementation should match this unless the user approves a change.

## Goals

An AI-native book authoring app: create books (title, genre, brief), generate structured outlines, draft chapters with smart context, edit in a rich editor, inline AI (rewrite, summarize, continue, improve), and keep consistency via a **rolling memory** system (not full-book prompts).

## Tech Stack

| Layer | Choices |
|--------|---------|
| Frontend | React 18 (Vite), TipTap v2, Zustand, Tailwind + shadcn/ui, React Router v6, Axios |
| Backend | Python 3.11+, FastAPI, SQLAlchemy, SQLite `book_editor.db`, Alembic, Pydantic v2, httpx, python-dotenv |
| AI | OpenAI GPT-4o (primary), Ollama `qwen2.5:7b` (fallback); unified `LLMClient` |

## Architecture

**Feature-based modular monolith** under `backend/features/{book,chapter,ai}/`. AI prompts in `backend/prompts/`. Context assembly in `backend/memory/context_builder.py`; persistence in `memory_store.py`.

### Folder layout (target)

```
backend/
├── main.py, app.py, database.py, config.py
├── features/book/, chapter/, ai/ (+ ai/agents/)
├── memory/, prompts/, middleware/
frontend/src/ ... (per spec: app/, features/, components/, lib/)
```

## Database Schema

- **books**: id (UUID), title, genre, brief, global_summary, style_notes, timestamps
- **chapters**: id, book_id FK, order_index, title, brief, content, summary, status enum (empty|draft|reviewed), timestamps
- **ai_actions**: id, chapter_id FK, action_type, context_snapshot, output, model_used, created_at

## Memory / Context (`build_chapter_context`)

Always include: book title, genre, brief, `global_summary`, **full previous chapter content**, **summaries only** for other chapters, current chapter brief. After generation: summarizer updates `chapter.summary` (~150 words) and `book.global_summary`.

## Agents

1. **plannerAgent** — outline JSON from title/genre/brief  
2. **writerAgent** — chapter body from context (streaming preferred)  
3. **summarizerAgent** — internal; post-generation memory  
4. **editorAgent** — rewrite / improve / continue / summarize / tone  

## API Summary

- Books: `POST/GET /api/books`, `GET/PUT/DELETE /api/books/{id}`
- Chapters: nested create/list, `GET/PUT/DELETE /api/chapters/{id}`, `PATCH .../reorder`
- AI: `outline`, `generate-chapter` (stream), `rewrite`, `summarize`, `continue`, `improve`; `GET /api/chapters/{id}/history`

## Build Phases (strict order)

| Phase | Steps | Focus |
|-------|-------|--------|
| **1** | 1–7 | Backend foundation: venv, DB layer, models, Alembic, book + chapter CRUD, manual API test |
| **2** | 8–15 | config, LLM client, prompts, context_builder, agents, AI endpoints |
| **3** | 16–20 | Vite/React, stores, apiClient, AppShell, BookDashboard |
| **4** | 21–26 | Sidebar, TipTap, outline/chapter streaming, AISidePanel, bubble menu + diff |
| **5** | 27–30 | Loading/stream UX, toasts, step indicator, README + AI_USAGE.md |

## Environment

**Backend `.env`**: `OPENAI_API_KEY`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `DATABASE_URL`, `ENVIRONMENT`, `CORS_ORIGINS`  
**Frontend `.env`**: `VITE_API_BASE_URL=http://localhost:8000`

## Current progress

- [x] Phase 1 — Step 1: Backend project structure, venv, dependencies (see git/history for date)

_Update checkboxes as phases complete._
