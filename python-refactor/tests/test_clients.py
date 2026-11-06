import pytest

from app import app
from auth.repository import auth_database


@pytest.fixture
def clients_client(tmp_path, monkeypatch):
    monkeypatch.setitem(app.config, "DB_PATH", str(tmp_path / "clients.db"))
    monkeypatch.setitem(app.config, "APP_ENV", "development")
    monkeypatch.setenv("AUTH_JWT_SECRET", "test-secret-with-at-least-32-bytes")
    with app.app_context():
        auth_database.create_schema()
        auth_database.seed_users()
    return app.test_client()


def login(client, email="pcp@rkm.com.br"):
    response = client.post(
        "/auth/login",
        json={"email": email, "password": "Rkm@123456"},
        headers={"X-Auth-Transport": "bearer"},
    )
    return {"Authorization": f"Bearer {response.json['accessToken']}"}


def test_clients_crud_and_search(clients_client):
    headers = login(clients_client)
    create = clients_client.post(
        "/clients",
        headers=headers,
        json={
            "cnpj": "10.203.040/0001-50",
            "razaoSocial": "Metalúrgica Atlântico Ltda.",
            "nomeFantasia": "Metal Atlântico",
        },
    )
    assert create.status_code == 201
    assert create.json["cnpj"] == "10203040000150"
    client_id = create.json["id"]

    search = clients_client.get("/clients?search=atlantico", headers=headers)
    assert search.status_code == 200
    assert len(search.json) == 1

    update = clients_client.put(
        f"/clients/{client_id}",
        headers=headers,
        json={
            "cnpj": "10.203.040/0001-50",
            "razaoSocial": "Metalúrgica Atlântico S.A.",
            "nomeFantasia": "Atlântico Industrial",
        },
    )
    assert update.status_code == 200
    assert update.json["nomeFantasia"] == "Atlântico Industrial"

    assert clients_client.get(f"/clients/{client_id}", headers=headers).status_code == 200
    assert clients_client.delete(f"/clients/{client_id}", headers=headers).status_code == 204
    assert clients_client.get(f"/clients/{client_id}", headers=headers).status_code == 404


def test_clients_validation_duplicate_and_permissions(clients_client):
    pcp_headers = login(clients_client)
    invalid = clients_client.post(
        "/clients",
        headers=pcp_headers,
        json={"cnpj": "abc123", "razaoSocial": "", "nomeFantasia": ""},
    )
    assert invalid.status_code == 400
    assert invalid.json["error"] == "validation_failed"

    payload = {
        "cnpj": "10203040000150",
        "razaoSocial": "Empresa Um",
        "nomeFantasia": "Empresa Um",
    }
    assert clients_client.post("/clients", headers=pcp_headers, json=payload).status_code == 201
    duplicate = clients_client.post("/clients", headers=pcp_headers, json=payload)
    assert duplicate.status_code == 409
    assert duplicate.json == {"error": "cnpj_already_exists"}

    commercial_headers = login(clients_client, "comercial@rkm.com.br")
    assert clients_client.get("/clients", headers=commercial_headers).status_code == 403
    assert clients_client.post("/clients", headers=commercial_headers, json=payload).status_code == 403
    assert clients_client.get("/clients/not-an-id", headers=pcp_headers).json == {"error": "invalid_client_id"}
