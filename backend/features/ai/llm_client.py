"""
Unified LLM client with automatic fallback.

Tries OpenAI GPT-4o first; falls back to local Ollama if the API key is
missing, the service is unreachable, or a rate-limit / API error occurs.
Both paths expose the same ``complete`` interface (regular + streaming).
"""

from typing import AsyncGenerator, List, Dict, Optional
import json
import openai
import httpx

from config import settings

# Sentinel used by agents to check which provider was used
PROVIDER_OPENAI = "gpt-4o"
PROVIDER_OLLAMA = settings.OLLAMA_MODEL


class LLMClient:
    """Router that tries OpenAI then Ollama, same contract for callers."""

    def __init__(self):
        self._openai = (
            openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            if settings.OPENAI_API_KEY
            else None
        )
        self._ollama_url = f"{settings.OLLAMA_BASE_URL}/api/chat"

    # ── public interface ────────────────────────────────────────────

    async def complete(
        self,
        messages: List[Dict[str, str]],
        stream: bool = False,
        temperature: float = 0.7,
    ) -> tuple:
        """Return (text_or_generator, model_used).

        When *stream* is False  → (str, model_name)
        When *stream* is True   → (AsyncGenerator[str, None], model_name)
        """
        if self._openai:
            try:
                return await self._openai_complete(messages, stream, temperature)
            except (openai.RateLimitError, openai.APIError, openai.APIConnectionError):
                pass  # fall through to Ollama

        return await self._ollama_complete(messages, stream, temperature)

    # ── OpenAI ──────────────────────────────────────────────────────

    async def _openai_complete(self, messages, stream, temperature) -> tuple:
        if stream:
            return self._openai_stream(messages, temperature), PROVIDER_OPENAI

        resp = await self._openai.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=temperature,
        )
        return resp.choices[0].message.content, PROVIDER_OPENAI

    async def _openai_stream(
        self, messages, temperature
    ) -> AsyncGenerator[str, None]:
        stream = await self._openai.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=temperature,
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta

    # ── Ollama ──────────────────────────────────────────────────────

    async def _ollama_complete(self, messages, stream, temperature) -> tuple:
        if stream:
            return self._ollama_stream(messages, temperature), PROVIDER_OLLAMA

        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                self._ollama_url,
                json={
                    "model": settings.OLLAMA_MODEL,
                    "messages": messages,
                    "stream": False,
                    "options": {"temperature": temperature},
                },
            )
            resp.raise_for_status()
            return resp.json()["message"]["content"], PROVIDER_OLLAMA

    async def _ollama_stream(
        self, messages, temperature
    ) -> AsyncGenerator[str, None]:
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                self._ollama_url,
                json={
                    "model": settings.OLLAMA_MODEL,
                    "messages": messages,
                    "stream": True,
                    "options": {"temperature": temperature},
                },
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line:
                        continue
                    data = json.loads(line)
                    content = data.get("message", {}).get("content", "")
                    if content:
                        yield content


# Module-level singleton
llm_client = LLMClient()
