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
    category: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    etag: Mapped[str] = mapped_column(String, nullable=False, default="")
    uploaded_by_id: Mapped[str | None] = mapped_column(String, nullable=True)
    uploaded_by_name: Mapped[str | None] = mapped_column(String, nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


def serialize_file(record: File) -> dict:
    return {
        "id": record.id,
        "key": record.storage_key,
        "name": record.original_name,
        "size": record.size,
        "etag": record.etag,
        "contentType": record.content_type,
        "category": record.category,
        "uploadedById": record.uploaded_by_id,
        "uploadedBy": record.uploaded_by_name,
        "uploadedAt": record.uploaded_at,
    }
