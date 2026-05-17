"use client"

import type { getInvitationByCode } from "@/lib/invitations"

type Invitation = NonNullable<Awaited<ReturnType<typeof getInvitationByCode>>>

const ACTIVITY_LABELS: Record<string, string> = {
  DESCENTE_RHONE: "10:00 — Descente du Rhône",
  BBQ_MIDI: "13:00 — BBQ midi",
  BBQ_SOIR: "18:00 — BBQ soir",
}

type Props = {
  invitation: Invitation
  onEdit: () => void
}

export function ReadMode({ invitation, onEdit }: Props) {
  const attending = invitation.guests.filter((g) => g.participating)
  const notAttending = invitation.guests.filter((g) => !g.participating)

  return (
    <div>
      {attending.length > 0 && (
        <p>✅ Attending: {attending.map((g) => g.name).join(" & ")}</p>
      )}
      {notAttending.length > 0 && (
        <p>❌ Not attending: {notAttending.map((g) => g.name).join(" & ")}</p>
      )}

      {invitation.activityParticipants.length > 0 && (
        <div>
          <p>Activities:</p>
          <ul>
            {invitation.activityParticipants.map((a) => (
              <li key={a.id}>{ACTIVITY_LABELS[a.activity] ?? a.activity}</li>
            ))}
          </ul>
        </div>
      )}

      {invitation.boatInfo?.availableSpots !== null && invitation.boatInfo?.availableSpots !== undefined && (
        <p>🚣 Boat available — {invitation.boatInfo.availableSpots} spot(s)</p>
      )}
      {invitation.boatInfo?.neededSpots !== null && invitation.boatInfo?.neededSpots !== undefined && (
        <p>🚣 Needs {invitation.boatInfo.neededSpots} spot(s) in a boat</p>
      )}

      <button type="button" onClick={onEdit}>Edit</button>
    </div>
  )
}
