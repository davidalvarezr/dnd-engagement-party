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

var activityEmojis = map[string]string{
	"DESCENTE_RHONE": "🛶",
	"BBQ_MIDI":       "🍖",
}

func activityLabel(activity string) string {
	if label, ok := activityLabels[activity]; ok {
		return label
	}
	return activity
}

// ActivityChip is a badge-ready projection of a chosen activity.
type ActivityChip struct {
	Key   string
	Label string
	Emoji string
}

// activityChipsFor returns an invitation's chosen activities as badges,
// sorted by display label.
func activityChipsFor(inv client.Invitation) []ActivityChip {
	chips := make([]ActivityChip, len(inv.ActivityParticipants))
	for i, a := range inv.ActivityParticipants {
		chips[i] = ActivityChip{Key: a.Activity, Label: activityLabel(a.Activity), Emoji: activityEmojis[a.Activity]}
	}
	sort.Slice(chips, func(i, j int) bool { return chips[i].Label < chips[j].Label })
	return chips
}

// InvitationView is the summary-row projection of an invitation.
type InvitationView struct {
	client.Invitation
	Names       string
	StatusLabel string
	StatusKey   string
	Activities  []ActivityChip
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
			statusLabel, statusKey = fmt.Sprintf("%d/%d attending", attending, len(inv.Guests)), "partial"
		}
	}

	return InvitationView{Invitation: inv, Names: names, StatusLabel: statusLabel, StatusKey: statusKey, Activities: activityChipsFor(inv)}
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
	Activities     []ActivityChip
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

	return InvitationDetailView{
		Invitation:     inv,
		RespondedLabel: respondedLabel,
		Guests:         guests,
		Activities:     activityChipsFor(inv),
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

// ActivityGroup is one activity's participating households, for the
// Activities tab.
type ActivityGroup struct {
	Activity string
	Label    string
	Invitees []InvitationView
}

// ActivityGroups buckets invitation views by activity, in activityOrder. An
// invitation belongs to a group if it has an ActivityParticipation row for
// that activity, regardless of individual guest Participating status — the
// same signal StatsView.ActivityRows counts already use.
func ActivityGroups(views []InvitationView) []ActivityGroup {
	groups := make([]ActivityGroup, 0, len(activityOrder))
	for _, activity := range activityOrder {
		group := ActivityGroup{Activity: activity, Label: activityLabel(activity)}
		for _, v := range views {
			for _, ap := range v.ActivityParticipants {
				if ap.Activity == activity {
					group.Invitees = append(group.Invitees, v)
					break
				}
			}
		}
		groups = append(groups, group)
	}
	return groups
}

// BoatGroups is the Offering/Needing split for the Boat tab.
type BoatGroups struct {
	Offering []BoatEntry
	Needing  []BoatEntry
}

// BoatEntry is one household's boat offer or need.
type BoatEntry struct {
	Names string
	Spots int
}

// NewBoatGroups splits invitation views into "offering" and "needing" boat
// spot groups.
func NewBoatGroups(views []InvitationView) BoatGroups {
	var g BoatGroups
	for _, v := range views {
		if v.BoatInfo == nil {
			continue
		}
		if v.BoatInfo.AvailableSpots != nil {
			g.Offering = append(g.Offering, BoatEntry{Names: v.Names, Spots: *v.BoatInfo.AvailableSpots})
		}
		if v.BoatInfo.NeededSpots != nil {
			g.Needing = append(g.Needing, BoatEntry{Names: v.Names, Spots: *v.BoatInfo.NeededSpots})
		}
	}
	return g
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
