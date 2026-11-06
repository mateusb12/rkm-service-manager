import pytest

from app import app
from features.auth.repository import auth_database


@pytest.fixture
def devmetrics_client(tmp_path, monkeypatch):
    monkeypatch.setitem(app.config, "DB_PATH", str(tmp_path / "devmetrics.db"))
    monkeypatch.setitem(app.config, "APP_ENV", "development")
    monkeypatch.setenv("AUTH_JWT_SECRET", "test-secret-with-at-least-32-bytes")
    with app.app_context():
        auth_database.create_schema()
        auth_database.seed_users()
    return app.test_client()


def admin_headers(client):
    response = client.post(
        "/auth/login",
        json={"email": "admin@rkm.com.br", "password": "Rkm@123456"},
        headers={"X-Auth-Transport": "bearer"},
    )
    return {"Authorization": f"Bearer {response.json['accessToken']}"}


def test_devmetrics_lifecycle(devmetrics_client):
    headers = admin_headers(devmetrics_client)
    feature_id = "pcp/clientes"

    settings = devmetrics_client.put(
        "/dev/feature-metrics/settings",
        headers=headers,
        json={"featureId": feature_id, "branch": "features/pcp/clientes", "estimatedHours": 8.5, "functionPoints": 13},
    )
    assert settings.status_code == 200
    assert settings.json["estimatedHours"] == 8.5
    assert settings.json["functionPoints"] == 13
    assert settings.json["locked"] is False

    freeze = devmetrics_client.post(
        "/dev/feature-metrics/freeze",
        headers=headers,
        json={
            "featureId": feature_id,
            "branch": "features/pcp/clientes",
            "wakatimeSeconds": 100,
            "chatGptSeconds": 50,
            "localSeconds": 25,
            "editors": [{"name": "WebStorm", "totalSeconds": 100}],
        },
    )
    assert freeze.status_code == 200
    assert freeze.json["locked"] is True
    assert freeze.json["editors"] == [{"name": "WebStorm", "totalSeconds": 100.0}]

    listed = devmetrics_client.get("/dev/feature-metrics", headers=headers)
    assert listed.status_code == 200
    assert listed.json[0]["featureId"] == feature_id

    fetched = devmetrics_client.get(
        f"/dev/feature-metrics?feature={feature_id}", headers=headers
    )
    assert fetched.status_code == 200
    assert fetched.json["wakatimeSeconds"] == 100

    unlock = devmetrics_client.post(
        "/dev/feature-metrics/unlock",
        headers=headers,
        json={"featureId": feature_id},
    )
    assert unlock.status_code == 200
    assert unlock.json["locked"] is False
    assert unlock.json["completedAt"] == 0


def test_devmetrics_requires_permission(devmetrics_client):
    response = devmetrics_client.get("/dev/feature-metrics")
    assert response.status_code == 401

    login = devmetrics_client.post(
        "/auth/login",
        json={"email": "pcp@rkm.com.br", "password": "Rkm@123456"},
        headers={"X-Auth-Transport": "bearer"},
    )
    response = devmetrics_client.get(
        "/dev/feature-metrics",
        headers={"Authorization": f"Bearer {login.json['accessToken']}"},
    )
    assert response.status_code == 403
