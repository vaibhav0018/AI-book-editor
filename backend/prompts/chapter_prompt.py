"""Prompt template for the writer agent — generates full chapter content."""

from typing import List, Dict, Optional


def build_chapter_messages(context: dict) -> List[Dict[str, str]]:
    """Assemble system + user messages from a context_builder output dict."""
    system = (
        "You are an accomplished novelist writing a chapter of a book. "
        "Write rich, engaging prose that matches the author's style notes. "
        "Maintain continuity with previous chapters via the summaries and "
        "the full text of the immediately preceding chapter provided below.\n\n"
        "Rules:\n"
        "- Write the FULL chapter (1500-3000 words).\n"
        "- Use markdown formatting: `## Chapter Title` at the top, then prose.\n"
        "- Stay faithful to the chapter brief.\n"
        "- Do NOT repeat content from previous chapters.\n"
        "- End the chapter at a natural stopping point that invites the next chapter."
    )

    # Build a structured user message from the context dict
    parts: list[str] = []

    parts.append(f"**Book:** {context['book_title']}")
    parts.append(f"**Genre:** {context['book_genre']}")
    parts.append(f"**Concept:** {context['book_brief']}")

    if context.get("style_notes"):
        parts.append(f"**Style:** {context['style_notes']}")

    if context.get("global_summary"):
        parts.append(f"\n**Story so far (global summary):**\n{context['global_summary']}")

    summaries = context.get("chapter_summaries", [])
    if summaries:
        summary_lines = []
        for s in summaries:
            summary_lines.append(f"  Ch {s['order']}: {s['title']} — {s['summary'] or '(not yet written)'}")
        parts.append("\n**Chapter summaries:**\n" + "\n".join(summary_lines))

    if context.get("previous_chapter_content"):
        parts.append(
            f"\n**Full text of the immediately preceding chapter:**\n"
            f"{context['previous_chapter_content']}"
        )

    parts.append(f"\n**YOUR TASK — write this chapter:**")
    parts.append(f"Title: {context['current_chapter_title']}")
    parts.append(f"Brief: {context['current_chapter_brief']}")

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": "\n".join(parts)},
    ]
