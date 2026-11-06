import pytest
from sqlalchemy import select

from app import app
from auth.model import AuthSession, User
from auth.repository import auth_database, password_hash, session, verify_password


@pytest.fixture
def auth_client(tmp_path, monkeypatch):
    database_path = tmp_path / "auth.db"
    monkeypatch.setitem(app.config, "DB_PATH", str(database_path))
    monkeypatch.setitem(app.config, "APP_ENV", "development")
    monkeypatch.setenv("AUTH_JWT_SECRET", "test-secret-with-at-least-32-bytes")
    monkeypatch.setenv("DUMMY_PASSWORD_PCP", "Rkm@123456")
    with app.app_context():
        auth_database.create_schema()
        auth_database.seed_users()
    return app.test_client()


def login(client, email="pcp@rkm.com.br"):
    return client.post(
        "/api/auth/login",
        json={"email": email, "password": "Rkm@123456"},
        headers={"X-Auth-Transport": "bearer"},
    )


def test_auth_contract(auth_client, subtests):
    with subtests.test(msg="1.1 usuário autenticado deve completar login, refresh e logout"):
        login_response = login(auth_client)
        assert login_response.status_code == 200
        tokens = login_response.json
        assert tokens["user"]["role"] == "pcp"
        assert tokens["accessToken"]
        assert tokens["refreshToken"]

        me_response = auth_client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {tokens['accessToken']}"},
        )
        assert me_response.status_code == 200
        assert me_response.json["email"] == "pcp@rkm.com.br"

        refresh_response = auth_client.post(
            "/api/auth/refresh",
            headers={"X-Refresh-Token": tokens["refreshToken"]},
        )
        assert refresh_response.status_code == 200
        assert refresh_response.json["refreshToken"] != tokens["refreshToken"]

        reused_response = auth_client.post(
            "/api/auth/refresh",
            headers={"X-Refresh-Token": tokens["refreshToken"]},
        )
        assert reused_response.status_code == 401
        assert reused_response.json["error"] == "refresh_expired"

        logout_response = auth_client.post(
            "/api/auth/logout",
            headers={"Authorization": f"Bearer {refresh_response.json['accessToken']}"},
        )
        assert logout_response.status_code == 200

        after_logout_response = auth_client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {refresh_response.json['accessToken']}"},
        )
        assert after_logout_response.status_code == 401

    with subtests.test(msg="1.2 credenciais inválidas devem ser rejeitadas"):
        response = auth_client.post(
            "/api/auth/login",
            json={"email": "pcp@rkm.com.br", "password": "wrong"},
        )
        assert response.status_code == 401
        assert response.json == {"error": "invalid_credentials"}

    with subtests.test(msg="1.3 usuários não autenticados devem ser barrados de rotas protegidas"):
        unauthenticated_response = auth_client.get("/api/auth/active-users")
        assert unauthenticated_response.status_code == 401

        authenticated_response = auth_client.get(
            "/api/auth/active-users",
            headers={"Authorization": f"Bearer {login(auth_client).json['accessToken']}"},
        )
        assert authenticated_response.status_code == 200
        assert len(authenticated_response.json) == 4

    with subtests.test(msg="1.4 gestão de usuários deve exigir users.manage"):
        pcp_tokens = login(auth_client)
        denied_response = auth_client.get(
            "/api/admin/users",
            headers={"Authorization": f"Bearer {pcp_tokens.json['accessToken']}"},
        )
        assert denied_response.status_code == 403

        admin_tokens = login(auth_client, "admin@rkm.com.br")
        admin_headers = {"Authorization": f"Bearer {admin_tokens.json['accessToken']}"}
        listed_response = auth_client.get("/api/admin/users", headers=admin_headers)
        assert listed_response.status_code == 200
        assert len(listed_response.json) == 4

        created_response = auth_client.post(
            "/api/admin/users",
            headers=admin_headers,
            json={
                "name": "Usuário Teste",
                "email": "teste@rkm.com.br",
                "role": "commercial",
                "password": "Senha@123",
            },
        )
        assert created_response.status_code == 201
        user_id = created_response.json["id"]

        deactivated_response = auth_client.delete(
            f"/api/admin/users/{user_id}", headers=admin_headers
        )
        assert deactivated_response.status_code == 200
        assert deactivated_response.json["active"] is False

        deleted_response = auth_client.delete(
            f"/api/admin/users/{user_id}/permanent", headers=admin_headers
        )
        assert deleted_response.status_code == 204

    with subtests.test(msg="1.5 hash de senha deve seguir contrato Argon2id do Go"):
        encoded_password = password_hash("Rkm@123456")
        assert encoded_password.startswith("argon2id$v=19$m=65536,t=3,p=2$")
        assert verify_password(encoded_password, "Rkm@123456")
        assert not verify_password(encoded_password, "wrong")

    with subtests.test(msg="1.6 tabelas de auth devem estar disponíveis pelo ORM"):
        response = login(auth_client, "admin@rkm.com.br")
        assert response.status_code == 200

        with app.app_context():
            database = session()
            try:
                assert database.scalar(select(User).where(User.email == "admin@rkm.com.br"))
                assert database.scalar(select(AuthSession))
            finally:
                database.close()

