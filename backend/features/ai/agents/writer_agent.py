"""Writer agent — generates a full chapter draft, optionally streaming."""

from typing import AsyncGenerator

from features.ai.llm_client import llm_client
from prompts.chapter_prompt import build_chapter_messages


async def generate_chapter(context: dict) -> tuple[str, str]:
    """Non-streaming: return (full_chapter_text, model_used)."""
    messages = build_chapter_messages(context)
    text, model_used = await llm_client.complete(messages, stream=False, temperature=0.7)
    return text.strip(), model_used


async def generate_chapter_stream(context: dict) -> tuple[AsyncGenerator[str, None], str]:
    """Streaming: return (async_generator_of_chunks, model_used)."""
    messages = build_chapter_messages(context)
    generator, model_used = await llm_client.complete(messages, stream=True, temperature=0.7)
    return generator, model_used
