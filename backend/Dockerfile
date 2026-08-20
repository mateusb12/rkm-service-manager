FROM node:22-alpine AS frontend

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM golang:1.25-alpine AS build

WORKDIR /src
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN go build -trimpath -ldflags="-s -w" -o /out/rkm-service-manager-api .

FROM alpine:3.22

WORKDIR /app
COPY --from=build /out/rkm-service-manager-api ./rkm-service-manager-api
COPY --from=frontend /frontend/dist ./public

EXPOSE 8787
CMD ["./rkm-service-manager-api"]
