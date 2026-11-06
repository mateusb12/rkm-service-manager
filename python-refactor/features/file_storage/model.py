"""Database model for file metadata."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Index, String
from sqlalchemy.orm import Mapped, mapped_column

try:
    from ..auth.model import Base
except ImportError:
    from ..auth.model import Base


class File(Base):
    __tablename__ = "files"
    __table_args__ = (Index("ix_files_uploaded_at", "uploaded_at"),)

    id: Mapped[str] = mapped_column(String, primary_key=True)
    storage_key: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    original_name: Mapped[str] = mapped_column(String, nullable=False)
    content_type: Mapped[str] = mapped_column(String, nullable=False)
    size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    etag: Mapped[str] = mapped_column(String, nullable=False, default="")
    uploaded_by_id: Mapped[str | None] = mapped_column(String, nullable=True)
    uploaded_by_name: Mapped[str | None] = mapped_column(String, nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
