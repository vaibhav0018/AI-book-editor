"""Tests for memory/context_builder — core context assembly logic."""

import pytest
from sqlalchemy.orm import Session

from memory.context_builder import build_chapter_context
from features.book.models import Book
from features.chapter.models import Chapter, ChapterStatus


def _make_book(db: Session, book_id: str = "book-1") -> Book:
    book = Book(
        id=book_id,
        title="Test Novel",
        genre="fiction",
        brief="A hero's journey",
        global_summary="Ch 1 done. Ch 2 done.",
        style_notes="Literary",
    )
    db.add(book)
    db.commit()
    db.refresh(book)
    return book


def _make_chapter(
    db: Session, book_id: str, chapter_id: str, order: int,
    title: str = "Chapter", content: str = "", summary: str | None = None,
) -> Chapter:
    ch = Chapter(
        id=chapter_id,
        book_id=book_id,
        order_index=order,
        title=title,
        brief="Brief",
        content=content,
        summary=summary,
        status=ChapterStatus.draft,
    )
    db.add(ch)
    db.commit()
    db.refresh(ch)
    return ch


def test_build_chapter_context_first_chapter(db: Session):
    """First chapter has no previous content; others have summaries only."""
    book = _make_book(db)
    ch1 = _make_chapter(db, book.id, "ch-1", 0, "Prologue", "", None)
    ch2 = _make_chapter(db, book.id, "ch-2", 1, "Act One", "Some text", "Summary of ch1")

    ctx = build_chapter_context(db, book.id, ch1.id)

    assert ctx["book_title"] == "Test Novel"
    assert ctx["global_summary"] == "Ch 1 done. Ch 2 done."
    assert ctx["previous_chapter_content"] is None
    assert ctx["current_chapter_title"] == "Prologue"
    assert len(ctx["chapter_summaries"]) == 1
    assert ctx["chapter_summaries"][0]["title"] == "Act One"
    assert ctx["chapter_summaries"][0]["summary"] == "Summary of ch1"


def test_build_chapter_context_includes_previous_full_text(db: Session):
    """Second chapter gets full text of first chapter."""
    book = _make_book(db)
    _make_chapter(db, book.id, "ch-1", 0, "Ch1", "Full chapter one text.", "Sum1")
    ch2 = _make_chapter(db, book.id, "ch-2", 1, "Ch2", "", None)

    ctx = build_chapter_context(db, book.id, ch2.id)

    assert ctx["previous_chapter_content"] == "Full chapter one text."
    assert ctx["current_chapter_title"] == "Ch2"
    # Target chapter excluded from summaries
    assert all(s["order"] != 1 for s in ctx["chapter_summaries"])


def test_build_chapter_context_book_not_found(db: Session):
    with pytest.raises(ValueError, match="not found"):
        build_chapter_context(db, "nonexistent", "ch-1")


def test_build_chapter_context_chapter_not_in_book(db: Session):
    book = _make_book(db)
    _make_chapter(db, book.id, "ch-1", 0, "Ch1", "", None)

    with pytest.raises(ValueError, match="not found"):
        build_chapter_context(db, book.id, "ch-wrong")
