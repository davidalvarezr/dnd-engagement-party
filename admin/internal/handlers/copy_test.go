package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"admin/internal/client"
)

func TestCopyListWritesOneLinePerInvitation(t *testing.T) {
	s := fakeUpstream(t, func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/admin/invitations" {
			t.Errorf("unexpected upstream request: %s", r.URL.Path)
			return
		}
		_ = json.NewEncoder(w).Encode([]client.Invitation{
			{
				ID:   1,
				Code: "abc-123",
				Guests: []client.Guest{
					{ID: 1, Name: "Alex"},
					{ID: 2, Name: "Sam"},
				},
			},
			{
				ID:     2,
				Code:   "def-456",
				Guests: []client.Guest{{ID: 3, Name: "Robin"}},
			},
		})
	})

	req := httptest.NewRequest(http.MethodGet, "/invitees/copy", nil)
	rec := httptest.NewRecorder()

	s.CopyList(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); !strings.HasPrefix(ct, "text/plain") {
		t.Errorf("Content-Type = %q, want text/plain", ct)
	}

	wantLines := []string{
		"Alex & Sam, " + s.TargetURL + "/invite/abc-123",
		"Robin, " + s.TargetURL + "/invite/def-456",
	}
	gotLines := strings.Split(strings.TrimRight(rec.Body.String(), "\n"), "\n")

	if len(gotLines) != len(wantLines) {
		t.Fatalf("lines = %q, want %q", gotLines, wantLines)
	}
	for i, want := range wantLines {
		if gotLines[i] != want {
			t.Errorf("line[%d] = %q, want %q", i, gotLines[i], want)
		}
	}
}

func TestCopyListReturnsBadGatewayOnUpstreamError(t *testing.T) {
	s := fakeUpstream(t, func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "boom", http.StatusInternalServerError)
	})

	req := httptest.NewRequest(http.MethodGet, "/invitees/copy", nil)
	rec := httptest.NewRecorder()

	s.CopyList(rec, req)

	if rec.Code != http.StatusBadGateway {
		t.Fatalf("status = %d, want 502", rec.Code)
	}
}
