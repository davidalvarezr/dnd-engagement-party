package client

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestListInvitationsSendsAPIKeyAndParsesResponse(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get("X-Api-Key"); got != "secret" {
			t.Errorf("X-Api-Key header = %q, want %q", got, "secret")
		}
		if r.Method != http.MethodGet || r.URL.Path != "/api/admin/invitations" {
			t.Errorf("request = %s %s, want GET /api/admin/invitations", r.Method, r.URL.Path)
		}
		_ = json.NewEncoder(w).Encode([]Invitation{{ID: 1, Code: "abc"}})
	}))
	defer server.Close()

	c := New(server.URL, "secret")
	invitations, err := c.ListInvitations(context.Background())
	if err != nil {
		t.Fatalf("ListInvitations() error = %v", err)
	}
	if len(invitations) != 1 || invitations[0].Code != "abc" {
		t.Fatalf("ListInvitations() = %+v, want one invitation with code abc", invitations)
	}
}

func TestDoReturnsAPIErrorOnNon2xx(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "name is required"})
	}))
	defer server.Close()

	c := New(server.URL, "secret")
	_, err := c.CreateInvitee(context.Background(), "")

	var apiErr *APIError
	if !errors.As(err, &apiErr) {
		t.Fatalf("CreateInvitee() error = %v, want *APIError", err)
	}
	if apiErr.StatusCode != http.StatusBadRequest || apiErr.Message != "name is required" {
		t.Fatalf("APIError = %+v, want status 400 with message %q", apiErr, "name is required")
	}
}

func TestLinkGuestsOmitsKeepAnswersFromWhenEmpty(t *testing.T) {
	var body map[string]any
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewDecoder(r.Body).Decode(&body)
		_ = json.NewEncoder(w).Encode(Invitation{ID: 1})
	}))
	defer server.Close()

	c := New(server.URL, "secret")
	if _, err := c.LinkGuests(context.Background(), 1, 2, ""); err != nil {
		t.Fatalf("LinkGuests() error = %v", err)
	}

	if _, ok := body["keepAnswersFrom"]; ok {
		t.Errorf("request body = %+v, want no keepAnswersFrom key", body)
	}
}
