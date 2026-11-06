FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev

COPY backend/ ./

EXPOSE 8787

CMD ["uv", "run", "--no-sync", "flask", "--app", "app:app", "run", "--host=0.0.0.0", "--port=8787"]
