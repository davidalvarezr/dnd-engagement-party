package handlers

import (
	"testing"

	"admin/internal/client"
)

func boolPtr(b bool) *bool { return &b }

func TestNewInvitationViewStatus(t *testing.T) {
	responded := "2026-01-01T00:00:00.000Z"

	tests := []struct {
		name      string
		guests    []client.Guest
		responded *string
		wantLabel string
		wantKey   string
	}{
		{
			name:      "not yet responded",
			guests:    []client.Guest{{ID: 1, Name: "Alex"}},
			responded: nil,
			wantLabel: "Pending",
			wantKey:   "",
		},
		{
			name:      "single attending",
			guests:    []client.Guest{{ID: 1, Name: "Alex", Participating: boolPtr(true)}},
			responded: &responded,
			wantLabel: "Attending",
			wantKey:   "attending",
		},
		{
			name:      "single not attending",
			guests:    []client.Guest{{ID: 1, Name: "Alex", Participating: boolPtr(false)}},
			responded: &responded,
			wantLabel: "Not attending",
			wantKey:   "not-attending",
		},
		{
			name: "couple partially attending",
			guests: []client.Guest{
				{ID: 1, Name: "Alex", Participating: boolPtr(true)},
				{ID: 2, Name: "Jamie", Participating: boolPtr(false)},
			},
			responded: &responded,
			wantLabel: "1/2 attending",
			wantKey:   "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			view := newInvitationView(client.Invitation{
				Guests:      tt.guests,
				RespondedAt: tt.responded,
			})

			if view.StatusLabel != tt.wantLabel {
				t.Errorf("StatusLabel = %q, want %q", view.StatusLabel, tt.wantLabel)
			}
			if view.StatusKey != tt.wantKey {
				t.Errorf("StatusKey = %q, want %q", view.StatusKey, tt.wantKey)
			}
		})
	}
}

func TestNewInvitationViewNames(t *testing.T) {
	view := newInvitationView(client.Invitation{
		Guests: []client.Guest{{Name: "Alex"}, {Name: "Jamie"}},
	})

	if view.Names != "Alex & Jamie" {
		t.Errorf("Names = %q, want %q", view.Names, "Alex & Jamie")
	}
}

func TestSingleOptionsOnlyIncludesUnpairedGuests(t *testing.T) {
	invitations := []client.Invitation{
		{Guests: []client.Guest{{ID: 1, Name: "Alex"}}},
		{Guests: []client.Guest{{ID: 2, Name: "Sam"}, {ID: 3, Name: "Jo"}}},
	}

	options := SingleOptions(invitations)

	if len(options) != 1 || options[0].GuestID != 1 {
		t.Fatalf("SingleOptions() = %+v, want only guest 1", options)
	}
}

func TestNewLinkPreviewViewConflict(t *testing.T) {
	responded := "2026-01-01T00:00:00.000Z"

	tests := []struct {
		name         string
		invA, invB   client.Invitation
		wantConflict bool
	}{
		{
			name:         "neither responded",
			invA:         client.Invitation{Guests: []client.Guest{{ID: 1, Name: "Alex"}}},
			invB:         client.Invitation{Guests: []client.Guest{{ID: 2, Name: "Sam"}}},
			wantConflict: false,
		},
		{
			name:         "only one responded",
			invA:         client.Invitation{Guests: []client.Guest{{ID: 1, Name: "Alex"}}, RespondedAt: &responded},
			invB:         client.Invitation{Guests: []client.Guest{{ID: 2, Name: "Sam"}}},
			wantConflict: false,
		},
		{
			name:         "both responded",
			invA:         client.Invitation{Guests: []client.Guest{{ID: 1, Name: "Alex"}}, RespondedAt: &responded},
			invB:         client.Invitation{Guests: []client.Guest{{ID: 2, Name: "Sam"}}, RespondedAt: &responded},
			wantConflict: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			preview := NewLinkPreviewView(1, 2, tt.invA, tt.invB)
			if preview.Conflict != tt.wantConflict {
				t.Errorf("Conflict = %v, want %v", preview.Conflict, tt.wantConflict)
			}
			if preview.NameA != "Alex" || preview.NameB != "Sam" {
				t.Errorf("names = %q/%q, want Alex/Sam", preview.NameA, preview.NameB)
			}
		})
	}
}
