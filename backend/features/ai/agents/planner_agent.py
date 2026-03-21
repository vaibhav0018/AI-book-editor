"""Planner agent — generates a structured book outline as a JSON array of chapters."""

import json
import logging
from typing import List, Dict

from features.ai.llm_client import llm_client
from prompts.outline_prompt import build_outline_messages

logger = logging.getLogger(__name__)


class OutlineParseError(ValueError):
    """Raised when the LLM output cannot be parsed as a valid chapter outline."""

    def __init__(self, message: str, raw_text: str = ""):
        super().__init__(message)
        self.raw_text = raw_text


async def generate_outline(
    title: str, genre: str, brief: str, style_notes: str = ""
) -> tuple[List[Dict[str, str]], str]:
    """Call the LLM and return (list_of_chapter_dicts, model_used).

    Each dict has keys ``title`` and ``brief``.
    Raises OutlineParseError if the response is not valid JSON or lacks expected structure.
    """
    messages = build_outline_messages(title, genre, brief, style_notes)
    raw, model_used = await llm_client.complete(messages, stream=False, temperature=0.7)

    text = raw.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else ""
    if text.endswith("```"):
        text = text.rsplit("```", 1)[0]
    text = text.strip()

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as e:
        logger.warning("Planner returned invalid JSON: %s", e)
        raise OutlineParseError(f"Outline response was not valid JSON: {e}", raw_text=raw)

    if not isinstance(parsed, list):
        raise OutlineParseError("Outline must be a JSON array of chapters", raw_text=raw)

    chapters: List[Dict[str, str]] = []
    for i, item in enumerate(parsed):
        if not isinstance(item, dict):
            raise OutlineParseError(f"Chapter {i + 1} must be an object with title and brief", raw_text=raw)
        title_val = item.get("title")
        brief_val = item.get("brief", "")
        if not title_val or not isinstance(title_val, str):
            raise OutlineParseError(f"Chapter {i + 1} must have a string 'title'", raw_text=raw)
        chapters.append({"title": str(title_val), "brief": str(brief_val) if brief_val else ""})

    return chapters, model_used
