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


def test_update_book(client, db):
    book = _create_book(db, "Old Title")
    resp = client.put(f"/api/books/{book.id}", json={"title": "New Title", "genre": "thriller"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "New Title"
    assert data["genre"] == "thriller"


def test_delete_book(client, db):
    book = _create_book(db)
    resp = client.delete(f"/api/books/{book.id}")
    assert resp.status_code == 204
    assert client.get(f"/api/books/{book.id}").status_code == 404


def test_get_chapter_by_id(client, db):
    book = _create_book(db)
    ch = _create_chapter(db, book.id, 0, "One")
    resp = client.get(f"/api/chapters/{ch.id}")
    assert resp.status_code == 200
    assert resp.json()["title"] == "One"
    assert resp.json()["book_id"] == book.id


def test_list_chapters_for_book(client, db):
    book = _create_book(db)
    _create_chapter(db, book.id, 0, "A")
    _create_chapter(db, book.id, 1, "B")
    resp = client.get(f"/api/books/{book.id}/chapters")
    assert resp.status_code == 200
    titles = [c["title"] for c in resp.json()]
    assert titles == ["A", "B"]


def test_delete_chapter(client, db):
    book = _create_book(db)
    ch = _create_chapter(db, book.id, 0, "Gone")
    resp = client.delete(f"/api/chapters/{ch.id}")
    assert resp.status_code == 204
    assert client.get(f"/api/chapters/{ch.id}").status_code == 404


def test_reorder_chapter(client, db):
    book = _create_book(db)
    c0 = _create_chapter(db, book.id, 0, "First")
    c1 = _create_chapter(db, book.id, 1, "Second")
    # Move "Second" to index 0
    resp = client.patch(f"/api/chapters/{c1.id}/reorder", json={"order_index": 0})
    assert resp.status_code == 200
    listed = client.get(f"/api/books/{book.id}/chapters").json()
    assert listed[0]["title"] == "Second"
    assert listed[1]["title"] == "First"


def test_chapter_ai_history_empty(client, db):
    book = _create_book(db)
    ch = _create_chapter(db, book.id, 0, "Ch")
    resp = client.get(f"/api/chapters/{ch.id}/history")
    assert resp.status_code == 200
    assert resp.json() == []


def test_export_pdf(client, db):
    book = _create_book(db, "PDF Book")
    resp = client.get(f"/api/books/{book.id}/export/pdf")
    assert resp.status_code == 200
    assert resp.headers.get("content-type", "").startswith("application/pdf")
    assert len(resp.content) > 100


def test_openapi_schema(client):
    resp = client.get("/openapi.json")
    assert resp.status_code == 200
    spec = resp.json()
    assert "paths" in spec
    assert "/api/books/" in spec["paths"]
