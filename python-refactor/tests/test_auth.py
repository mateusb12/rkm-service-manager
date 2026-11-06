import pytest
from sqlalchemy import select

from app import app, create_app
from auth.model import AuthSession, ROLE_LABELS, ROLE_PERMISSIONS, User
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


def login(client, email="pcp@rkm.com.br", password="Rkm@123456"):
    return client.post(
        "/auth/login",
        json={"email": email, "password": password},
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
            "/auth/me",
            headers={"Authorization": f"Bearer {tokens['accessToken']}"},
        )
        assert me_response.status_code == 200
        assert me_response.json["email"] == "pcp@rkm.com.br"

        refresh_response = auth_client.post(
            "/auth/refresh",
            headers={"X-Refresh-Token": tokens["refreshToken"]},
        )
        assert refresh_response.status_code == 200
        assert refresh_response.json["refreshToken"] != tokens["refreshToken"]

        reused_response = auth_client.post(
            "/auth/refresh",
            headers={"X-Refresh-Token": tokens["refreshToken"]},
        )
        assert reused_response.status_code == 401
        assert reused_response.json["error"] == "refresh_expired"

        logout_response = auth_client.post(
            "/auth/logout",
            headers={"Authorization": f"Bearer {refresh_response.json['accessToken']}"},
        )
        assert logout_response.status_code == 200

        after_logout_response = auth_client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {refresh_response.json['accessToken']}"},
        )
        assert after_logout_response.status_code == 401

    with subtests.test(msg="1.2 credenciais inválidas devem ser rejeitadas"):
        response = auth_client.post(
            "/auth/login",
            json={"email": "pcp@rkm.com.br", "password": "wrong"},
        )
        assert response.status_code == 401
        assert response.json == {"error": "invalid_credentials"}

    with subtests.test(msg="1.3 usuários não autenticados devem ser barrados de rotas protegidas"):
        unauthenticated_response = auth_client.get("/auth/active-users")
        assert unauthenticated_response.status_code == 401

        authenticated_response = auth_client.get(
            "/auth/active-users",
            headers={"Authorization": f"Bearer {login(auth_client).json['accessToken']}"},
        )
        assert authenticated_response.status_code == 200
        assert len(authenticated_response.json) == 4

    with subtests.test(msg="1.4 gestão de usuários deve exigir users.manage"):
        pcp_tokens = login(auth_client)
        denied_response = auth_client.get(
            "/admin/users",
            headers={"Authorization": f"Bearer {pcp_tokens.json['accessToken']}"},
        )
        assert denied_response.status_code == 403

        admin_tokens = login(auth_client, "admin@rkm.com.br")
        admin_headers = {"Authorization": f"Bearer {admin_tokens.json['accessToken']}"}
        listed_response = auth_client.get("/admin/users", headers=admin_headers)
        assert listed_response.status_code == 200
        assert len(listed_response.json) == 4

        created_response = auth_client.post(
            "/admin/users",
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

        created_login_response = login(auth_client, "teste@rkm.com.br", "Senha@123")
        assert created_login_response.status_code == 200
        created_access_token = created_login_response.json["accessToken"]

        fetched_response = auth_client.get(
            f"/admin/users/{user_id}", headers=admin_headers
        )
        assert fetched_response.status_code == 200
        assert fetched_response.json["email"] == "teste@rkm.com.br"

        updated_response = auth_client.patch(
            f"/admin/users/{user_id}",
            headers=admin_headers,
            json={"name": "Usuário Atualizado", "role": "mechanic"},
        )
        assert updated_response.status_code == 200
        assert updated_response.json["name"] == "Usuário Atualizado"

        active_delete_response = auth_client.delete(
            f"/admin/users/{user_id}/permanent", headers=admin_headers
        )
        assert active_delete_response.status_code == 409

        deactivated_response = auth_client.delete(
            f"/admin/users/{user_id}", headers=admin_headers
        )
        assert deactivated_response.status_code == 200
        assert deactivated_response.json["active"] is False

        deleted_response = auth_client.delete(
            f"/admin/users/{user_id}/permanent", headers=admin_headers
        )
        assert deleted_response.status_code == 204

        with app.app_context():
            database = session()
            try:
                assert database.get(User, user_id) is None
                assert database.scalar(
                    select(AuthSession).where(AuthSession.user_id == user_id)
                ) is None
            finally:
                database.close()

        deleted_session_response = auth_client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {created_access_token}"},
        )
        assert deleted_session_response.status_code == 401

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

    with subtests.test(msg="1.7 os quatro papéis devem expor permissões e labels do Go"):
        assert ROLE_LABELS == {
            "admin": "Admin",
            "mechanic": "Mecânico",
            "pcp": "PCP",
            "commercial": "Comercial",
        }
        assert ROLE_PERMISSIONS == {
            "admin": ["*"],
            "mechanic": [
                "service.view_assigned",
                "service.edit_assigned",
                "authorization.request",
                "dashboard.mybench",
            ],
            "pcp": [
                "service.view_status",
                "service.close_administrative",
                "dashboard.pcp",
                "clients.view",
                "clients.manage",
            ],
            "commercial": ["dashboard.view"],
        }

    with subtests.test(msg="1.8 token Bearer inválido deve ser rejeitado"):
        response = auth_client.get(
            "/auth/me", headers={"Authorization": "Bearer invalid-token"}
        )
        assert response.status_code == 401

    with subtests.test(msg="1.9 usuário desativado não deve conseguir fazer login"):
        admin_response = login(auth_client, "admin@rkm.com.br")
        user_response = auth_client.post(
            "/admin/users",
            headers={"Authorization": f"Bearer {admin_response.json['accessToken']}"},
            json={
                "name": "Desativado",
                "email": "desativado@rkm.com.br",
                "role": "mechanic",
                "password": "Senha@123",
            },
        )
        user_id = user_response.json["id"]
        auth_client.delete(
            f"/admin/users/{user_id}",
            headers={"Authorization": f"Bearer {admin_response.json['accessToken']}"},
        )
        response = login(auth_client, "desativado@rkm.com.br", "Senha@123")
        assert response.status_code == 401

    with subtests.test(msg="1.10 credenciais de desenvolvimento devem sumir em produção"):
        production_app = create_app(
            {"APP_ENV": "production", "AUTH_JWT_SECRET": "production-secret"}
        )
        response = production_app.test_client().get("/auth/dev-credentials")
        assert response.status_code == 404

    with subtests.test(msg="1.11 segredo JWT deve ser obrigatório em produção"):
        with pytest.raises(RuntimeError, match="AUTH_JWT_SECRET"):
            create_app({"APP_ENV": "production", "AUTH_JWT_SECRET": ""})

    with subtests.test(msg="1.12 métodos HTTP inválidos devem seguir contrato do Go"):
        response = auth_client.get("/auth/login")
        assert response.status_code == 405
        assert response.json == {"error": "method_not_allowed"}

