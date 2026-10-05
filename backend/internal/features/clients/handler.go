package clients

import (
	"encoding/json"
	"errors"
	"net/http"
	"rkm-service-manager/backend/internal/shared/httpx"
	"strconv"
)

func (module *Module) handleList(
	writer http.ResponseWriter,
	request *http.Request,
) {
	clients, queryError := module.listClients(
		request.URL.Query().Get("search"),
	)

	if queryError != nil {
		httpx.WriteJSON(
			writer,
			http.StatusInternalServerError,
			map[string]string{
				"error": "clients_query_failed",
			},
		)
		return
	}

	httpx.WriteJSON(
		writer,
		http.StatusOK,
		clients,
	)
}

func (module *Module) handleGet(
	writer http.ResponseWriter,
	request *http.Request,
) {
	clientID, valid := clientIDFromRequest(request)
	if !valid {
		writeInvalidClientID(writer)
		return
	}

	client, findError := module.findClient(clientID)

	if errors.Is(
		findError,
		clientNotFoundError,
	) {
		httpx.WriteJSON(
			writer,
			http.StatusNotFound,
			map[string]string{
				"error": "client_not_found",
			},
		)
		return
	}

	if findError != nil {
		httpx.WriteJSON(
			writer,
			http.StatusInternalServerError,
			map[string]string{
				"error": "client_query_failed",
			},
		)
		return
	}

	httpx.WriteJSON(
		writer,
		http.StatusOK,
		client,
	)
}

func (module *Module) handleCreate(
	writer http.ResponseWriter,
	request *http.Request,
) {
	input, valid := decodeClientInput(
		writer,
		request,
	)

	if !valid {
		return
	}

	client, createError := module.createClient(input)

	if errors.Is(
		createError,
		duplicateCNPJError,
	) {
		httpx.WriteJSON(
			writer,
			http.StatusConflict,
			map[string]string{
				"error": "cnpj_already_exists",
			},
		)
		return
	}

	if createError != nil {
		httpx.WriteJSON(
			writer,
			http.StatusInternalServerError,
			map[string]string{
				"error": "client_creation_failed",
			},
		)
		return
	}

	httpx.WriteJSON(
		writer,
		http.StatusCreated,
		client,
	)
}

func (module *Module) handleUpdate(
	writer http.ResponseWriter,
	request *http.Request,
) {
	clientID, validID := clientIDFromRequest(request)
	if !validID {
		writeInvalidClientID(writer)
		return
	}

	input, validInput := decodeClientInput(
		writer,
		request,
	)

	if !validInput {
		return
	}

	client, updateError := module.updateClient(
		clientID,
		input,
	)

	switch {
	case errors.Is(
		updateError,
		clientNotFoundError,
	):
		httpx.WriteJSON(
			writer,
			http.StatusNotFound,
			map[string]string{
				"error": "client_not_found",
			},
		)

	case errors.Is(
		updateError,
		duplicateCNPJError,
	):
		httpx.WriteJSON(
			writer,
			http.StatusConflict,
			map[string]string{
				"error": "cnpj_already_exists",
			},
		)

	case updateError != nil:
		httpx.WriteJSON(
			writer,
			http.StatusInternalServerError,
			map[string]string{
				"error": "client_update_failed",
			},
		)

	default:
		httpx.WriteJSON(
			writer,
			http.StatusOK,
			client,
		)
	}
}

func (module *Module) handleDelete(
	writer http.ResponseWriter,
	request *http.Request,
) {
	clientID, valid := clientIDFromRequest(request)
	if !valid {
		writeInvalidClientID(writer)
		return
	}

	deleteError := module.deleteClient(clientID)

	if errors.Is(
		deleteError,
		clientNotFoundError,
	) {
		httpx.WriteJSON(
			writer,
			http.StatusNotFound,
			map[string]string{
				"error": "client_not_found",
			},
		)
		return
	}

	if deleteError != nil {
		httpx.WriteJSON(
			writer,
			http.StatusInternalServerError,
			map[string]string{
				"error": "client_deletion_failed",
			},
		)
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func decodeClientInput(
	writer http.ResponseWriter,
	request *http.Request,
) (clientInput, bool) {
	var input clientInput

	decoder := json.NewDecoder(request.Body)
	decoder.DisallowUnknownFields()

	decodeError := decoder.Decode(&input)
	if decodeError != nil {
		httpx.WriteJSON(
			writer,
			http.StatusBadRequest,
			map[string]string{
				"error": "invalid_json",
			},
		)
		return clientInput{}, false
	}

	normalized, validationErrors :=
		normalizeClientInput(input)

	if len(validationErrors) > 0 {
		httpx.WriteJSON(
			writer,
			http.StatusBadRequest,
			map[string]any{
				"error":  "validation_failed",
				"fields": validationErrors,
			},
		)
		return clientInput{}, false
	}

	return normalized, true
}

func clientIDFromRequest(
	request *http.Request,
) (uint64, bool) {
	clientID, parseError := strconv.ParseUint(
		request.PathValue("id"),
		10,
		64,
	)

	return clientID, parseError == nil && clientID > 0
}

func writeInvalidClientID(
	writer http.ResponseWriter,
) {
	httpx.WriteJSON(
		writer,
		http.StatusBadRequest,
		map[string]string{
			"error": "invalid_client_id",
		},
	)
}
