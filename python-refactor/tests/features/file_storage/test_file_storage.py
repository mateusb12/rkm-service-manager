from datetime import datetime, timezone
from io import BytesIO

import pytest

from app import app
from features.auth.repository import auth_database
from features.file_storage.controller import FILE_STORAGE_BLUEPRINT
from features.file_storage.storage import ObjectMetadata


class FakeStorage:
    def __init__(self):
        self.objects = {}

    def health(self):
        return None

    def put(self, key, body, *, content_type, size, metadata):
        self.objects[key] = {
            "body": body.read(),
            "content_type": content_type,
            "metadata": metadata,
        }
        return '"fake-etag"'

    def get(self, key):
        return BytesIO(self.objects[key]["body"])

    def delete(self, key):
        self.objects.pop(key, None)

    def head(self, key):
        item = self.objects[key]
        return ObjectMetadata(
            key=key,
            size=len(item["body"]),
            etag='"fake-etag"',
            content_type=item["content_type"],
            last_modified=datetime.now(timezone.utc),
            metadata=item["metadata"],
        )

    def list(self, prefix=""):
        return [
            ObjectMetadata(key=key, size=len(item["body"]))
            for key, item in self.objects.items()
            if key.startswith(prefix)
        ]


@pytest.fixture
def files_client(tmp_path, monkeypatch):
    monkeypatch.setitem(app.config, "DB_PATH", str(tmp_path / "files.db"))
    monkeypatch.setitem(app.config, "APP_ENV", "development")
    monkeypatch.setenv("AUTH_JWT_SECRET", "test-secret-with-at-least-32-bytes")
    storage = FakeStorage()
    FILE_STORAGE_BLUEPRINT._storage = storage
    with app.app_context():
        auth_database.create_schema()
        auth_database.seed_users()
    yield app.test_client(), storage
    FILE_STORAGE_BLUEPRINT._storage = None


def admin_headers(client):
    response = client.post(
        "/auth/login",
        json={"email": "admin@rkm.com.br", "password": "Rkm@123456"},
        headers={"X-Auth-Transport": "bearer"},
    )
    return {"Authorization": f"Bearer {response.json['accessToken']}"}


def test_file_storage_lifecycle(files_client):
    client, storage = files_client
    headers = admin_headers(client)

    health = client.get("/files/storage-health", headers=headers)
    assert health.status_code == 200
    assert health.json == {"provider": "garage", "status": "healthy"}

    upload = client.post(
        "/files",
        headers=headers,
        data={"file": (BytesIO(b"hello files"), "../manual.txt")},
        content_type="multipart/form-data",
    )
    assert upload.status_code == 201
    assert upload.json["name"] == "manual.txt"
    assert upload.json["contentType"] == "text/plain"
    key = upload.json["key"]
    assert storage.objects[key]["metadata"] == {}

    listing = client.get("/files", headers=headers)
    assert listing.status_code == 200
    assert listing.json[0]["key"] == key

    download = client.get(f"/files/{key}", headers=headers)
    assert download.status_code == 200
    assert download.data == b"hello files"
    assert "inline" in download.headers["Content-Disposition"]

    delete = client.delete(f"/files/{key}", headers=headers)
    assert delete.status_code == 204


def test_file_storage_requires_permission(files_client):
    client, _ = files_client
    assert client.get("/files").status_code == 401
    assert client.post("/files", data={}).status_code == 401


def test_file_storage_is_documented(files_client):
    client, _ = files_client
    response = client.get("/openapi.json")
    assert response.status_code == 200
    paths = response.json["paths"]
    assert "/files" in paths
    assert "/files/{key}" in paths
    assert paths["/files"]["post"]["summary"] == "Envia um arquivo"
