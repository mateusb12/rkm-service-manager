package main

import (
	"errors"
	"log"
	"net/http"
	"rkm-service-manager/backend/internal/features/auth"
	"rkm-service-manager/backend/internal/features/clients"
	"rkm-service-manager/backend/internal/features/devmetrics"
	"rkm-service-manager/backend/internal/shared/config"
	"rkm-service-manager/backend/internal/shared/database"
	"rkm-service-manager/backend/internal/shared/httpx"

	"gorm.io/gorm"
)

func newHandler(
	databaseConnection *gorm.DB,
	devMetricsDatabase *gorm.DB,
) (http.Handler, error) {
	authModule, authInitError := auth.New(databaseConnection)
	if authInitError != nil {
		return nil, authInitError
	}

	clientsModule, clientsInitError := clients.New(
		databaseConnection,
		authModule,
	)
	if clientsInitError != nil {
		return nil, clientsInitError
	}

	var devMetricsModule *devmetrics.Module

	if devMetricsDatabase != nil {
		initializedDevMetricsModule, devMetricsInitError :=
			devmetrics.New(
				devMetricsDatabase,
				authModule,
			)

		if devMetricsInitError != nil {
			return nil, devMetricsInitError
		}

		devMetricsModule = initializedDevMetricsModule
	}

	mux := http.NewServeMux()

	mux.HandleFunc("/health", httpx.Health)
	mux.HandleFunc("/api", httpx.API)
	mux.HandleFunc("/api/health", httpx.Health)

	authModule.Register(mux)
	clientsModule.Register(mux)

	if devMetricsModule != nil {
		devMetricsModule.Register(mux)
	}

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

	var devMetricsDatabase *gorm.DB

	if config.Env("APP_ENV", "development") == "development" {
		devMetricsConnection, devMetricsOpenError :=
			database.OpenPath(
				config.Env(
					"DEV_METRICS_DB_PATH",
					"backend/rkm-dev.db",
				),
			)

		if devMetricsOpenError != nil {
			log.Fatal(devMetricsOpenError)
		}

		devMetricsSQLDatabase, devMetricsPoolError :=
			devMetricsConnection.DB()

		if devMetricsPoolError != nil {
			log.Fatal(devMetricsPoolError)
		}

		defer devMetricsSQLDatabase.Close()

		devMetricsDatabase = devMetricsConnection
	}

	handler, handlerInitError := newHandler(
		databaseConnection,
		devMetricsDatabase,
	)
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
