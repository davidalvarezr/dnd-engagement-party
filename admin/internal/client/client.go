// Package client is a thin HTTP client for the main app's /api/admin/*
// endpoints, authenticated with a shared API key.
package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type Client struct {
	baseURL string
	apiKey  string
	http    *http.Client
}

func New(baseURL, apiKey string) *Client {
	return &Client{baseURL: baseURL, apiKey: apiKey, http: &http.Client{}}
}

// APIError is returned when the main app responds with a non-2xx status.
// Message is the {"error": "..."} body it returned, when present.
type APIError struct {
	StatusCode int
	Message    string
}

func (e *APIError) Error() string {
	if e.Message != "" {
		return e.Message
	}
	return fmt.Sprintf("admin API request failed with status %d", e.StatusCode)
}

func (c *Client) do(ctx context.Context, method, path string, body any, out any) error {
	var reqBody io.Reader
	if body != nil {
		encoded, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("encoding request body: %w", err)
		}
		reqBody = bytes.NewReader(encoded)
	}

	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, reqBody)
	if err != nil {
		return fmt.Errorf("building request: %w", err)
	}
	req.Header.Set("X-Api-Key", c.apiKey)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("calling admin API: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("reading response body: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var errBody struct {
			Error string `json:"error"`
		}
		_ = json.Unmarshal(respBody, &errBody)
		return &APIError{StatusCode: resp.StatusCode, Message: errBody.Error}
	}

	if out != nil && len(respBody) > 0 {
		if err := json.Unmarshal(respBody, out); err != nil {
			return fmt.Errorf("decoding response body: %w", err)
		}
	}

	return nil
}

func (c *Client) ListInvitations(ctx context.Context) ([]Invitation, error) {
	var invitations []Invitation
	if err := c.do(ctx, http.MethodGet, "/api/admin/invitations", nil, &invitations); err != nil {
		return nil, err
	}
	return invitations, nil
}

func (c *Client) CreateInvitee(ctx context.Context, name string) (*Invitation, error) {
	var invitation Invitation
	body := map[string]string{"name": name}
	if err := c.do(ctx, http.MethodPost, "/api/admin/invitations", body, &invitation); err != nil {
		return nil, err
	}
	return &invitation, nil
}

func (c *Client) DeleteInvitation(ctx context.Context, id int) error {
	return c.do(ctx, http.MethodDelete, fmt.Sprintf("/api/admin/invitations/%d", id), nil, nil)
}

func (c *Client) DeleteGuest(ctx context.Context, id int) error {
	return c.do(ctx, http.MethodDelete, fmt.Sprintf("/api/admin/guests/%d", id), nil, nil)
}

// LinkGuests pairs two unpaired singles into a couple. keepAnswersFrom
// should be "A", "B", or "" (only valid when at most one has responded).
func (c *Client) LinkGuests(ctx context.Context, guestIDA, guestIDB int, keepAnswersFrom string) (*Invitation, error) {
	var invitation Invitation
	body := map[string]any{
		"guestIdA": guestIDA,
		"guestIdB": guestIDB,
	}
	if keepAnswersFrom != "" {
		body["keepAnswersFrom"] = keepAnswersFrom
	}
	if err := c.do(ctx, http.MethodPost, "/api/admin/guests/link", body, &invitation); err != nil {
		return nil, err
	}
	return &invitation, nil
}

// ResetData clears every RSVP (attendance, activity sign-ups, boat info)
// across all invitations, leaving the invitee list and pairings intact.
// confirm must match the main app's confirmation phrase exactly.
func (c *Client) ResetData(ctx context.Context, confirm string) error {
	body := map[string]string{"confirm": confirm}
	return c.do(ctx, http.MethodPost, "/api/admin/reset", body, nil)
}

// ImportInvitees posts a batch of CSV rows for classification. When dryRun
// is true nothing is written; the returned report is a preview. When false,
// rows classified as "create" are applied, but only if every row is
// error-free (checked by the endpoint itself).
func (c *Client) ImportInvitees(ctx context.Context, rows []ImportRow, dryRun bool) (*ImportReport, error) {
	var report ImportReport
	body := map[string]any{
		"dryRun": dryRun,
		"rows":   rows,
	}
	if err := c.do(ctx, http.MethodPost, "/api/admin/invitations/import", body, &report); err != nil {
		return nil, err
	}
	return &report, nil
}

func (c *Client) Stats(ctx context.Context) (*Stats, error) {
	var stats Stats
	if err := c.do(ctx, http.MethodGet, "/api/admin/stats", nil, &stats); err != nil {
		return nil, err
	}
	return &stats, nil
}
