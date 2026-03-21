"""SQLAlchemy model for the ``chapters`` table."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
import enum

from database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ChapterStatus(str, enum.Enum):
    empty = "empty"
    draft = "draft"
    reviewed = "reviewed"


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    book_id = Column(String(36), ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    order_index = Column(Integer, nullable=False, default=0)
    title = Column(String(255), nullable=False)
    brief = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    status = Column(SAEnum(ChapterStatus), default=ChapterStatus.empty, nullable=False)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    book = relationship("Book", back_populates="chapters")
    ai_actions = relationship(
        "AIAction", back_populates="chapter", cascade="all, delete-orphan",
        order_by="AIAction.created_at.desc()",
    )
