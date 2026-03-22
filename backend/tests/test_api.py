"""API endpoint tests — books, chapters, basic flows."""

import pytest
from sqlalchemy.orm import Session

from features.book.models import Book
from features.chapter.models import Chapter, ChapterStatus


def _create_book(db: Session, title: str = "Test Book") -> Book:
    book = Book(title=title, genre="fiction", brief="A test")
    db.add(book)
    db.commit()
    db.refresh(book)
    return book


def _create_chapter(db: Session, book_id: str, order: int, title: str = "Ch1") -> Chapter:
    ch = Chapter(book_id=book_id, order_index=order, title=title, status=ChapterStatus.empty)
    db.add(ch)
    db.commit()
    db.refresh(ch)
    return ch


def test_create_book(client):
    resp = client.post("/api/books/", json={"title": "My Novel", "genre": "sci-fi", "brief": "Space saga"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "My Novel"
    assert data["genre"] == "sci-fi"
    assert "id" in data


def test_list_books_empty(client):
    resp = client.get("/api/books/")
    assert resp.status_code == 200
    assert resp.json() == []


def test_list_books(client, db):
    _create_book(db, "A")
    _create_book(db, "B")
    resp = client.get("/api/books/")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    titles = [b["title"] for b in data]
    assert "A" in titles and "B" in titles


def test_get_book_404(client):
    resp = client.get("/api/books/nonexistent-id")
    assert resp.status_code == 404


def test_get_book_with_chapters(client, db):
    book = _create_book(db, "With Chapters")
    _create_chapter(db, book.id, 0, "Prologue")
    _create_chapter(db, book.id, 1, "Act One")

    resp = client.get(f"/api/books/{book.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "With Chapters"
    assert len(data["chapters"]) == 2
    assert data["chapters"][0]["title"] == "Prologue"


def test_create_chapter(client, db):
    book = _create_book(db)
    resp = client.post(f"/api/books/{book.id}/chapters", json={"title": "New Chapter"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "New Chapter"
    assert data["book_id"] == book.id


def test_update_chapter(client, db):
    book = _create_book(db)
    ch = _create_chapter(db, book.id, 0, "Original")
    resp = client.put(f"/api/chapters/{ch.id}", json={"content": "<p>New content</p>", "status": "draft"})
    assert resp.status_code == 200
    assert resp.json()["content"] == "<p>New content</p>"


def test_summarize_requires_content(client, db):
    book = _create_book(db)
    ch = _create_chapter(db, book.id, 0, "Empty Chapter")
    resp = client.post("/api/ai/summarize", json={"chapter_id": ch.id})
    assert resp.status_code == 422
    assert "content" in resp.json().get("detail", "").lower()
