package main

import (
	"database/sql"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"
)

func TestFrontendHandlerDoesNotServeAppForAPIBase(test *testing.T) {
	db, databaseOpenError := sql.Open("sqlite", filepath.Join(test.TempDir(), "test.db"))
	if databaseOpenError != nil {
		test.Fatal(databaseOpenError)
	}
	defer db.Close()

	handler, handlerInitError := newHandler(db)
	if handlerInitError != nil {
		test.Fatal(handlerInitError)
	}

	req := httptest.NewRequest(http.MethodGet, "/api", nil)
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, req)

	if res.Code != http.StatusOK ||
		!strings.Contains(res.Body.String(), `"service":"rkm-service-manager"`) {
		test.Fatalf(
			"/api must return API JSON, got %d %q",
			res.Code,
			res.Body.String(),
		)
	}
}
