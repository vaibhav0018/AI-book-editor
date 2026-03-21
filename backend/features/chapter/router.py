"""FastAPI routes for chapters."""

from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from features.chapter import service
from features.chapter.schemas import (
    ChapterCreate, ChapterUpdate, ChapterReorder, ChapterResponse,
)

router = APIRouter(tags=["chapters"])


@router.post(
    "/api/books/{book_id}/chapters",
    response_model=ChapterResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_chapter(
    book_id: str, payload: ChapterCreate, db: Session = Depends(get_db),
):
    """Create a new chapter for the given book."""
    return service.create_chapter(db, book_id, payload)


@router.get("/api/books/{book_id}/chapters", response_model=List[ChapterResponse])
async def list_chapters(book_id: str, db: Session = Depends(get_db)):
    """List all chapters for a book."""
    return service.list_chapters(db, book_id)


@router.get("/api/chapters/{chapter_id}", response_model=ChapterResponse)
async def get_chapter(chapter_id: str, db: Session = Depends(get_db)):
    """Get a single chapter."""
    return service.get_chapter(db, chapter_id)


@router.put("/api/chapters/{chapter_id}", response_model=ChapterResponse)
async def update_chapter(
    chapter_id: str, payload: ChapterUpdate, db: Session = Depends(get_db),
):
    """Update chapter content (auto-save)."""
    return service.update_chapter(db, chapter_id, payload)


@router.delete("/api/chapters/{chapter_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chapter(chapter_id: str, db: Session = Depends(get_db)):
    """Delete a chapter."""
    service.delete_chapter(db, chapter_id)


@router.patch("/api/chapters/{chapter_id}/reorder", response_model=ChapterResponse)
async def reorder_chapter(
    chapter_id: str, payload: ChapterReorder, db: Session = Depends(get_db),
):
    """Move a chapter to a new order position."""
    return service.reorder_chapter(db, chapter_id, payload)
