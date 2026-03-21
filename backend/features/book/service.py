"""Book business logic — CRUD operations backed by SQLAlchemy."""

from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from features.book.models import Book
from features.book.schemas import BookCreate, BookUpdate


def create_book(db: Session, payload: BookCreate) -> Book:
    """Persist a new book and return it."""
    book = Book(**payload.model_dump())
    db.add(book)
    db.commit()
    db.refresh(book)
    return book


def list_books(db: Session) -> List[Book]:
    """Return all books ordered by most-recently updated first."""
    return db.query(Book).order_by(Book.updated_at.desc()).all()


def get_book(db: Session, book_id: str) -> Book:
    """Fetch a single book by id, or raise 404."""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    return book


def update_book(db: Session, book_id: str, payload: BookUpdate) -> Book:
    """Apply partial updates to a book."""
    book = get_book(db, book_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(book, field, value)
    db.commit()
    db.refresh(book)
    return book


def delete_book(db: Session, book_id: str) -> None:
    """Delete a book and cascade to chapters and ai_actions."""
    book = get_book(db, book_id)
    db.delete(book)
    db.commit()
