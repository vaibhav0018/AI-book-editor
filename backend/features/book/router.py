"""FastAPI routes for books — thin handlers that delegate to the service."""

import re
import unicodedata
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from database import get_db
from features.book import service
from features.book.schemas import BookCreate, BookUpdate, BookResponse, BookListResponse
from features.book.export_pdf import generate_book_pdf

router = APIRouter(prefix="/api/books", tags=["books"])


def _pdf_attachment_filename(title: str) -> str:
    """ASCII-only name for Content-Disposition — quotes, slashes, Unicode, etc. can break headers (500)."""
    t = unicodedata.normalize("NFKD", (title or "book").strip())
    t = "".join(c for c in t if not unicodedata.combining(c))
    base = re.sub(r"[^a-zA-Z0-9._-]+", "_", t).strip("._") or "book"
    return f"{base[:120]}.pdf"


@router.post("/", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
async def create_book(payload: BookCreate, db: Session = Depends(get_db)):
    """Create a new book."""
    return service.create_book(db, payload)


@router.get("/", response_model=List[BookListResponse])
async def list_books(db: Session = Depends(get_db)):
    """List all books."""
    return service.list_books(db)


# More specific path must be registered before `/{book_id}` so it is not shadowed.
@router.get("/{book_id}/export/pdf")
async def export_book_pdf(book_id: str, db: Session = Depends(get_db)):
    """Download the full book as a PDF."""
    try:
        pdf_bytes = generate_book_pdf(db, book_id)
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    book = service.get_book(db, book_id)
    filename = _pdf_attachment_filename(book.title)
    return Response(
        content=bytes(pdf_bytes) if not isinstance(pdf_bytes, bytes) else pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


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
