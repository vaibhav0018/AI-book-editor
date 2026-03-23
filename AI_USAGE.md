# AI Tool Usage Disclosure

Transparency about how AI tools were used during development.

## Tools Used

- **Cursor IDE/ claude** with Claude and cursor as the AI assistant — used throughout development for code generation, debugging, and scaffolding.
- **OpenAI GPT-4o-mini** — powers the actual product features (outline generation, chapter writing, summarization, rewriting).

## What AI Helped With

### Scaffolding and boilerplate
The initial project structure (folder layout, config files, database setup, Alembic migration config) was generated with AI assistance. I described the architecture I wanted and the AI produced the skeleton. I reviewed and adjusted file organization, naming conventions, and import patterns to match my preferences.

### Backend CRUD endpoints
The book and chapter CRUD routes, services, and schemas followed a repetitive pattern. AI generated the initial versions, and I verified they worked correctly by testing each endpoint manually with different payloads, edge cases (missing fields, invalid IDs, cascade deletes).

### Prompt templates
I wrote the prompt structures myself — deciding what context goes into each prompt, how to format the system message, what instructions to give the AI for each agent role. The actual Python string formatting code was assisted by AI, but the prompt engineering decisions (what to include, what to compress, how to instruct) were mine.

### Frontend components
AI helped generate the initial component code (React + Tailwind). I specified the layout, interactions, and state management approach. The TipTap editor integration required some back-and-forth — the bubble menu import path changed between TipTap versions and I had to debug that.

## What I Did Myself

### Architecture decisions
The choice to use a rolling summary memory system, the four-agent pattern, the context builder design, and the auto-summarization pipeline — these were my design decisions based on thinking through the core problem of long-form context management. I researched how context windows work, what information is actually needed for chapter-to-chapter consistency, and how to keep token usage bounded.

### Memory system design
The `context_builder` module — deciding that each AI call gets book metadata + global summary + chapter summaries + previous chapter full text + current brief — that tradeoff was mine. Sending the full previous chapter (not just its summary) was a deliberate choice for prose continuity, and compressing everything else was the tradeoff to stay within token limits.

### LLM fallback strategy
The decision to support both OpenAI and Ollama with automatic failover came from wanting the app to work even without an API key (using a local model). The routing logic and error handling around this were designed by me.

### Debugging and integration
Connecting all the pieces — making sure the post-generation pipeline (save → summarize → update global summary → audit log) runs correctly after streaming completes, fixing CORS issues, resolving SQLAlchemy relationship errors, handling SSE streaming on both backend and frontend — this was hands-on debugging work.

### Product decisions
The UX flow (dashboard → outline → chapter selection → generation → editing), the 3-panel layout choice, the accept/reject pattern for AI suggestions, the step indicator during generation — these reflect my thinking about what an author would actually need.

## How I Validated AI-Generated Code

- Every backend endpoint was tested manually via PowerShell/curl before moving on.
- The AI endpoints were tested end-to-end: creating a book, generating an outline, generating chapters, verifying summaries and global summary updates, testing rewrite actions.
- The frontend was build-tested (`npm run build`) after each major change to catch import errors and type issues.
- When AI-generated code had bugs (SQLAlchemy relationship resolution, TipTap import paths, CORS middleware ordering), I debugged and fixed them rather than regenerating.

## Summary

AI was a productivity multiplier, especially for boilerplate and repetitive patterns. The architectural thinking, memory system design, prompt engineering, and debugging were primarily my own work. I used AI as a tool, not as a replacement for understanding what the code does and why.
