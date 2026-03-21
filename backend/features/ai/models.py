"""SQLAlchemy model for the ``ai_actions`` audit / version-history table."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class AIAction(Base):
    __tablename__ = "ai_actions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chapter_id = Column(String(36), ForeignKey("chapters.id", ondelete="CASCADE"), nullable=False)
    action_type = Column(String(50), nullable=False)
    context_snapshot = Column(Text, nullable=True)
    output = Column(Text, nullable=True)
    model_used = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=_utcnow)

    chapter = relationship("Chapter", back_populates="ai_actions")
