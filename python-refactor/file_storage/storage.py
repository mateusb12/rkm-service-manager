"""Storage abstractions and the Garage S3-compatible implementation."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import BinaryIO, Protocol

import boto3
from botocore.client import Config


class StorageNotConfiguredError(RuntimeError):
    """Raised when the Garage connection is missing required settings."""


@dataclass(frozen=True)
class ObjectMetadata:
    key: str
    size: int
    etag: str = ""
    content_type: str = ""
    last_modified: datetime | None = None
    metadata: dict[str, str] = field(default_factory=dict)


class ObjectStorage(Protocol):
    def health(self) -> None: ...

    def put(
        self,
        key: str,
        body: BinaryIO,
        *,
        content_type: str,
        size: int | None,
        metadata: dict[str, str],
    ) -> str: ...

    def get(self, key: str): ...

    def delete(self, key: str) -> None: ...

    def head(self, key: str) -> ObjectMetadata: ...

    def list(self, prefix: str = "") -> list[ObjectMetadata]: ...


def _config_from_env() -> dict[str, str]:
    return {
        "endpoint_url": os.getenv("GARAGE_S3_API_URL", ""),
        "aws_access_key_id": os.getenv("GARAGE_S3_ACCESS_KEY_ID", ""),
        "aws_secret_access_key": os.getenv("GARAGE_S3_SECRET_ACCESS_KEY", ""),
        "bucket": os.getenv("GARAGE_S3_BUCKET", ""),
        "region_name": os.getenv("GARAGE_S3_REGION", "us-east-1"),
    }


class GarageObjectStorage:
    """Garage adapter using its S3-compatible API and path-style URLs."""

    def __init__(self, config: dict[str, str] | None = None) -> None:
        values = config or _config_from_env()
        self.bucket = values["bucket"]
        self.ready = all(
            values.get(name)
            for name in ("endpoint_url", "aws_access_key_id", "aws_secret_access_key", "bucket")
        )
        self.client = None
        if self.ready:
            self.client = boto3.client(
                "s3",
                endpoint_url=values["endpoint_url"],
                aws_access_key_id=values["aws_access_key_id"],
                aws_secret_access_key=values["aws_secret_access_key"],
                region_name=values["region_name"],
                config=Config(s3={"addressing_style": "path"}),
            )

    def _client(self):
        if not self.ready or self.client is None:
            raise StorageNotConfiguredError("object storage is not configured")
        return self.client

    def health(self) -> None:
        self._client().list_objects_v2(Bucket=self.bucket, MaxKeys=1)

    def put(
        self,
        key: str,
        body: BinaryIO,
        *,
        content_type: str,
        size: int | None,
        metadata: dict[str, str],
    ) -> str:
        params = {
            "Bucket": self.bucket,
            "Key": key,
            "Body": body,
            "ContentType": content_type,
            "Metadata": metadata,
        }
        if size is not None and size >= 0:
            params["ContentLength"] = size
        result = self._client().put_object(**params)
        return str(result.get("ETag", ""))

    def get(self, key: str):
        return self._client().get_object(Bucket=self.bucket, Key=key)["Body"]

    def delete(self, key: str) -> None:
        self._client().delete_object(Bucket=self.bucket, Key=key)

    def head(self, key: str) -> ObjectMetadata:
        result = self._client().head_object(Bucket=self.bucket, Key=key)
        return ObjectMetadata(
            key=key,
            size=result.get("ContentLength", 0),
            etag=result.get("ETag", ""),
            content_type=result.get("ContentType", ""),
            last_modified=result.get("LastModified"),
            metadata={str(k).lower(): str(v) for k, v in result.get("Metadata", {}).items()},
        )

    def list(self, prefix: str = "") -> list[ObjectMetadata]:
        paginator = self._client().get_paginator("list_objects_v2")
        objects: list[ObjectMetadata] = []
        for page in paginator.paginate(Bucket=self.bucket, Prefix=prefix):
            for item in page.get("Contents", []):
                objects.append(
                    ObjectMetadata(
                        key=item.get("Key", ""),
                        size=item.get("Size", 0),
                        etag=item.get("ETag", ""),
                        last_modified=item.get("LastModified"),
                    )
                )
        return objects

