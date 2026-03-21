"""Editor agent — rewrite, improve, continue, summarize, change tone on selected text."""

from typing import Optional

from features.ai.llm_client import llm_client
from prompts.rewrite_prompt import build_editor_messages


async def edit_text(
    action: str,
    selected_text: str,
    chapter_title: Optional[str] = None,
    chapter_brief: Optional[str] = None,
    tone: Optional[str] = None,
) -> tuple[str, str]:
    """Return (edited_text, model_used)."""
    messages = build_editor_messages(
        action=action,
        selected_text=selected_text,
        chapter_title=chapter_title,
        chapter_brief=chapter_brief,
        tone=tone,
    )
    result, model_used = await llm_client.complete(messages, stream=False, temperature=0.6)
    return result.strip(), model_used
