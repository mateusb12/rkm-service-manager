package main

import (
	"errors"
	"log"
	"net/http"
	"rkm-service-manager/backend/internal/features/auth"
	"rkm-service-manager/backend/internal/shared/config"
	"rkm-service-manager/backend/internal/shared/database"
	"rkm-service-manager/backend/internal/shared/httpx"

	"gorm.io/gorm"
)

func newHandler(
	databaseConnection *gorm.DB,
) (http.Handler, error) {
	authModule, authInitError := auth.New(databaseConnection)
	if authInitError != nil {
		return nil, authInitError
	}

	mux := http.NewServeMux()

	mux.HandleFunc("/health", httpx.Health)
	mux.HandleFunc("/api", httpx.API)
	mux.HandleFunc("/api/health", httpx.Health)

	authModule.Register(mux)

	mux.Handle(
		"/",
		httpx.FrontendHandler(
			config.Env("WEB_DIR", "public"),
		),
	)

	return httpx.WithCORS(mux), nil
}

func main() {
	databaseConnection, databaseOpenError := database.Open()
	if databaseOpenError != nil {
		log.Fatal(databaseOpenError)
	}

	sqlDatabase, poolError := databaseConnection.DB()
	if poolError != nil {
		log.Fatal(poolError)
	}
	defer sqlDatabase.Close()

	handler, handlerInitError := newHandler(databaseConnection)
	if handlerInitError != nil {
		log.Fatal(handlerInitError)
	}

	port := config.Env("PORT", "8787")

	server := &http.Server{
		Addr:    ":" + port,
		Handler: handler,
	}

	log.Printf(
		"RKM backend listening on :%s",
		port,
	)

	if listenError := server.ListenAndServe(); listenError != nil &&
		!errors.Is(
			listenError,
			http.ErrServerClosed,
		) {
		log.Fatal(listenError)
	}
}
