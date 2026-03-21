"""Planner agent — generates a structured book outline as a JSON array of chapters."""

import json
from typing import List, Dict

from features.ai.llm_client import llm_client
from prompts.outline_prompt import build_outline_messages


async def generate_outline(
    title: str, genre: str, brief: str, style_notes: str = ""
) -> tuple[List[Dict[str, str]], str]:
    """Call the LLM and return (list_of_chapter_dicts, model_used).

    Each dict has keys ``title`` and ``brief``.
    """
    messages = build_outline_messages(title, genre, brief, style_notes)
    raw, model_used = await llm_client.complete(messages, stream=False, temperature=0.7)

    # Strip markdown fences if the model wraps the JSON
    text = raw.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1]  # remove opening fence line
    if text.endswith("```"):
        text = text.rsplit("```", 1)[0]
    text = text.strip()

    chapters: List[Dict[str, str]] = json.loads(text)
    return chapters, model_used
