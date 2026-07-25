package handlers

import (
	"fmt"
	"sort"
	"strings"
	"time"

	"admin/internal/client"
)

var activityLabels = map[string]string{
	"DESCENTE_RHONE": "Rhône descent",
	"BBQ_MIDI":       "BBQ (lunch)",
}

func activityLabel(activity string) string {
	if label, ok := activityLabels[activity]; ok {
		return label
	}
	return activity
}

// InvitationView is the summary-row projection of an invitation.
type InvitationView struct {
	client.Invitation
	Names       string
	StatusLabel string
	StatusKey   string
}

func newInvitationView(inv client.Invitation) InvitationView {
	names := inv.Guests[0].Name
	for _, g := range inv.Guests[1:] {
		names += " & " + g.Name
	}

	statusLabel, statusKey := "Pending", ""
	if inv.Responded() {
		attending := 0
		for _, g := range inv.Guests {
			if g.Participating != nil && *g.Participating {
				attending++
			}
		}
		switch {
		case attending == len(inv.Guests):
			statusLabel, statusKey = "Attending", "attending"
		case attending == 0:
			statusLabel, statusKey = "Not attending", "not-attending"
		default:
			statusLabel = fmt.Sprintf("%d/%d attending", attending, len(inv.Guests))
		}
	}

	return InvitationView{Invitation: inv, Names: names, StatusLabel: statusLabel, StatusKey: statusKey}
}

func InvitationViews(invitations []client.Invitation) []InvitationView {
	views := make([]InvitationView, len(invitations))
	for i, inv := range invitations {
		views[i] = newInvitationView(inv)
	}
	return views
}

// GuestDetailView is one guest's row within an expanded invitation detail.
type GuestDetailView struct {
	client.Guest
	StatusLabel string
}

// InvitationDetailView is the expanded, per-invitation answer breakdown.
type InvitationDetailView struct {
	client.Invitation
	RespondedLabel string
	Guests         []GuestDetailView
	Activities     []string
	BoatLabel      string
	InviteURL      string
}

// inviteURL builds the guest-facing invite link for an invitation code.
func inviteURL(baseURL, code string) string {
	return strings.TrimRight(baseURL, "/") + "/invite/" + code
}

func NewInvitationDetailView(inv client.Invitation, baseURL string) InvitationDetailView {
	respondedLabel := "Hasn't responded yet"
	if inv.RespondedAt != nil {
		if t, err := time.Parse(time.RFC3339, *inv.RespondedAt); err == nil {
			respondedLabel = "Responded " + t.Format("Jan 2, 2006")
		}
	}

	guests := make([]GuestDetailView, len(inv.Guests))
	for i, g := range inv.Guests {
		guests[i] = GuestDetailView{Guest: g, StatusLabel: guestStatusLabel(g)}
	}

	activities := make([]string, len(inv.ActivityParticipants))
	for i, a := range inv.ActivityParticipants {
		activities[i] = activityLabel(a.Activity)
	}
	sort.Strings(activities)

	return InvitationDetailView{
		Invitation:     inv,
		RespondedLabel: respondedLabel,
		Guests:         guests,
		Activities:     activities,
		BoatLabel:      boatLabel(inv),
		InviteURL:      inviteURL(baseURL, inv.Code),
	}
}

// guestStatusLabel is the display-ready RSVP status for a single guest.
func guestStatusLabel(g client.Guest) string {
	switch {
	case g.Participating == nil:
		return "Undecided"
	case *g.Participating:
		return "Attending"
	default:
		return "Not attending"
	}
}

// boatLabel is the display-ready boat offer/need for an invitation, or ""
// if it hasn't answered the boat question.
func boatLabel(inv client.Invitation) string {
	if inv.BoatInfo == nil {
		return ""
	}
	if inv.BoatInfo.AvailableSpots != nil {
		return fmt.Sprintf("Offering %d boat spot(s)", *inv.BoatInfo.AvailableSpots)
	}
	if inv.BoatInfo.NeededSpots != nil {
		return fmt.Sprintf("Needs %d boat spot(s)", *inv.BoatInfo.NeededSpots)
	}
	return ""
}

// SingleOption is one currently-unpaired guest, offered by the "link two
// people" picker.
type SingleOption struct {
	GuestID int
	Name    string
}

func SingleOptions(invitations []client.Invitation) []SingleOption {
	var options []SingleOption
	for _, inv := range invitations {
		if len(inv.Guests) == 1 {
			options = append(options, SingleOption{GuestID: inv.Guests[0].ID, Name: inv.Guests[0].Name})
		}
	}
	return options
}

// StatsView adds display-ready fields on top of the raw stats payload.
type StatsView struct {
	client.Stats
	ResponseRateLabel string
	ActivityRows      []ActivityRow
}

type ActivityRow struct {
	Label string
	Count int
}

var activityOrder = []string{"DESCENTE_RHONE", "BBQ_MIDI"}

// LinkPreviewView is the "link two people" preview/conflict-picker payload.
type LinkPreviewView struct {
	GuestIDA, GuestIDB       int
	NameA, NameB             string
	Conflict                 bool
	InvitationA, InvitationB InvitationDetailView
}

func FindInvitationByGuestID(invitations []client.Invitation, guestID int) (client.Invitation, bool) {
	for _, inv := range invitations {
		for _, g := range inv.Guests {
			if g.ID == guestID {
				return inv, true
			}
		}
	}
	return client.Invitation{}, false
}

func nameForGuest(inv client.Invitation, guestID int) string {
	for _, g := range inv.Guests {
		if g.ID == guestID {
			return g.Name
		}
	}
	return ""
}

func NewLinkPreviewView(guestIDA, guestIDB int, invA, invB client.Invitation, baseURL string) LinkPreviewView {
	return LinkPreviewView{
		GuestIDA:    guestIDA,
		GuestIDB:    guestIDB,
		NameA:       nameForGuest(invA, guestIDA),
		NameB:       nameForGuest(invB, guestIDB),
		Conflict:    invA.Responded() && invB.Responded(),
		InvitationA: NewInvitationDetailView(invA, baseURL),
		InvitationB: NewInvitationDetailView(invB, baseURL),
	}
}

func NewStatsView(stats client.Stats) StatsView {
	rate := "—"
	if stats.Invitations.Total > 0 {
		pct := float64(stats.Invitations.Responded) / float64(stats.Invitations.Total) * 100
		rate = fmt.Sprintf("%.0f%%", pct)
	}

	rows := make([]ActivityRow, 0, len(activityOrder))
	for _, activity := range activityOrder {
		rows = append(rows, ActivityRow{Label: activityLabel(activity), Count: stats.Activities[activity]})
	}

	return StatsView{Stats: stats, ResponseRateLabel: rate, ActivityRows: rows}
}
