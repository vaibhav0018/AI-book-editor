"""Chapter business logic — CRUD and reorder operations."""

from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from features.chapter.models import Chapter, ChapterStatus
from features.chapter.schemas import ChapterCreate, ChapterUpdate, ChapterReorder
from features.book.service import get_book


def create_chapter(db: Session, book_id: str, payload: ChapterCreate) -> Chapter:
    """Add a new chapter to a book, appending at the end if no order given."""
    get_book(db, book_id)  # ensures book exists

    if payload.order_index is None:
        max_idx = (
            db.query(Chapter.order_index)
            .filter(Chapter.book_id == book_id)
            .order_by(Chapter.order_index.desc())
            .first()
        )
        next_index = (max_idx[0] + 1) if max_idx else 0
    else:
        next_index = payload.order_index

    chapter = Chapter(
        book_id=book_id,
        title=payload.title,
        brief=payload.brief,
        order_index=next_index,
    )
    db.add(chapter)
    db.commit()
    db.refresh(chapter)
    return chapter


def list_chapters(db: Session, book_id: str) -> List[Chapter]:
    """Return all chapters for a book, ordered by order_index."""
    get_book(db, book_id)
    return (
        db.query(Chapter)
        .filter(Chapter.book_id == book_id)
        .order_by(Chapter.order_index)
        .all()
    )


def get_chapter(db: Session, chapter_id: str) -> Chapter:
    """Fetch a single chapter by id, or raise 404."""
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")
    return chapter


def update_chapter(db: Session, chapter_id: str, payload: ChapterUpdate) -> Chapter:
    """Apply partial updates (content auto-save, status changes, etc.)."""
    chapter = get_chapter(db, chapter_id)
    data = payload.model_dump(exclude_unset=True)

    if "status" in data:
        try:
            data["status"] = ChapterStatus(data["status"])
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid status. Must be one of: {[s.value for s in ChapterStatus]}",
            )

    for field, value in data.items():
        setattr(chapter, field, value)
    db.commit()
    db.refresh(chapter)
    return chapter


def delete_chapter(db: Session, chapter_id: str) -> None:
    """Delete a chapter and its associated ai_actions."""
    chapter = get_chapter(db, chapter_id)
    db.delete(chapter)
    db.commit()


def reorder_chapter(db: Session, chapter_id: str, payload: ChapterReorder) -> Chapter:
    """Move a chapter to a new position and shift siblings accordingly."""
    chapter = get_chapter(db, chapter_id)
    old_index = chapter.order_index
    new_index = payload.order_index

    if old_index == new_index:
        return chapter

    siblings = (
        db.query(Chapter)
        .filter(Chapter.book_id == chapter.book_id, Chapter.id != chapter.id)
        .order_by(Chapter.order_index)
        .all()
    )

    # Remove from old position, insert at new
    ordered = [s for s in siblings]
    ordered.insert(new_index, chapter)

    for idx, ch in enumerate(ordered):
        ch.order_index = idx

    db.commit()
    db.refresh(chapter)
    return chapter
