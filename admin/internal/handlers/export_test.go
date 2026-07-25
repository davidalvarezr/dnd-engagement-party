package handlers

import (
	"encoding/csv"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"admin/internal/client"
)

func TestExportWritesHeaderAndRows(t *testing.T) {
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

	req := httptest.NewRequest(http.MethodGet, "/export", nil)
	rec := httptest.NewRecorder()

	s.Export(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); !strings.HasPrefix(ct, "text/csv") {
		t.Errorf("Content-Type = %q, want text/csv", ct)
	}
	if cd := rec.Header().Get("Content-Disposition"); !strings.Contains(cd, "attachment") || !strings.Contains(cd, ".csv") {
		t.Errorf("Content-Disposition = %q, want an attachment with a .csv filename", cd)
	}

	rows, err := csv.NewReader(rec.Body).ReadAll()
	if err != nil {
		t.Fatalf("parsing exported CSV: %v", err)
	}
	if len(rows) != 3 {
		t.Fatalf("len(rows) = %d, want 3 (header + 2 invitations)", len(rows))
	}

	wantHeader := []string{"guest1", "guest2", "code"}
	for i, col := range wantHeader {
		if rows[0][i] != col {
			t.Errorf("header[%d] = %q, want %q", i, rows[0][i], col)
		}
	}

	wantCouple := []string{"Alex", "Sam", "abc-123"}
	for i, want := range wantCouple {
		if rows[1][i] != want {
			t.Errorf("couple row[%d] = %q, want %q", i, rows[1][i], want)
		}
	}

	wantSingle := []string{"Robin", "", "def-456"}
	for i, want := range wantSingle {
		if rows[2][i] != want {
			t.Errorf("single row[%d] = %q, want %q", i, rows[2][i], want)
		}
	}
}

func TestExportReturnsBadGatewayOnUpstreamError(t *testing.T) {
	s := fakeUpstream(t, func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "boom", http.StatusInternalServerError)
	})

	req := httptest.NewRequest(http.MethodGet, "/export", nil)
	rec := httptest.NewRecorder()

	s.Export(rec, req)

	if rec.Code != http.StatusBadGateway {
		t.Fatalf("status = %d, want 502", rec.Code)
	}
}
