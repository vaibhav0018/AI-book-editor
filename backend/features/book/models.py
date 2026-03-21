"""SQLAlchemy model for the ``books`` table."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.orm import relationship

from database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Book(Base):
    __tablename__ = "books"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    genre = Column(String(100), nullable=True)
    brief = Column(Text, nullable=True)
    global_summary = Column(Text, nullable=True)
    style_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    chapters = relationship(
        "Chapter", back_populates="book", cascade="all, delete-orphan",
        order_by="Chapter.order_index",
    )
