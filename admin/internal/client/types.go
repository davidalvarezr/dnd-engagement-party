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
