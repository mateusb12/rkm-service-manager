package config

import (
	"os"
	"time"
)

func Env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func EnvDuration(key string, fallback time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if parsed, parseError := time.ParseDuration(value); parseError == nil && parsed > 0 {
			return parsed
		}
	}
	return fallback
}
