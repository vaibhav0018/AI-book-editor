"""Read/write book-level and chapter-level memory fields in the database."""

from sqlalchemy.orm import Session

from features.book.models import Book
from features.chapter.models import Chapter


def save_chapter_summary(db: Session, chapter_id: str, summary: str) -> None:
    """Persist the AI-generated ~150-word chapter summary."""
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if chapter:
        chapter.summary = summary
        db.commit()


def save_global_summary(db: Session, book_id: str, summary: str) -> None:
    """Update the rolling global book summary."""
    book = db.query(Book).filter(Book.id == book_id).first()
    if book:
        book.global_summary = summary
        db.commit()


def save_chapter_content(db: Session, chapter_id: str, content: str, status: str = "draft") -> None:
    """Save generated chapter content and flip status to draft."""
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if chapter:
        chapter.content = content
        chapter.status = status
        db.commit()
