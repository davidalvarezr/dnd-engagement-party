package client

type Guest struct {
	ID            int    `json:"id"`
	InvitationID  int    `json:"invitationId"`
	Name          string `json:"name"`
	PartnerID     *int   `json:"partnerId"`
	Participating *bool  `json:"participating"`
}

type ActivityParticipation struct {
	ID           int    `json:"id"`
	InvitationID int    `json:"invitationId"`
	Activity     string `json:"activity"`
}

type BoatInfo struct {
	ID             int  `json:"id"`
	InvitationID   int  `json:"invitationId"`
	AvailableSpots *int `json:"availableSpots"`
	NeededSpots    *int `json:"neededSpots"`
}

type Invitation struct {
	ID                   int                     `json:"id"`
	Code                 string                  `json:"code"`
	RespondedAt          *string                 `json:"respondedAt"`
	Guests               []Guest                 `json:"guests"`
	ActivityParticipants []ActivityParticipation `json:"activityParticipants"`
	BoatInfo             *BoatInfo               `json:"boatInfo"`
}

// IsCouple reports whether this invitation represents two linked guests
// rather than a single invitee.
func (i Invitation) IsCouple() bool {
	return len(i.Guests) == 2
}

// Responded reports whether this invitation has an RSVP on file.
func (i Invitation) Responded() bool {
	return i.RespondedAt != nil
}

// ImportRow is one CSV data row submitted for a dry-run or confirmed
// invitee import. Line is the 1-based source line number (first data row
// is line 2, since line 1 is the header).
type ImportRow struct {
	Line   int    `json:"line"`
	Guest1 string `json:"guest1"`
	Guest2 string `json:"guest2"`
	Code   string `json:"code"`
}

// ImportReportRow is one row of the import classification result: the
// original row plus its outcome.
type ImportReportRow struct {
	ImportRow
	Status string `json:"status"`
	Reason string `json:"reason,omitempty"`
}

// ImportReport is the response from /api/admin/invitations/import, for
// both dry-run (Applied = false) and confirmed (Applied = true) requests.
type ImportReport struct {
	Applied bool              `json:"applied"`
	Rows    []ImportReportRow `json:"rows"`
	Totals  struct {
		Create int `json:"create"`
		Skip   int `json:"skip"`
		Error  int `json:"error"`
	} `json:"totals"`
	Created int `json:"created,omitempty"`
}

type Stats struct {
	Invitations struct {
		Total     int `json:"total"`
		Responded int `json:"responded"`
	} `json:"invitations"`
	Guests struct {
		Participating    int `json:"participating"`
		NotParticipating int `json:"notParticipating"`
		Undecided        int `json:"undecided"`
	} `json:"guests"`
	Activities map[string]int `json:"activities"`
	Boat       struct {
		AvailableSpots int `json:"availableSpots"`
		NeededSpots    int `json:"neededSpots"`
	} `json:"boat"`
}
