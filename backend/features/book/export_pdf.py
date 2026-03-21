"""Generate a PDF of an entire book with all chapters in sequence."""

import re
import html as html_mod
import unicodedata
from fpdf import FPDF

from sqlalchemy.orm import Session
from features.book.models import Book
from features.chapter.models import Chapter


def _strip_html(text: str) -> str:
    """Remove HTML tags and decode entities to plain text."""
    clean = re.sub(r"<br\s*/?>", "\n", text or "")
    clean = re.sub(r"</p>", "\n\n", clean)
    clean = re.sub(r"<[^>]+>", "", clean)
    clean = html_mod.unescape(clean)
    clean = re.sub(r"\n{3,}", "\n\n", clean)
    return clean.strip()


def _safe_pdf_text(text: str) -> str:
    """
    Core PDF fonts (Helvetica) only accept Latin-1. AI/editor text often uses
    smart quotes, em dashes, ellipsis, etc., which raise FPDFUnicodeEncodingException
    and can break the export. Normalize to ASCII-ish Latin-1.
    """
    if not text:
        return ""
    normalized = unicodedata.normalize("NFKD", text)
    without_combining = "".join(c for c in normalized if not unicodedata.combining(c))
    return without_combining.encode("latin-1", errors="replace").decode("latin-1")


class BookPDF(FPDF):
    def __init__(self, book_title: str, genre: str):
        super().__init__()
        self._book_title = book_title
        self._genre = genre

    def header(self):
        if self.page_no() > 1:
            self.set_font("Helvetica", "I", 8)
            self.set_text_color(140, 140, 140)
            self.cell(0, 8, _safe_pdf_text(self._book_title), align="C")
            self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(140, 140, 140)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")


def generate_book_pdf(db: Session, book_id: str) -> bytes:
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise ValueError(f"Book {book_id} not found")

    chapters = (
        db.query(Chapter)
        .filter(Chapter.book_id == book_id)
        .order_by(Chapter.order_index)
        .all()
    )

    pdf = BookPDF(book.title, book.genre or "")
    pdf.set_auto_page_break(auto=True, margin=25)

    title_safe = _safe_pdf_text(book.title)
    genre_safe = _safe_pdf_text(book.genre or "")
    brief_safe = _safe_pdf_text(book.brief or "")

    # ── Title page ──
    pdf.add_page()
    pdf.ln(60)
    pdf.set_font("Helvetica", "B", 28)
    pdf.set_text_color(44, 24, 16)
    # fpdf2: multi_cell width 0 can break layout; use effective page width
    pdf.multi_cell(pdf.epw, 14, title_safe or "Untitled", align="C")
    pdf.ln(6)

    if genre_safe:
        pdf.set_font("Helvetica", "I", 14)
        pdf.set_text_color(139, 115, 85)
        pdf.cell(0, 10, genre_safe, align="C")
        pdf.ln(20)

    if brief_safe:
        pdf.set_font("Helvetica", "", 11)
        pdf.set_text_color(100, 100, 100)
        pdf.multi_cell(pdf.epw, 6, brief_safe, align="C")

    # ── Chapters (only rows with saved content) ──
    chapters_with_body = [ch for ch in chapters if ch.content and ch.content.strip()]
    if not chapters_with_body:
        pdf.add_page()
        pdf.set_font("Helvetica", "", 12)
        pdf.set_text_color(80, 80, 80)
        pdf.multi_cell(
            pdf.epw,
            8,
            _safe_pdf_text(
                "No chapter text has been saved yet. Open a chapter in the editor, "
                "write or generate content, wait for Saved, then export again."
            ),
        )

    for ch in chapters_with_body:
        pdf.add_page()
        pdf.set_font("Helvetica", "B", 20)
        pdf.set_text_color(44, 24, 16)
        pdf.multi_cell(pdf.epw, 12, _safe_pdf_text(ch.title), align="L")
        pdf.ln(4)

        pdf.set_draw_color(200, 180, 160)
        pdf.set_line_width(0.4)
        pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
        pdf.ln(8)

        body = _strip_html(ch.content)
        body = re.sub(r"^#{1,3}\s+.*$", "", body, flags=re.MULTILINE).strip()
        body = _safe_pdf_text(body)

        pdf.set_font("Helvetica", "", 11)
        pdf.set_text_color(30, 30, 30)

        for para in body.split("\n\n"):
            para = para.strip()
            if not para:
                continue
            pdf.multi_cell(pdf.epw, 6, para)
            pdf.ln(3)

    out = pdf.output()
    raw = bytes(out) if isinstance(out, (bytearray, memoryview)) else out
    if isinstance(raw, str):
        raw = raw.encode("latin-1", errors="replace")
    if len(raw) < 100:
        raise RuntimeError("PDF generation produced an unexpectedly small file")
    return raw
