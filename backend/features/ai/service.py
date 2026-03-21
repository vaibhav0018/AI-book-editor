"""AI orchestration — wires agents, context builder, and memory persistence."""

import json
from typing import AsyncGenerator

from sqlalchemy.orm import Session

from features.book.service import get_book
from features.chapter.service import get_chapter, create_chapter as create_chapter_row
from features.chapter.schemas import ChapterCreate
from features.ai.models import AIAction
from features.ai.agents import planner_agent, writer_agent, summarizer_agent, editor_agent
from memory.context_builder import build_chapter_context
from memory.memory_store import (
    save_chapter_summary,
    save_global_summary,
    save_chapter_content,
)


def _save_ai_action(
    db: Session, chapter_id: str, action_type: str,
    context_snapshot: str, output: str, model_used: str,
) -> None:
    """Persist an audit record in the ai_actions table."""
    record = AIAction(
        chapter_id=chapter_id,
        action_type=action_type,
        context_snapshot=context_snapshot,
        output=output,
        model_used=model_used,
    )
    db.add(record)
    db.commit()


# ── Outline ──────────────────────────────────────────────────

async def generate_outline(db: Session, book_id: str) -> tuple[list, str]:
    """Use the planner agent to generate chapters, persist them, return list."""
    book = get_book(db, book_id)

    chapters_data, model_used = await planner_agent.generate_outline(
        title=book.title,
        genre=book.genre or "",
        brief=book.brief or "",
        style_notes=book.style_notes or "",
    )

    created = []
    for i, ch in enumerate(chapters_data):
        row = create_chapter_row(
            db, book_id,
            ChapterCreate(title=ch["title"], brief=ch.get("brief", ""), order_index=i),
        )
        created.append({"id": row.id, "title": row.title, "brief": row.brief, "order_index": i})

    return created, model_used


# ── Chapter generation (streaming) ───────────────────────────

async def generate_chapter_stream(
    db: Session, book_id: str, chapter_id: str,
) -> tuple[AsyncGenerator[str, None], str, dict]:
    """Return (token_generator, model_used, context_dict) for SSE streaming."""
    context = build_chapter_context(db, book_id, chapter_id)
    generator, model_used = await writer_agent.generate_chapter_stream(context)
    return generator, model_used, context


async def finalize_chapter_generation(
    db: Session, book_id: str, chapter_id: str,
    full_text: str, model_used: str, context: dict,
) -> None:
    """Post-stream: save content, run summarizer, update memory, write audit."""
    save_chapter_content(db, chapter_id, full_text)

    book = get_book(db, book_id)
    chapter = get_chapter(db, chapter_id)

    # Summarize the new chapter
    chapter_summary, _ = await summarizer_agent.summarize_chapter(
        full_text, book.brief or "", chapter.title,
    )
    save_chapter_summary(db, chapter_id, chapter_summary)

    # Update global book summary
    global_summary, _ = await summarizer_agent.update_global_summary(
        book.global_summary or "", chapter_summary, book.brief or "",
    )
    save_global_summary(db, book_id, global_summary)

    # Audit trail
    _save_ai_action(
        db, chapter_id, "generate",
        context_snapshot=json.dumps(context, default=str),
        output=full_text[:2000],
        model_used=model_used,
    )


# ── Editor actions ───────────────────────────────────────────

async def run_editor_action(
    db: Session, chapter_id: str, action: str,
    selected_text: str, tone: str = None,
    custom_instruction: str = None,
) -> tuple[str, str]:
    """Run an editor agent action and persist the audit record."""
    chapter = get_chapter(db, chapter_id)

    result, model_used = await editor_agent.edit_text(
        action=action,
        selected_text=selected_text,
        chapter_title=chapter.title,
        chapter_brief=chapter.brief,
        tone=tone,
        custom_instruction=custom_instruction,
    )

    _save_ai_action(
        db, chapter_id, action,
        context_snapshot=selected_text[:1000],
        output=result[:2000],
        model_used=model_used,
    )

    return result, model_used


# ── Summarize (explicit) ─────────────────────────────────────

async def summarize_chapter(db: Session, chapter_id: str) -> tuple[str, str]:
    """Explicitly summarize a chapter (user-triggered)."""
    chapter = get_chapter(db, chapter_id)
    if not chapter.content:
        raise ValueError("Chapter has no content to summarize")

    book = get_book(db, chapter.book_id)
    summary, model_used = await summarizer_agent.summarize_chapter(
        chapter.content, book.brief or "", chapter.title,
    )
    save_chapter_summary(db, chapter_id, summary)

    _save_ai_action(
        db, chapter_id, "summarize",
        context_snapshot=chapter.content[:1000],
        output=summary,
        model_used=model_used,
    )

    return summary, model_used
