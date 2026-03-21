"""Summarizer agent — compresses chapter text to ~150-word memory.

This agent is internal-only (no direct API endpoint). It auto-runs after
every chapter generation to update ``chapter.summary`` and ``book.global_summary``.
"""

from features.ai.llm_client import llm_client
from prompts.summary_prompt import build_summary_messages, build_global_summary_messages


async def summarize_chapter(
    chapter_content: str, book_brief: str, chapter_title: str
) -> tuple[str, str]:
    """Return (chapter_summary, model_used)."""
    messages = build_summary_messages(chapter_content, book_brief, chapter_title)
    summary, model_used = await llm_client.complete(messages, stream=False, temperature=0.3)
    return summary.strip(), model_used


async def update_global_summary(
    existing_summary: str, new_chapter_summary: str, book_brief: str
) -> tuple[str, str]:
    """Return (updated_global_summary, model_used)."""
    messages = build_global_summary_messages(existing_summary, new_chapter_summary, book_brief)
    updated, model_used = await llm_client.complete(messages, stream=False, temperature=0.3)
    return updated.strip(), model_used
