"""Generate a PDF of an entire book with all chapters in sequence."""

import io
import re
import html as html_mod
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


class BookPDF(FPDF):
    def __init__(self, book_title: str, genre: str):
        super().__init__()
        self._book_title = book_title
        self._genre = genre

    def header(self):
        if self.page_no() > 1:
            self.set_font("Helvetica", "I", 8)
            self.set_text_color(140, 140, 140)
            self.cell(0, 8, self._book_title, align="C")
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

    # ── Title page ──
    pdf.add_page()
    pdf.ln(60)
    pdf.set_font("Helvetica", "B", 28)
    pdf.set_text_color(44, 24, 16)
    pdf.multi_cell(0, 14, book.title, align="C")
    pdf.ln(6)

    if book.genre:
        pdf.set_font("Helvetica", "I", 14)
        pdf.set_text_color(139, 115, 85)
        pdf.cell(0, 10, book.genre, align="C")
        pdf.ln(20)

    if book.brief:
        pdf.set_font("Helvetica", "", 11)
        pdf.set_text_color(100, 100, 100)
        pdf.set_x(30)
        pdf.multi_cell(pdf.w - 60, 6, book.brief, align="C")

    # ── Chapters ──
    for ch in chapters:
        if not ch.content:
            continue

        pdf.add_page()
        pdf.set_font("Helvetica", "B", 20)
        pdf.set_text_color(44, 24, 16)
        pdf.multi_cell(0, 12, ch.title, align="L")
        pdf.ln(4)

        # Horizontal rule
        pdf.set_draw_color(200, 180, 160)
        pdf.set_line_width(0.4)
        pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
        pdf.ln(8)

        body = _strip_html(ch.content)
        # Remove markdown chapter headers that the AI generates
        body = re.sub(r"^#{1,3}\s+.*$", "", body, flags=re.MULTILINE).strip()

        pdf.set_font("Helvetica", "", 11)
        pdf.set_text_color(30, 30, 30)

        for para in body.split("\n\n"):
            para = para.strip()
            if not para:
                continue
            pdf.multi_cell(0, 6, para)
            pdf.ln(3)

    buf = io.BytesIO()
    pdf.output(buf)
    return buf.getvalue()
