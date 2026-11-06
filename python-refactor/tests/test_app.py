from app import app


app.config.update(TESTING=True)


def client():
    return app.test_client()


def test_health_returns_ok_and_request_id():
    response = client().get("/health")

    assert response.status_code == 200
    assert response.json["status"] == "ok"
    assert response.headers["X-Request-ID"]


def test_request_id_is_propagated():
    response = client().get(
        "/api/health", headers={"X-Request-ID": "test-request"}
    )

    assert response.headers["X-Request-ID"] == "test-request"


def test_cors_header_is_present_for_frontend_origin():
    response = client().get(
        "/health", headers={"Origin": "http://localhost:5173"}
    )

    assert response.headers["Access-Control-Allow-Origin"] == "http://localhost:5173"


def test_unknown_route_uses_json_error_contract():
    response = client().get("/does-not-exist")

    assert response.status_code == 404
    assert response.json["error"]["code"] == 404
    assert response.json["request_id"]

