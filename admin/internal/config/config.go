// Package config loads the admin app's runtime configuration from
// environment variables.
package config

import (
	"errors"
	"os"
)

type Config struct {
	// APIKey is sent as the X-Api-Key header on every request to the main
	// app's /api/admin/* endpoints. Shared with the main app's own API_KEY.
	APIKey string
	// TargetURL is the base URL of the main app instance to manage, e.g.
	// http://localhost:3000 for local dev or the live prod URL.
	TargetURL string
	// Port is the local port this admin server listens on.
	Port string
}

func Load() (Config, error) {
	apiKey := os.Getenv("API_KEY")
	if apiKey == "" {
		return Config{}, errors.New("API_KEY is required")
	}

	targetURL := os.Getenv("TARGET_URL")
	if targetURL == "" {
		return Config{}, errors.New("TARGET_URL is required")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "4100"
	}

	return Config{APIKey: apiKey, TargetURL: targetURL, Port: port}, nil
}
