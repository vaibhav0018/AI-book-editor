"""
Assembles token-bounded prompt context for chapter generation and edits.

This is the core intelligence of the memory system. Instead of sending the
full book text to the LLM, we build a smart context object:
  - Book metadata + brief (always)
  - Global rolling summary (evolving)
  - Full text of the immediately preceding chapter (continuity)
  - Summaries only for all other chapters (token-efficient)
  - The current chapter's brief (what to write)
"""

from sqlalchemy.orm import Session

from features.book.models import Book
from features.chapter.models import Chapter


def build_chapter_context(db: Session, book_id: str, target_chapter_id: str) -> dict:
    """Build the context dict consumed by writer and editor agents."""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise ValueError(f"Book {book_id} not found")

    chapters = (
        db.query(Chapter)
        .filter(Chapter.book_id == book_id)
        .order_by(Chapter.order_index)
        .all()
    )

    target = None
    target_index = None
    for i, ch in enumerate(chapters):
        if ch.id == target_chapter_id:
            target = ch
            target_index = i
            break

    if target is None:
        raise ValueError(f"Chapter {target_chapter_id} not found in book {book_id}")

    # Previous chapter full text (only the one immediately before)
    previous_content = None
    if target_index > 0:
        prev_ch = chapters[target_index - 1]
        previous_content = prev_ch.content

    # Summaries for all OTHER chapters (not the target)
    chapter_summaries = [
        {
            "order": ch.order_index,
            "title": ch.title,
            "summary": ch.summary,
        }
        for ch in chapters
        if ch.id != target_chapter_id
    ]

    return {
        "book_title": book.title,
        "book_genre": book.genre or "",
        "book_brief": book.brief or "",
        "style_notes": book.style_notes or "",
        "global_summary": book.global_summary or "",
        "previous_chapter_content": previous_content,
        "chapter_summaries": chapter_summaries,
        "current_chapter_title": target.title,
        "current_chapter_brief": target.brief or "",
        "current_chapter_content": target.content or "",
    }
