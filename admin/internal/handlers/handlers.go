// Package handlers wires HTTP/HTMX requests to the admin API client and
// renders the templates.
package handlers

import (
	"context"
	"errors"
	"html/template"
	"net/http"
	"strconv"
	"strings"
	"sync"

	"admin/internal/client"
	"admin/internal/templates"
)

type Server struct {
	Client    *client.Client
	TargetURL string

	// pendingMu guards the most recently previewed (but not yet confirmed)
	// CSV import. Only one pending import is tracked at a time; confirming
	// requires the token to match, so a stale or unknown token is rejected.
	pendingMu    sync.Mutex
	pendingRows  []client.ImportRow
	pendingToken string
}

type dashboardData struct {
	Stats       StatsView
	Invitations []InvitationView
	Singles     []SingleOption
}

func (s *Server) loadDashboard(ctx context.Context) (dashboardData, error) {
	invitations, err := s.Client.ListInvitations(ctx)
	if err != nil {
		return dashboardData{}, err
	}
	stats, err := s.Client.Stats(ctx)
	if err != nil {
		return dashboardData{}, err
	}

	return dashboardData{
		Stats:       NewStatsView(*stats),
		Invitations: InvitationViews(invitations),
		Singles:     SingleOptions(invitations),
	}, nil
}

func (s *Server) Index(w http.ResponseWriter, r *http.Request) {
	dashboard, err := s.loadDashboard(r.Context())
	if err != nil {
		http.Error(w, errMessage(err), http.StatusBadGateway)
		return
	}

	data := struct {
		dashboardData
		TargetURL string
	}{dashboardData: dashboard, TargetURL: s.TargetURL}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := templates.Templates().ExecuteTemplate(w, "page", data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// renderOOBUpdate refreshes the stats panel, invitee list, and link panel
// after a successful mutation. It's the response body for every
// create/delete/link action.
func (s *Server) renderOOBUpdate(w http.ResponseWriter, r *http.Request) {
	dashboard, err := s.loadDashboard(r.Context())
	if err != nil {
		statusMessage(w, errMessage(err))
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_ = templates.Templates().ExecuteTemplate(w, "oob-update", dashboard)
}

func statusMessage(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = w.Write([]byte(template.HTMLEscapeString(message)))
}

func errMessage(err error) string {
	var apiErr *client.APIError
	if errors.As(err, &apiErr) && apiErr.Message != "" {
		return apiErr.Message
	}
	return err.Error()
}

func (s *Server) CreateInvitee(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		statusMessage(w, "Invalid form submission")
		return
	}

	name := strings.TrimSpace(r.PostFormValue("name"))
	if name == "" {
		statusMessage(w, "Name is required")
		return
	}

	if _, err := s.Client.CreateInvitee(r.Context(), name); err != nil {
		statusMessage(w, errMessage(err))
		return
	}

	s.renderOOBUpdate(w, r)
}

func (s *Server) DeleteInvitation(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		statusMessage(w, "Invalid invitation id")
		return
	}

	if err := s.Client.DeleteInvitation(r.Context(), id); err != nil {
		statusMessage(w, errMessage(err))
		return
	}

	s.renderOOBUpdate(w, r)
}

func (s *Server) DeleteGuest(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		statusMessage(w, "Invalid guest id")
		return
	}

	if err := s.Client.DeleteGuest(r.Context(), id); err != nil {
		statusMessage(w, errMessage(err))
		return
	}

	s.renderOOBUpdate(w, r)
}

// resetConfirmPhrase must be typed exactly into the danger-zone modal
// before ResetData will call the upstream API. Kept in sync with the
// main app's own check in src/app/api/admin/reset/route.ts.
const resetConfirmPhrase = "RESET RSVPS"

func (s *Server) ResetData(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		statusMessage(w, "Invalid form submission")
		return
	}

	if r.PostFormValue("confirm") != resetConfirmPhrase {
		statusMessage(w, "Confirmation text does not match — nothing was reset")
		return
	}

	if err := s.Client.ResetData(r.Context(), resetConfirmPhrase); err != nil {
		statusMessage(w, errMessage(err))
		return
	}

	s.renderOOBUpdate(w, r)
}

// deleteAllConfirmPhrase must be typed exactly into the danger-zone modal
// before DeleteAllInvitees will call the upstream API. Kept in sync with
// the main app's own check in src/app/api/admin/invitations/route.ts.
const deleteAllConfirmPhrase = "DELETE ALL INVITEES"

func (s *Server) DeleteAllInvitees(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		statusMessage(w, "Invalid form submission")
		return
	}

	if r.PostFormValue("confirm") != deleteAllConfirmPhrase {
		statusMessage(w, "Confirmation text does not match — nothing was deleted")
		return
	}

	if err := s.Client.DeleteAllInvitations(r.Context(), deleteAllConfirmPhrase); err != nil {
		statusMessage(w, errMessage(err))
		return
	}

	s.renderOOBUpdate(w, r)
}

func (s *Server) InviteeDetail(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "invalid invitation id", http.StatusBadRequest)
		return
	}

	invitations, err := s.Client.ListInvitations(r.Context())
	if err != nil {
		http.Error(w, errMessage(err), http.StatusBadGateway)
		return
	}

	for _, inv := range invitations {
		if inv.ID == id {
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			_ = templates.Templates().ExecuteTemplate(w, "invitee-detail", NewInvitationDetailView(inv, s.TargetURL))
			return
		}
	}

	http.Error(w, "invitation not found", http.StatusNotFound)
}

func (s *Server) LinkPreview(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		http.Error(w, "invalid form submission", http.StatusBadRequest)
		return
	}

	guestIDA, errA := strconv.Atoi(r.PostFormValue("guestIdA"))
	guestIDB, errB := strconv.Atoi(r.PostFormValue("guestIdB"))
	if errA != nil || errB != nil || guestIDA == guestIDB {
		http.Error(w, "pick two different people", http.StatusBadRequest)
		return
	}

	invitations, err := s.Client.ListInvitations(r.Context())
	if err != nil {
		http.Error(w, errMessage(err), http.StatusBadGateway)
		return
	}

	invA, okA := FindInvitationByGuestID(invitations, guestIDA)
	invB, okB := FindInvitationByGuestID(invitations, guestIDB)
	if !okA || !okB {
		http.Error(w, "guest not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_ = templates.Templates().ExecuteTemplate(w, "link-result", NewLinkPreviewView(guestIDA, guestIDB, invA, invB, s.TargetURL))
}

func (s *Server) LinkConfirm(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		statusMessage(w, "Invalid form submission")
		return
	}

	guestIDA, errA := strconv.Atoi(r.PostFormValue("guestIdA"))
	guestIDB, errB := strconv.Atoi(r.PostFormValue("guestIdB"))
	if errA != nil || errB != nil {
		statusMessage(w, "Invalid guest selection")
		return
	}

	keepAnswersFrom := r.PostFormValue("keepAnswersFrom")

	if _, err := s.Client.LinkGuests(r.Context(), guestIDA, guestIDB, keepAnswersFrom); err != nil {
		statusMessage(w, errMessage(err))
		return
	}

	s.renderOOBUpdate(w, r)
}
