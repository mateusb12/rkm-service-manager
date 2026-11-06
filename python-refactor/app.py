"""Application factory for the Python backend."""

from __future__ import annotations

import logging
import os
import time
import uuid
from typing import Any

from dotenv import load_dotenv
from flask import Flask, current_app, g, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import BadRequest, HTTPException

try:
    from .api_docs import init_api, register_api_docs
except ImportError:
    from api_docs import init_api, register_api_docs

try:
    from .auth import register_auth
    from .clients import register_clients
except ImportError:
    from auth import register_auth
    from clients import register_clients


LOGGER = logging.getLogger(__name__)


def _cors_origins() -> list[str]:
    configured_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173")
    return [origin.strip() for origin in configured_origins.split(",") if origin.strip()]


def _error_payload(message: str, status_code: int) -> tuple[Any, int]:
    return (
        jsonify(
            {
                "error": {
                    "code": status_code,
                    "message": message,
                },
                "request_id": getattr(g, "request_id", None),
            }
        ),
        status_code,
    )


def create_app(test_config: dict[str, Any] | None = None) -> Flask:
    """Create and configure the Flask application."""

    load_dotenv()

    app = Flask(__name__)
    app.config.from_mapping(
        APP_ENV=os.getenv("APP_ENV", "development"),
        CORS_ORIGINS=_cors_origins(),
        AUTH_JWT_SECRET=os.getenv("AUTH_JWT_SECRET", ""),
        DATABASE_URL=os.getenv("DATABASE_URL", ""),
        DB_PATH=os.getenv("DB_PATH", ""),
    )
    if test_config:
        app.config.update(test_config)

    CORS(app, origins=app.config["CORS_ORIGINS"])
    init_api(app)
    register_auth(app)
    register_clients(app)
    register_api_docs(app)
    return app


app = create_app()


@app.before_request
def start_request() -> None:
    g.request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    g.request_started_at = time.perf_counter()


@app.after_request
def finish_request(response):
    response.headers["X-Request-ID"] = g.request_id
    duration_ms = (time.perf_counter() - g.request_started_at) * 1000
    LOGGER.info(
        "%s %s -> %s (%.2fms) request_id=%s",
        request.method,
        request.path,
        response.status_code,
        duration_ms,
        g.request_id,
    )
    return response


@app.errorhandler(HTTPException)
def handle_http_error(error: HTTPException):
    if error.code == 405 and request.path.startswith(("/auth/", "/admin/", "/clients")):
        return jsonify({"error": "method_not_allowed"}), 405
    return _error_payload(error.description, error.code or 500)


@app.errorhandler(BadRequest)
def handle_bad_request(error: BadRequest):
    data = getattr(error, "data", {}) or {}
    messages = data.get("messages") or data.get("errors")
    if request.path.startswith("/clients") and messages:
        fields = {
            field: values[0] if isinstance(values, list) else values
            for field, values in messages.get("json", messages).items()
        }
        return jsonify({"error": "validation_failed", "fields": fields}), 400
    return handle_http_error(error)


@app.errorhandler(Exception)
def handle_unexpected_error(error: Exception):
    LOGGER.exception("Unhandled request error request_id=%s", g.request_id)
    if current_app.config["APP_ENV"] == "development":
        return _error_payload(str(error), 500)
    return _error_payload("Internal server error", 500)


@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "rkm-service-manager-python"})


@app.get("/")
def root():
    return jsonify(
        {
            "service": "rkm-service-manager-python",
            "status": "ok",
            "message": "RKM Service Manager API",
            "health": "/health",
            "swagger": "/docs/",
            "openapi": "/openapi.json",
        }
    )

