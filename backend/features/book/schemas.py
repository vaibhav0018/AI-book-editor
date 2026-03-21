"""Pydantic request/response schemas for books."""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class BookCreate(BaseModel):
    """Payload for creating a new book."""
    title: str = Field(..., min_length=1, max_length=255)
    genre: Optional[str] = None
    brief: Optional[str] = None
    style_notes: Optional[str] = None


class BookUpdate(BaseModel):
    """Partial update payload for a book."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    genre: Optional[str] = None
    brief: Optional[str] = None
    global_summary: Optional[str] = None
    style_notes: Optional[str] = None


class ChapterBrief(BaseModel):
    """Minimal chapter info embedded in book responses."""
    id: str
    order_index: int
    title: str
    status: str

    model_config = {"from_attributes": True}


class BookResponse(BaseModel):
    """Full book representation returned by the API."""
    id: str
    title: str
    genre: Optional[str] = None
    brief: Optional[str] = None
    global_summary: Optional[str] = None
    style_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    chapters: List[ChapterBrief] = []

    model_config = {"from_attributes": True}


class BookListResponse(BaseModel):
    """Book card without nested chapters (for dashboard lists)."""
    id: str
    title: str
    genre: Optional[str] = None
    brief: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
