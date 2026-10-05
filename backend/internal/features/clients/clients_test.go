package clients

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"rkm-service-manager/backend/internal/shared/database"
	"strconv"
	"strings"
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
				"clients.db",
			),
		)

	if databaseOpenError != nil {
		test.Fatal(databaseOpenError)
	}

	sqlDatabase, poolError :=
		databaseConnection.DB()

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

func performRequest(
	module *Module,
	method string,
	path string,
	body string,
) *httptest.ResponseRecorder {
	mux := http.NewServeMux()
	module.Register(mux)

	request := httptest.NewRequest(
		method,
		path,
		strings.NewReader(body),
	)

	if body != "" {
		request.Header.Set(
			"Content-Type",
			"application/json",
		)
	}

	recorder := httptest.NewRecorder()

	mux.ServeHTTP(
		recorder,
		request,
	)

	return recorder
}

func decodeClientResponse(
	test *testing.T,
	recorder *httptest.ResponseRecorder,
) Client {
	test.Helper()

	var client Client

	decodeError := json.NewDecoder(
		recorder.Body,
	).Decode(&client)

	if decodeError != nil {
		test.Fatal(decodeError)
	}

	return client
}

func TestClientCRUD(
	test *testing.T,
) {
	module := newTestModule(test)

	create := performRequest(
		module,
		http.MethodPost,
		"/api/clients",
		`{
			"cnpj":"10.203.040/0001-50",
			"razaoSocial":"Metalúrgica Atlântico Ltda.",
			"nomeFantasia":"Metal Atlântico"
		}`,
	)

	if create.Code != http.StatusCreated {
		test.Fatalf(
			"create expected 201, got %d: %s",
			create.Code,
			create.Body.String(),
		)
	}

	createdClient := decodeClientResponse(
		test,
		create,
	)

	if createdClient.ID == 0 {
		test.Fatal("client id was not generated")
	}

	if createdClient.CNPJ != "10203040000150" {
		test.Fatalf(
			"cnpj was not normalized: %q",
			createdClient.CNPJ,
		)
	}

	list := performRequest(
		module,
		http.MethodGet,
		"/api/clients",
		"",
	)

	if list.Code != http.StatusOK {
		test.Fatalf(
			"list expected 200, got %d",
			list.Code,
		)
	}

	var clients []Client

	listDecodeError := json.NewDecoder(
		list.Body,
	).Decode(&clients)

	if listDecodeError != nil {
		test.Fatal(listDecodeError)
	}

	if len(clients) != 1 {
		test.Fatalf(
			"expected 1 client, got %d",
			len(clients),
		)
	}

	search := performRequest(
		module,
		http.MethodGet,
		"/api/clients?search=atlantico",
		"",
	)

	var searchResults []Client

	searchDecodeError := json.NewDecoder(
		search.Body,
	).Decode(&searchResults)

	if searchDecodeError != nil {
		test.Fatal(searchDecodeError)
	}

	if len(searchResults) != 1 {
		test.Fatalf(
			"accent-insensitive search expected 1 result, got %d",
			len(searchResults),
		)
	}

	updatePath := "/api/clients/" +
		strconv.FormatUint(createdClient.ID, 10)

	update := performRequest(
		module,
		http.MethodPut,
		updatePath,
		`{
			"cnpj":"10.203.040/0001-50",
			"razaoSocial":"Metalúrgica Atlântico S.A.",
			"nomeFantasia":"Atlântico Industrial"
		}`,
	)

	if update.Code != http.StatusOK {
		test.Fatalf(
			"update expected 200, got %d: %s",
			update.Code,
			update.Body.String(),
		)
	}

	updatedClient := decodeClientResponse(
		test,
		update,
	)

	if updatedClient.NomeFantasia !=
		"Atlântico Industrial" {
		test.Fatalf(
			"unexpected updated name: %q",
			updatedClient.NomeFantasia,
		)
	}

	get := performRequest(
		module,
		http.MethodGet,
		updatePath,
		"",
	)

	if get.Code != http.StatusOK {
		test.Fatalf(
			"get expected 200, got %d",
			get.Code,
		)
	}

	deleteResponse := performRequest(
		module,
		http.MethodDelete,
		updatePath,
		"",
	)

	if deleteResponse.Code != http.StatusNoContent {
		test.Fatalf(
			"delete expected 204, got %d",
			deleteResponse.Code,
		)
	}

	missing := performRequest(
		module,
		http.MethodGet,
		updatePath,
		"",
	)

	if missing.Code != http.StatusNotFound {
		test.Fatalf(
			"missing client expected 404, got %d",
			missing.Code,
		)
	}
}

func TestClientValidationAndDuplicateCNPJ(
	test *testing.T,
) {
	module := newTestModule(test)

	invalid := performRequest(
		module,
		http.MethodPost,
		"/api/clients",
		`{
			"cnpj":"123",
			"razaoSocial":"",
			"nomeFantasia":""
		}`,
	)

	if invalid.Code != http.StatusBadRequest {
		test.Fatalf(
			"invalid client expected 400, got %d",
			invalid.Code,
		)
	}

	first := performRequest(
		module,
		http.MethodPost,
		"/api/clients",
		`{
			"cnpj":"10.203.040/0001-50",
			"razaoSocial":"Empresa Um",
			"nomeFantasia":"Empresa Um"
		}`,
	)

	if first.Code != http.StatusCreated {
		test.Fatalf(
			"first create expected 201, got %d",
			first.Code,
		)
	}

	duplicate := performRequest(
		module,
		http.MethodPost,
		"/api/clients",
		`{
			"cnpj":"10203040000150",
			"razaoSocial":"Empresa Dois",
			"nomeFantasia":"Empresa Dois"
		}`,
	)

	if duplicate.Code != http.StatusConflict {
		test.Fatalf(
			"duplicate expected 409, got %d: %s",
			duplicate.Code,
			duplicate.Body.String(),
		)
	}
}

func TestClientRejectsCNPJWithNonFormattingCharacters(
	test *testing.T,
) {
	module := newTestModule(test)

	response := performRequest(
		module,
		http.MethodPost,
		"/api/clients",
		`{
			"cnpj":"abc10.203.040/0001-50xyz",
			"razaoSocial":"Empresa Inválida Ltda.",
			"nomeFantasia":"Empresa Inválida"
		}`,
	)

	if response.Code != http.StatusBadRequest {
		test.Fatalf(
			"cnpj with invalid characters expected 400, got %d: %s",
			response.Code,
			response.Body.String(),
		)
	}
}
