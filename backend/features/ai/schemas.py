"""Pydantic request/response schemas for AI endpoints."""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


# ── Outline ──────────────────────────────────────────────────

class OutlineRequest(BaseModel):
    book_id: str


class OutlineChapter(BaseModel):
    title: str
    brief: str


class OutlineResponse(BaseModel):
    chapters: List[OutlineChapter]
    model_used: str


# ── Generate chapter ─────────────────────────────────────────

class GenerateChapterRequest(BaseModel):
    book_id: str
    chapter_id: str


# ── Editor actions (rewrite, improve, continue, etc.) ────────

class EditorActionRequest(BaseModel):
    chapter_id: str
    selected_text: str
    action: str = Field(..., pattern="^(rewrite|improve|continue|summarize|change_tone|make_shorter|make_longer)$")
    tone: Optional[str] = None


class EditorActionResponse(BaseModel):
    result: str
    model_used: str


# ── Summarize chapter ────────────────────────────────────────

class SummarizeRequest(BaseModel):
    chapter_id: str


class SummarizeResponse(BaseModel):
    summary: str
    model_used: str


# ── AI action history ────────────────────────────────────────

class AIActionRecord(BaseModel):
    id: str
    action_type: str
    model_used: Optional[str] = None
    output: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
