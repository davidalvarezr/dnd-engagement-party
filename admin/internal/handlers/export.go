package handlers

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"time"

	"admin/internal/client"
)

var exportHeader = []string{"guest1", "guest2", "code"}

// exportRow projects one invitation into a guest1,guest2,code CSV row —
// the same shape the import endpoint accepts, so an exported file can be
// re-imported unchanged.
func exportRow(inv client.Invitation) []string {
	var guest1, guest2 string
	if len(inv.Guests) > 0 {
		guest1 = inv.Guests[0].Name
	}
	if len(inv.Guests) > 1 {
		guest2 = inv.Guests[1].Name
	}
	return []string{guest1, guest2, inv.Code}
}

// Export streams the full guest list as a CSV attachment: one row per
// invitation, ordered the same way the dashboard lists them.
func (s *Server) Export(w http.ResponseWriter, r *http.Request) {
	invitations, err := s.Client.ListInvitations(r.Context())
	if err != nil {
		http.Error(w, errMessage(err), http.StatusBadGateway)
		return
	}

	filename := fmt.Sprintf("guest-list-%s.csv", time.Now().Format("2006-01-02"))
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))

	writer := csv.NewWriter(w)
	_ = writer.Write(exportHeader)
	for _, inv := range invitations {
		_ = writer.Write(exportRow(inv))
	}
	writer.Flush()
}
