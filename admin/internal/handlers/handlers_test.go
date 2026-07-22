package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"admin/internal/client"
)

func fakeUpstream(t *testing.T, handler http.HandlerFunc) *Server {
	t.Helper()
	server := httptest.NewServer(handler)
	t.Cleanup(server.Close)
	return &Server{Client: client.New(server.URL, "secret"), TargetURL: server.URL}
}

func TestIndexRendersStatsAndInvitees(t *testing.T) {
	s := fakeUpstream(t, func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/admin/invitations":
			_ = json.NewEncoder(w).Encode([]client.Invitation{
				{ID: 1, Code: "abc", Guests: []client.Guest{{ID: 1, Name: "Alex"}}},
			})
		case "/api/admin/stats":
			_ = json.NewEncoder(w).Encode(client.Stats{})
		default:
			t.Errorf("unexpected upstream request: %s", r.URL.Path)
		}
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()

	s.Index(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if !strings.Contains(rec.Body.String(), "Alex") {
		t.Errorf("body missing invitee name, got: %s", rec.Body.String())
	}
}

func TestCreateInviteeRejectsBlankName(t *testing.T) {
	s := fakeUpstream(t, func(w http.ResponseWriter, r *http.Request) {
		t.Errorf("upstream should not be called for a blank name, got %s", r.URL.Path)
	})

	form := url.Values{"name": {"   "}}
	req := httptest.NewRequest(http.MethodPost, "/invitees", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	rec := httptest.NewRecorder()

	s.CreateInvitee(rec, req)

	if !strings.Contains(rec.Body.String(), "Name is required") {
		t.Errorf("body = %q, want a 'Name is required' message", rec.Body.String())
	}
}

func TestCreateInviteeSendsNameAndRefreshesDashboard(t *testing.T) {
	var created bool
	s := fakeUpstream(t, func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.Method == http.MethodPost && r.URL.Path == "/api/admin/invitations":
			created = true
			var body map[string]string
			_ = json.NewDecoder(r.Body).Decode(&body)
			if body["name"] != "Robin" {
				t.Errorf("posted name = %q, want Robin", body["name"])
			}
			_ = json.NewEncoder(w).Encode(client.Invitation{ID: 2, Guests: []client.Guest{{ID: 2, Name: "Robin"}}})
		case r.URL.Path == "/api/admin/invitations":
			_ = json.NewEncoder(w).Encode([]client.Invitation{})
		case r.URL.Path == "/api/admin/stats":
			_ = json.NewEncoder(w).Encode(client.Stats{})
		default:
			t.Errorf("unexpected upstream request: %s %s", r.Method, r.URL.Path)
		}
	})

	form := url.Values{"name": {"Robin"}}
	req := httptest.NewRequest(http.MethodPost, "/invitees", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	rec := httptest.NewRecorder()

	s.CreateInvitee(rec, req)

	if !created {
		t.Fatal("expected the upstream create-invitee endpoint to be called")
	}
	if !strings.Contains(rec.Body.String(), `hx-swap-oob="innerHTML:#stats-panel"`) {
		t.Errorf("body missing OOB stats refresh, got: %s", rec.Body.String())
	}
}

func TestResetDataRejectsWrongConfirmation(t *testing.T) {
	s := fakeUpstream(t, func(w http.ResponseWriter, r *http.Request) {
		t.Errorf("upstream should not be called for a wrong confirmation, got %s", r.URL.Path)
	})

	form := url.Values{"confirm": {"nope"}}
	req := httptest.NewRequest(http.MethodPost, "/reset", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	rec := httptest.NewRecorder()

	s.ResetData(rec, req)

	if !strings.Contains(rec.Body.String(), "does not match") {
		t.Errorf("body = %q, want a confirmation-mismatch message", rec.Body.String())
	}
}

func TestResetDataSendsConfirmationAndRefreshesDashboard(t *testing.T) {
	var resetCalled bool
	s := fakeUpstream(t, func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.Method == http.MethodPost && r.URL.Path == "/api/admin/reset":
			resetCalled = true
			var body map[string]string
			_ = json.NewDecoder(r.Body).Decode(&body)
			if body["confirm"] != "RESET RSVPS" {
				t.Errorf("posted confirm = %q, want RESET RSVPS", body["confirm"])
			}
			w.WriteHeader(http.StatusNoContent)
		case r.URL.Path == "/api/admin/invitations":
			_ = json.NewEncoder(w).Encode([]client.Invitation{})
		case r.URL.Path == "/api/admin/stats":
			_ = json.NewEncoder(w).Encode(client.Stats{})
		default:
			t.Errorf("unexpected upstream request: %s %s", r.Method, r.URL.Path)
		}
	})

	form := url.Values{"confirm": {"RESET RSVPS"}}
	req := httptest.NewRequest(http.MethodPost, "/reset", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	rec := httptest.NewRecorder()

	s.ResetData(rec, req)

	if !resetCalled {
		t.Fatal("expected the upstream reset endpoint to be called")
	}
	if !strings.Contains(rec.Body.String(), `hx-swap-oob="innerHTML:#stats-panel"`) {
		t.Errorf("body missing OOB stats refresh, got: %s", rec.Body.String())
	}
}

func TestLinkPreviewRejectsSameGuestTwice(t *testing.T) {
	s := fakeUpstream(t, func(w http.ResponseWriter, r *http.Request) {
		t.Errorf("upstream should not be called, got %s", r.URL.Path)
	})

	form := url.Values{"guestIdA": {"1"}, "guestIdB": {"1"}}
	req := httptest.NewRequest(http.MethodPost, "/link/preview", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	rec := httptest.NewRecorder()

	s.LinkPreview(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", rec.Code)
	}
}
