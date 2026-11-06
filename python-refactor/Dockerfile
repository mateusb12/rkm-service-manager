FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY python-refactor/pyproject.toml python-refactor/uv.lock ./
RUN uv sync --frozen --no-dev

COPY python-refactor/ ./

EXPOSE 8787

CMD ["uv", "run", "--no-sync", "flask", "--app", "app:app", "run", "--host=0.0.0.0", "--port=8787"]
