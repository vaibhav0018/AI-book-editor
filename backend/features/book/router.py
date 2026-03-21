"""FastAPI routes for books — thin handlers that delegate to the service."""

from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from features.book import service
from features.book.schemas import BookCreate, BookUpdate, BookResponse, BookListResponse

router = APIRouter(prefix="/api/books", tags=["books"])


@router.post("/", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
async def create_book(payload: BookCreate, db: Session = Depends(get_db)):
    """Create a new book."""
    return service.create_book(db, payload)


@router.get("/", response_model=List[BookListResponse])
async def list_books(db: Session = Depends(get_db)):
    """List all books."""
    return service.list_books(db)


@router.get("/{book_id}", response_model=BookResponse)
async def get_book(book_id: str, db: Session = Depends(get_db)):
    """Get a single book with its chapters."""
    return service.get_book(db, book_id)


@router.put("/{book_id}", response_model=BookResponse)
async def update_book(book_id: str, payload: BookUpdate, db: Session = Depends(get_db)):
    """Update book metadata."""
    return service.update_book(db, book_id, payload)


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(book_id: str, db: Session = Depends(get_db)):
    """Delete a book and all its chapters."""
    service.delete_book(db, book_id)
