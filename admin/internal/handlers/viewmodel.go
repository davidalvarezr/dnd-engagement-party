package handlers

import (
	"fmt"
	"sort"
	"time"

	"admin/internal/client"
)

var activityLabels = map[string]string{
	"DESCENTE_RHONE": "Rhône descent",
	"BBQ_MIDI":       "BBQ (lunch)",
	"BBQ_SOIR":       "BBQ (dinner)",
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
}

func NewInvitationDetailView(inv client.Invitation) InvitationDetailView {
	respondedLabel := "Hasn't responded yet"
	if inv.RespondedAt != nil {
		if t, err := time.Parse(time.RFC3339, *inv.RespondedAt); err == nil {
			respondedLabel = "Responded " + t.Format("Jan 2, 2006")
		}
	}

	guests := make([]GuestDetailView, len(inv.Guests))
	for i, g := range inv.Guests {
		label := "Undecided"
		if g.Participating != nil {
			if *g.Participating {
				label = "Attending"
			} else {
				label = "Not attending"
			}
		}
		guests[i] = GuestDetailView{Guest: g, StatusLabel: label}
	}

	activities := make([]string, len(inv.ActivityParticipants))
	for i, a := range inv.ActivityParticipants {
		activities[i] = activityLabel(a.Activity)
	}
	sort.Strings(activities)

	boatLabel := ""
	if inv.BoatInfo != nil {
		if inv.BoatInfo.AvailableSpots != nil {
			boatLabel = fmt.Sprintf("Offering %d boat spot(s)", *inv.BoatInfo.AvailableSpots)
		} else if inv.BoatInfo.NeededSpots != nil {
			boatLabel = fmt.Sprintf("Needs %d boat spot(s)", *inv.BoatInfo.NeededSpots)
		}
	}

	return InvitationDetailView{
		Invitation:     inv,
		RespondedLabel: respondedLabel,
		Guests:         guests,
		Activities:     activities,
		BoatLabel:      boatLabel,
	}
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

var activityOrder = []string{"DESCENTE_RHONE", "BBQ_MIDI", "BBQ_SOIR"}

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

func NewLinkPreviewView(guestIDA, guestIDB int, invA, invB client.Invitation) LinkPreviewView {
	return LinkPreviewView{
		GuestIDA:    guestIDA,
		GuestIDB:    guestIDB,
		NameA:       nameForGuest(invA, guestIDA),
		NameB:       nameForGuest(invB, guestIDB),
		Conflict:    invA.Responded() && invB.Responded(),
		InvitationA: NewInvitationDetailView(invA),
		InvitationB: NewInvitationDetailView(invB),
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
