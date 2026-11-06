package httpx

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestFrontendHandlerCacheControl(test *testing.T) {
	root := test.TempDir()

	files := map[string]string{
		"index.html":               "<html>current version</html>",
		"rkm-hidraulica-icon.png":  "icon",
		"assets/index-A1b2C3d4.js": "console.log('current')",
	}

	for fileName, contents := range files {
		filePath := filepath.Join(root, fileName)

		if mkdirError := os.MkdirAll(filepath.Dir(filePath), 0755); mkdirError != nil {
			test.Fatal(mkdirError)
		}

		if writeError := os.WriteFile(filePath, []byte(contents), 0644); writeError != nil {
			test.Fatal(writeError)
		}
	}

	cases := []struct {
		name          string
		urlPath       string
		expectedCache string
	}{
		{"initial-html", "/", "no-cache, must-revalidate"},
		{"spa-route", "/pcp/clientes", "no-cache, must-revalidate"},
		{"public-icon", "/rkm-hidraulica-icon.png", "no-cache, must-revalidate"},
		{"vite-assets", "/assets/index-A1b2C3d4.js", "public, max-age=31536000, immutable"},
		{"missing-asset-fallback", "/assets/missing.js", "no-cache, must-revalidate"},
	}

	for _, testCase := range cases {
		test.Run(testCase.name, func(test *testing.T) {
			response := httptest.NewRecorder()
			request := httptest.NewRequest(http.MethodGet, testCase.urlPath, nil)

			FrontendHandler(root).ServeHTTP(response, request)

			if response.Code != http.StatusOK {
				test.Fatalf("%s: HTTP %d", testCase.urlPath, response.Code)
			}

			actualCache := response.Header().Get("Cache-Control")

			if actualCache != testCase.expectedCache {
				test.Errorf(
					"%s: Cache-Control = %q, expected %q",
					testCase.urlPath,
					actualCache,
					testCase.expectedCache,
				)
			}
		})
	}
}
