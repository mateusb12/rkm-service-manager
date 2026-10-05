package devmetrics

import (
	"encoding/json"
	"errors"
	"net/http"
	"rkm-service-manager/backend/internal/shared/httpx"
	"strings"
)

const maxRequestBodyBytes = 64 * 1024

func (module *Module) handleList(
	writer http.ResponseWriter,
	request *http.Request,
) {
	featureID := strings.TrimSpace(
		request.URL.Query().Get("feature"),
	)

	if featureID != "" {
		metric, findError := module.findFeatureMetric(featureID)

		if errors.Is(
			findError,
			featureMetricNotFoundError,
		) {
			httpx.WriteJSON(
				writer,
				http.StatusNotFound,
				map[string]string{
					"error": "feature_metric_not_found",
				},
			)
			return
		}

		if findError != nil {
			writeQueryFailure(writer)
			return
		}

		response, responseError := responseFromMetric(metric)
		if responseError != nil {
			writeQueryFailure(writer)
			return
		}

		httpx.WriteJSON(
			writer,
			http.StatusOK,
			response,
		)
		return
	}

	metrics, queryError := module.listFeatureMetrics()
	if queryError != nil {
		writeQueryFailure(writer)
		return
	}

	responses := make(
		[]featureMetricResponse,
		0,
		len(metrics),
	)

	for _, metric := range metrics {
		response, responseError := responseFromMetric(metric)
		if responseError != nil {
			writeQueryFailure(writer)
			return
		}

		responses = append(responses, response)
	}

	httpx.WriteJSON(
		writer,
		http.StatusOK,
		responses,
	)
}

func (module *Module) handleFreeze(
	writer http.ResponseWriter,
	request *http.Request,
) {
	input, valid := decodeFreezeInput(
		writer,
		request,
	)

	if !valid {
		return
	}

	metric, freezeError := module.freezeFeatureMetric(input)
	if freezeError != nil {
		httpx.WriteJSON(
			writer,
			http.StatusInternalServerError,
			map[string]string{
				"error": "feature_metric_freeze_failed",
			},
		)
		return
	}

	response, responseError := responseFromMetric(metric)
	if responseError != nil {
		httpx.WriteJSON(
			writer,
			http.StatusInternalServerError,
			map[string]string{
				"error": "feature_metric_response_failed",
			},
		)
		return
	}

	httpx.WriteJSON(
		writer,
		http.StatusOK,
		response,
	)
}

func (module *Module) handleUnlock(
	writer http.ResponseWriter,
	request *http.Request,
) {
	input, valid := decodeUnlockInput(
		writer,
		request,
	)

	if !valid {
		return
	}

	metric, unlockError := module.unlockFeatureMetric(
		input.FeatureID,
	)

	if errors.Is(
		unlockError,
		featureMetricNotFoundError,
	) {
		httpx.WriteJSON(
			writer,
			http.StatusNotFound,
			map[string]string{
				"error": "feature_metric_not_found",
			},
		)
		return
	}

	if unlockError != nil {
		httpx.WriteJSON(
			writer,
			http.StatusInternalServerError,
			map[string]string{
				"error": "feature_metric_unlock_failed",
			},
		)
		return
	}

	response, responseError := responseFromMetric(metric)
	if responseError != nil {
		httpx.WriteJSON(
			writer,
			http.StatusInternalServerError,
			map[string]string{
				"error": "feature_metric_response_failed",
			},
		)
		return
	}

	httpx.WriteJSON(
		writer,
		http.StatusOK,
		response,
	)
}

func decodeFreezeInput(
	writer http.ResponseWriter,
	request *http.Request,
) (freezeInput, bool) {
	input := freezeInput{}

	request.Body = http.MaxBytesReader(
		writer,
		request.Body,
		maxRequestBodyBytes,
	)

	decoder := json.NewDecoder(request.Body)
	decoder.DisallowUnknownFields()

	decodeError := decoder.Decode(&input)

	if decodeError != nil || !input.valid() {
		writeValidationFailure(writer)
		return freezeInput{}, false
	}

	return input, true
}

func decodeUnlockInput(
	writer http.ResponseWriter,
	request *http.Request,
) (unlockInput, bool) {
	input := unlockInput{}

	request.Body = http.MaxBytesReader(
		writer,
		request.Body,
		maxRequestBodyBytes,
	)

	decoder := json.NewDecoder(request.Body)
	decoder.DisallowUnknownFields()

	decodeError := decoder.Decode(&input)

	input.FeatureID = strings.TrimSpace(input.FeatureID)

	if decodeError != nil ||
		input.FeatureID == "" ||
		len(input.FeatureID) > 160 {
		writeValidationFailure(writer)
		return unlockInput{}, false
	}

	return input, true
}

func writeValidationFailure(
	writer http.ResponseWriter,
) {
	httpx.WriteJSON(
		writer,
		http.StatusUnprocessableEntity,
		map[string]string{
			"error": "validation_failed",
		},
	)
}

func writeQueryFailure(
	writer http.ResponseWriter,
) {
	httpx.WriteJSON(
		writer,
		http.StatusInternalServerError,
		map[string]string{
			"error": "feature_metrics_query_failed",
		},
	)
}
