package devmetrics

import (
	"net/http"
	"path/filepath"
	"rkm-service-manager/backend/internal/shared/database"
	"testing"
)

type testAuthorizer struct{}

func (testAuthorizer) RequirePermission(
	permission string,
	next http.HandlerFunc,
) http.HandlerFunc {
	return next
}

func (testAuthorizer) RequireCSRF(
	next http.HandlerFunc,
) http.HandlerFunc {
	return next
}

func newTestModule(
	test *testing.T,
) *Module {
	test.Helper()

	databaseConnection, databaseOpenError :=
		database.OpenPath(
			filepath.Join(
				test.TempDir(),
				"devmetrics.db",
			),
		)

	if databaseOpenError != nil {
		test.Fatal(databaseOpenError)
	}

	sqlDatabase, poolError := databaseConnection.DB()
	if poolError != nil {
		test.Fatal(poolError)
	}

	test.Cleanup(func() {
		_ = sqlDatabase.Close()
	})

	module, moduleError := New(
		databaseConnection,
		testAuthorizer{},
	)

	if moduleError != nil {
		test.Fatal(moduleError)
	}

	return module
}

func TestFeatureMetricFreezeLifecycle(
	test *testing.T,
) {
	module := newTestModule(test)

	firstInput := freezeInput{
		FeatureID:       "pcp/clientes",
		Branch:          "features/pcp/clientes",
		WakaTimeSeconds: 100,
		ChatGPTSeconds:  50,
		Editors: []EditorTime{
			{
				Name:         "WebStorm",
				TotalSeconds: 100,
			},
		},
	}

	firstMetric, freezeError :=
		module.freezeFeatureMetric(firstInput)

	if freezeError != nil {
		test.Fatal(freezeError)
	}

	if !firstMetric.Locked {
		test.Fatal("expected metric to be locked")
	}

	secondInput := firstInput
	secondInput.WakaTimeSeconds = 999

	secondMetric, secondFreezeError :=
		module.freezeFeatureMetric(secondInput)

	if secondFreezeError != nil {
		test.Fatal(secondFreezeError)
	}

	if secondMetric.WakaTimeSeconds != 100 {
		test.Fatalf(
			"locked metric changed: got %.0f",
			secondMetric.WakaTimeSeconds,
		)
	}

	unlockedMetric, unlockError :=
		module.unlockFeatureMetric("pcp/clientes")

	if unlockError != nil {
		test.Fatal(unlockError)
	}

	if unlockedMetric.Locked {
		test.Fatal("expected metric to be unlocked")
	}

	refrozenMetric, refreezeError :=
		module.freezeFeatureMetric(secondInput)

	if refreezeError != nil {
		test.Fatal(refreezeError)
	}

	if refrozenMetric.WakaTimeSeconds != 999 {
		test.Fatalf(
			"refrozen metric not updated: got %.0f",
			refrozenMetric.WakaTimeSeconds,
		)
	}

	metrics, listError := module.listFeatureMetrics()
	if listError != nil {
		test.Fatal(listError)
	}

	if len(metrics) != 1 {
		test.Fatalf(
			"expected 1 metric, got %d",
			len(metrics),
		)
	}

	response, responseError :=
		responseFromMetric(refrozenMetric)

	if responseError != nil {
		test.Fatal(responseError)
	}

	if len(response.Editors) != 1 ||
		response.Editors[0].Name != "WebStorm" {
		test.Fatal("editor breakdown was not preserved")
	}
}
