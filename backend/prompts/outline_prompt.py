"""Prompt template for the planner agent — generates a structured book outline."""

from typing import List, Dict, Optional


def build_outline_messages(
    title: str, genre: str, brief: str, style_notes: Optional[str] = None
) -> List[Dict[str, str]]:
    """Return the messages list that asks the LLM for a chapter outline."""
    system = (
        "You are an expert book planner and story architect. "
        "Given a book concept, you produce a detailed chapter-by-chapter outline. "
        "Respond ONLY with a valid JSON array — no markdown fences, no commentary.\n\n"
        "Each element must have exactly two keys:\n"
        '  "title": chapter title (string)\n'
        '  "brief": 2-3 sentence description of what happens in this chapter (string)\n\n'
        "Guidelines:\n"
        "- Create 8-12 chapters unless the concept clearly warrants more or fewer.\n"
        "- Ensure a clear narrative arc: setup, rising action, climax, resolution.\n"
        "- Each chapter brief should mention key events, character development, or thematic beats.\n"
        "- Chapter titles should be evocative, not just 'Chapter N'."
    )

    user_parts = [f"Title: {title}", f"Genre: {genre}", f"Concept: {brief}"]
    if style_notes:
        user_parts.append(f"Style notes: {style_notes}")

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": "\n".join(user_parts)},
    ]
