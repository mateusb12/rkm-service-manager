package devmetrics

import (
	"encoding/json"
	"math"
	"strings"
)

type FeatureMetric struct {
	FeatureID       string  `json:"featureId" gorm:"column:feature_id;primaryKey;size:160"`
	Branch          string  `json:"branch" gorm:"column:branch;size:200;not null"`
	WakaTimeSeconds float64 `json:"wakatimeSeconds" gorm:"column:wakatime_seconds;not null"`
	ChatGPTSeconds  float64 `json:"chatGptSeconds" gorm:"column:chatgpt_seconds;not null"`
	EditorsJSON     string  `json:"-" gorm:"column:editors_json;type:text;not null"`
	Locked          bool    `json:"locked" gorm:"column:locked;not null"`
	CompletedAt     int64   `json:"completedAt" gorm:"column:completed_at;not null"`
	UpdatedAt       int64   `json:"updatedAt" gorm:"column:updated_at;not null"`
}

func (FeatureMetric) TableName() string {
	return "feature_metrics"
}

type EditorTime struct {
	Name         string  `json:"name"`
	TotalSeconds float64 `json:"totalSeconds"`
}

type freezeInput struct {
	FeatureID       string       `json:"featureId"`
	Branch          string       `json:"branch"`
	WakaTimeSeconds float64      `json:"wakatimeSeconds"`
	ChatGPTSeconds  float64      `json:"chatGptSeconds"`
	Editors         []EditorTime `json:"editors"`
}

type unlockInput struct {
	FeatureID string `json:"featureId"`
}

type featureMetricResponse struct {
	FeatureID       string       `json:"featureId"`
	Branch          string       `json:"branch"`
	WakaTimeSeconds float64      `json:"wakatimeSeconds"`
	ChatGPTSeconds  float64      `json:"chatGptSeconds"`
	Editors         []EditorTime `json:"editors"`
	Locked          bool         `json:"locked"`
	CompletedAt     int64        `json:"completedAt"`
	UpdatedAt       int64        `json:"updatedAt"`
}

func (input freezeInput) valid() bool {
	featureID := strings.TrimSpace(input.FeatureID)
	branch := strings.TrimSpace(input.Branch)

	if featureID == "" ||
		len(featureID) > 160 ||
		branch == "" ||
		len(branch) > 200 {
		return false
	}

	if invalidSeconds(input.WakaTimeSeconds) ||
		invalidSeconds(input.ChatGPTSeconds) {
		return false
	}

	for _, editor := range input.Editors {
		if strings.TrimSpace(editor.Name) == "" ||
			len(editor.Name) > 120 ||
			invalidSeconds(editor.TotalSeconds) {
			return false
		}
	}

	return true
}

func invalidSeconds(value float64) bool {
	return value < 0 ||
		math.IsNaN(value) ||
		math.IsInf(value, 0)
}

func responseFromMetric(
	metric FeatureMetric,
) (featureMetricResponse, error) {
	editors := make([]EditorTime, 0)

	if strings.TrimSpace(metric.EditorsJSON) != "" {
		decodeError := json.Unmarshal(
			[]byte(metric.EditorsJSON),
			&editors,
		)

		if decodeError != nil {
			return featureMetricResponse{}, decodeError
		}
	}

	return featureMetricResponse{
		FeatureID:       metric.FeatureID,
		Branch:          metric.Branch,
		WakaTimeSeconds: metric.WakaTimeSeconds,
		ChatGPTSeconds:  metric.ChatGPTSeconds,
		Editors:         editors,
		Locked:          metric.Locked,
		CompletedAt:     metric.CompletedAt,
		UpdatedAt:       metric.UpdatedAt,
	}, nil
}
