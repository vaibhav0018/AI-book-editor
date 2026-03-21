"""Pydantic request/response schemas for chapters."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ChapterCreate(BaseModel):
    """Payload for creating a chapter manually."""
    title: str = Field(..., min_length=1, max_length=255)
    brief: Optional[str] = None
    order_index: Optional[int] = None


class ChapterUpdate(BaseModel):
    """Partial update — used for auto-save from the editor."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    brief: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    status: Optional[str] = None


class ChapterReorder(BaseModel):
    """Payload for reordering a chapter."""
    order_index: int


class ChapterResponse(BaseModel):
    """Full chapter representation."""
    id: str
    book_id: str
    order_index: int
    title: str
    brief: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
