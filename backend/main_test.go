package main

import (
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"rkm-service-manager/backend/internal/shared/database"
	"strings"
	"testing"
)

func TestFrontendHandlerDoesNotServeAppForAPIBase(
	test *testing.T,
) {
	databaseConnection, databaseOpenError := database.OpenPath(
		filepath.Join(
			test.TempDir(),
			"test.db",
		),
	)
	if databaseOpenError != nil {
		test.Fatal(databaseOpenError)
	}

	sqlDatabase, poolError := databaseConnection.DB()
	if poolError != nil {
		test.Fatal(poolError)
	}
	defer sqlDatabase.Close()

	handler, handlerInitError := newHandler(
		databaseConnection,
	)
	if handlerInitError != nil {
		test.Fatal(handlerInitError)
	}

	request := httptest.NewRequest(
		http.MethodGet,
		"/api",
		nil,
	)
	recorder := httptest.NewRecorder()

	handler.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK ||
		!strings.Contains(
			recorder.Body.String(),
			`"service":"rkm-service-manager"`,
		) {
		test.Fatalf(
			"/api must return API JSON, got %d %q",
			recorder.Code,
			recorder.Body.String(),
		)
	}
}
