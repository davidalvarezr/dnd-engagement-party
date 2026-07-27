package handlers

import (
	"fmt"
	"net/http"
	"strings"
)

// CopyList renders one "invitee(s), url" line per invitation as plain text,
// for the "copy all invites" button to hand to the clipboard.
func (s *Server) CopyList(w http.ResponseWriter, r *http.Request) {
	invitations, err := s.Client.ListInvitations(r.Context())
	if err != nil {
		http.Error(w, errMessage(err), http.StatusBadGateway)
		return
	}

	var b strings.Builder
	for _, v := range InvitationViews(invitations) {
		fmt.Fprintf(&b, "%s, %s\n", v.Names, inviteURL(s.TargetURL, v.Code))
	}

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	_, _ = w.Write([]byte(b.String()))
}
