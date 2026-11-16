FROM node:22-alpine AS frontend-build

WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
ARG VITE_COMMIT_SHA=unknown
RUN VITE_COMMIT_SHA="$VITE_COMMIT_SHA" npm run build

FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev

COPY backend/ ./
COPY --from=frontend-build /frontend/dist ./public

EXPOSE 8787

CMD ["uv", "run", "--no-sync", "flask", "--app", "app:app", "run", "--host=0.0.0.0", "--port=8787"]
