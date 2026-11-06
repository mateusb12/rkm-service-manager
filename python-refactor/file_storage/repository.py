"""Persistence operations for file metadata."""

from __future__ import annotations

import secrets
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

try:
    from ..auth.repository import session
except ImportError:
    from auth.repository import session

from .model import File
from .storage import ObjectMetadata, ObjectStorage


def ensure_schema(database: Session) -> None:
    File.__table__.create(database.get_bind(), checkfirst=True)


def list_records(database: Session, prefix: str = "") -> list[File]:
    query = select(File).order_by(File.uploaded_at.desc())
    if prefix:
        query = query.where(File.storage_key.startswith(prefix))
    return list(database.scalars(query).all())


def find_record(database: Session, key: str) -> File | None:
    return database.scalar(select(File).where(File.storage_key == key))


def save_record(
    database: Session,
    *,
    key: str,
    original_name: str,
    content_type: str,
    size: int,
    etag: str,
    uploaded_by_id: str | None,
    uploaded_by_name: str | None,
    uploaded_at: datetime,
) -> File:
    record = File(
        id="f-" + secrets.token_hex(12),
        storage_key=key,
        original_name=original_name,
        content_type=content_type,
        size=size,
        etag=etag,
        uploaded_by_id=uploaded_by_id,
        uploaded_by_name=uploaded_by_name,
        uploaded_at=uploaded_at,
    )
    database.add(record)
    database.flush()
    return record


def delete_record(database: Session, record: File) -> None:
    database.delete(record)
    database.flush()


def migrate_legacy_objects(database: Session, storage: ObjectStorage) -> int:
    """Import existing Garage objects once when the metadata table is empty."""

    if database.scalar(select(func.count()).select_from(File)):
        return 0

    imported = 0
    for listed_object in storage.list("files/"):
        metadata = storage.head(listed_object.key)
        uploaded_at = metadata.last_modified or datetime.now(timezone.utc)
        uploaded_at_value = metadata.metadata.get("uploaded-at", "")
        if uploaded_at_value:
            try:
                uploaded_at = datetime.fromisoformat(uploaded_at_value.replace("Z", "+00:00"))
            except ValueError:
                pass
        save_record(
            database,
            key=metadata.key,
            original_name=metadata.metadata.get("original-name") or metadata.key.rsplit("/", 1)[-1],
            content_type=metadata.content_type or "application/octet-stream",
            size=metadata.size,
            etag=metadata.etag,
            uploaded_by_id=metadata.metadata.get("uploaded-by-id"),
            uploaded_by_name=metadata.metadata.get("uploaded-by-name"),
            uploaded_at=uploaded_at,
        )
        imported += 1
    database.commit()
    return imported
