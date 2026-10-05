package devmetrics

import (
	"encoding/json"
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"
)

var featureMetricNotFoundError = errors.New(
	"feature metric not found",
)

func (module *Module) listFeatureMetrics() (
	[]FeatureMetric,
	error,
) {
	metrics := make([]FeatureMetric, 0)

	queryError := module.database.
		Order("feature_id ASC").
		Find(&metrics).
		Error

	if queryError != nil {
		return nil, queryError
	}

	return metrics, nil
}

func (module *Module) findFeatureMetric(
	featureID string,
) (FeatureMetric, error) {
	metric := FeatureMetric{}

	queryError := module.database.
		Where(
			"feature_id = ?",
			strings.TrimSpace(featureID),
		).
		First(&metric).
		Error

	if errors.Is(queryError, gorm.ErrRecordNotFound) {
		return FeatureMetric{}, featureMetricNotFoundError
	}

	if queryError != nil {
		return FeatureMetric{}, queryError
	}

	return metric, nil
}

func (module *Module) freezeFeatureMetric(
	input freezeInput,
) (FeatureMetric, error) {
	featureID := strings.TrimSpace(input.FeatureID)
	branch := strings.TrimSpace(input.Branch)

	editorsPayload, encodeError := json.Marshal(input.Editors)
	if encodeError != nil {
		return FeatureMetric{}, encodeError
	}

	metric, findError := module.findFeatureMetric(featureID)

	if findError != nil &&
		!errors.Is(
			findError,
			featureMetricNotFoundError,
		) {
		return FeatureMetric{}, findError
	}

	if findError == nil && metric.Locked {
		return metric, nil
	}

	timestamp := time.Now().UTC().Unix()

	if errors.Is(
		findError,
		featureMetricNotFoundError,
	) {
		metric = FeatureMetric{
			FeatureID: featureID,
		}
	}

	metric.Branch = branch
	metric.WakaTimeSeconds = input.WakaTimeSeconds
	metric.ChatGPTSeconds = input.ChatGPTSeconds
	metric.EditorsJSON = string(editorsPayload)
	metric.Locked = true
	metric.CompletedAt = timestamp
	metric.UpdatedAt = timestamp

	var saveError error

	if errors.Is(
		findError,
		featureMetricNotFoundError,
	) {
		saveError = module.database.
			Create(&metric).
			Error
	} else {
		saveError = module.database.
			Save(&metric).
			Error
	}

	if saveError != nil {
		return FeatureMetric{}, saveError
	}

	return metric, nil
}

func (module *Module) unlockFeatureMetric(
	featureID string,
) (FeatureMetric, error) {
	metric, findError := module.findFeatureMetric(featureID)
	if findError != nil {
		return FeatureMetric{}, findError
	}

	metric.Locked = false
	metric.CompletedAt = 0
	metric.UpdatedAt = time.Now().UTC().Unix()

	saveError := module.database.
		Save(&metric).
		Error

	if saveError != nil {
		return FeatureMetric{}, saveError
	}

	return metric, nil
}
