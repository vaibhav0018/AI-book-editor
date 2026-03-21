# AI Architecture & Memory System

This document explains how the AI layer works, why it's designed this way, and how it solves the core challenge of long-form writing: keeping the AI consistent across a book that doesn't fit in a single prompt.

## The Problem

A full novel is 50,000–100,000 words. LLM context windows (even large ones) can't hold an entire book plus instructions. Naively sending "write chapter 10" with all previous chapters would exceed token limits and degrade quality.

## The Solution: Rolling Summary Memory

Instead of sending the full book, we build a **smart context object** for every AI operation. The `context_builder` module assembles exactly what the AI needs:

1. **Book metadata** — title, genre, concept brief (always included, never changes)
2. **Global summary** — a ~200-word rolling summary of the entire story so far, updated after every chapter generation
3. **Previous chapter full text** — only the immediately preceding chapter, for prose continuity
4. **Chapter summaries** — ~150-word compressed summaries of all other chapters (not full text)
5. **Current chapter brief** — what this chapter should accomplish

This keeps token usage bounded regardless of book length, while giving the AI enough context to maintain character arcs, plot threads, and thematic consistency.

## Auto-Summarization Pipeline

After every chapter generation, the system automatically:

1. Saves the generated chapter content
2. Runs the **summarizer agent** to compress the chapter to ~150 words
3. Updates the chapter's `summary` field in the database
4. Runs the summarizer again to update the book's `global_summary`
5. Logs everything to the `ai_actions` audit table

This happens transparently — the author never sees the summaries directly, but the AI uses them for every subsequent operation.

## Agent Design

Four single-responsibility agents, each with its own prompt template:

| Agent | Purpose | Trigger |
|-------|---------|---------|
| **Planner** | Generates chapter outline (JSON) from book concept | "Generate Outline" button |
| **Writer** | Writes full chapter draft from context | "Generate Chapter" (streams via SSE) |
| **Summarizer** | Compresses chapter to ~150-word memory | Auto-runs after generation |
| **Editor** | Rewrites/improves/continues selected text | Bubble menu or side panel actions |

## LLM Fallback Chain

The `LLMClient` tries OpenAI GPT-4o first. If the API key is missing, the service is down, or rate limits hit, it falls back to a local Ollama instance running `qwen2.5:7b`. Both providers use the same interface, so agents don't need to know which model is responding.

```
Request → LLMClient.complete()
           ├── Try OpenAI GPT-4o
           │    └── Success → return response
           └── Fallback → Ollama qwen2.5:7b
                └── return response
```

## Audit Trail

Every AI operation is logged in the `ai_actions` table:

- **action_type** — generate, rewrite, summarize, improve, continue
- **context_snapshot** — what context was sent to the AI (truncated)
- **output** — what the AI returned (truncated)
- **model_used** — which model actually responded (gpt-4o or qwen2.5)

This provides free version history and makes AI outputs reproducible for debugging.

## Streaming

Chapter generation uses Server-Sent Events (SSE). The backend streams tokens as they arrive from the LLM, and the frontend appends them to the TipTap editor in real-time. After the stream completes, the post-processing pipeline (save, summarize, update memory) runs automatically.
