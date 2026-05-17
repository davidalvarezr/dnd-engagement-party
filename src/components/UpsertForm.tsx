"use client"

import { useState } from "react"
import type { getInvitationByCode } from "@/lib/invitations"

type Invitation = NonNullable<Awaited<ReturnType<typeof getInvitationByCode>>>
type Activity = "DESCENTE_RHONE" | "BBQ_MIDI" | "BBQ_SOIR"

type Props = {
  invitation: Invitation
  onSubmit: (data: SubmitPayload) => Promise<void>
  onCancel?: () => void
}

export type SubmitPayload = {
  guests: { id: number; participating: boolean }[]
  activities: Activity[]
  boatInfo?: { availableSpots?: number; neededSpots?: number }
}

function deriveAttendance(invitation: Invitation): string | null {
  const [guestA, guestB] = invitation.guests
  if (guestA.participating === null) return null
  if (invitation.guests.length === 1) return guestA.participating ? "yes" : "no"
  if (guestA.participating && guestB.participating) return "both"
  if (guestA.participating) return "guestA"
  if (guestB.participating) return "guestB"
  return "none"
}

function deriveBoatChoice(invitation: Invitation): "has_boat" | "needs_spot" | null {
  if (!invitation.boatInfo) return null
  if (invitation.boatInfo.availableSpots !== null) return "has_boat"
  if (invitation.boatInfo.neededSpots !== null) return "needs_spot"
  return null
}

export function UpsertForm({ invitation, onSubmit, onCancel }: Props) {
  const isCouple = invitation.guests.length === 2
  const [guestA, guestB] = invitation.guests

  const [attendance, setAttendance] = useState<string | null>(() => deriveAttendance(invitation))
  const [activities, setActivities] = useState<Activity[]>(() => invitation.activityParticipants.map((a) => a.activity as Activity))
  const [boatChoice, setBoatChoice] = useState<"has_boat" | "needs_spot" | null>(() => deriveBoatChoice(invitation))
  const [availableSpots, setAvailableSpots] = useState(() => invitation.boatInfo?.availableSpots ?? 0)
  const [neededSpots, setNeededSpots] = useState(() => invitation.boatInfo?.neededSpots ?? 0)

  const someoneAttending = attendance !== null && attendance !== "none" && attendance !== "no"
  const descente = activities.includes("DESCENTE_RHONE")

  function toggleActivity(activity: Activity) {
    setActivities((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity]
    )
  }

  function buildPayload(): SubmitPayload {
    const guests = isCouple
      ? [
          { id: guestA.id, participating: attendance === "both" || attendance === "guestA" },
          { id: guestB.id, participating: attendance === "both" || attendance === "guestB" },
        ]
      : [{ id: guestA.id, participating: attendance === "yes" }]

    const boatInfo =
      boatChoice === "has_boat"
        ? { availableSpots }
        : boatChoice === "needs_spot"
          ? { neededSpots }
          : undefined

    return { guests, activities, boatInfo }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(buildPayload())
      }}
    >
      {/* Q1 — Attendance */}
      <fieldset>
        <legend>
          {isCouple ? "Who is coming to the event?" : "Are you coming to the event?"}
        </legend>

        {isCouple ? (
          <>
            <label><input type="radio" name="attendance" value="both" checked={attendance === "both"} onChange={(e) => setAttendance(e.target.value)} /> Both of us</label>
            <label><input type="radio" name="attendance" value="guestA" checked={attendance === "guestA"} onChange={(e) => setAttendance(e.target.value)} /> {guestA.name}</label>
            <label><input type="radio" name="attendance" value="guestB" checked={attendance === "guestB"} onChange={(e) => setAttendance(e.target.value)} /> {guestB.name}</label>
            <label><input type="radio" name="attendance" value="none" checked={attendance === "none"} onChange={(e) => setAttendance(e.target.value)} /> None of us</label>
          </>
        ) : (
          <>
            <label><input type="radio" name="attendance" value="yes" checked={attendance === "yes"} onChange={(e) => setAttendance(e.target.value)} /> Yes</label>
            <label><input type="radio" name="attendance" value="no" checked={attendance === "no"} onChange={(e) => setAttendance(e.target.value)} /> No</label>
          </>
        )}
      </fieldset>

      {/* Q2 — Activities */}
      {someoneAttending && (
        <fieldset>
          <legend>I&apos;m participating to:</legend>
          <label><input type="checkbox" checked={activities.includes("DESCENTE_RHONE")} onChange={() => toggleActivity("DESCENTE_RHONE")} /> 10:00 — Descente du Rhône</label>
          <label><input type="checkbox" checked={activities.includes("BBQ_MIDI")} onChange={() => toggleActivity("BBQ_MIDI")} /> 13:00 — BBQ midi</label>
          <label><input type="checkbox" checked={activities.includes("BBQ_SOIR")} onChange={() => toggleActivity("BBQ_SOIR")} /> 18:00 — BBQ soir</label>
        </fieldset>
      )}

      {/* Q3 — Boat */}
      {someoneAttending && descente && (
        <fieldset>
          <legend>Inflatable boat</legend>
          <label><input type="radio" name="boat" value="has_boat" checked={boatChoice === "has_boat"} onChange={() => setBoatChoice("has_boat")} /> I have a/multiple inflatable boat(s)</label>
          <label><input type="radio" name="boat" value="needs_spot" checked={boatChoice === "needs_spot"} onChange={() => setBoatChoice("needs_spot")} /> I need a/multiple spot(s) in an inflatable boat</label>
        </fieldset>
      )}

      {/* Q4 — Available spots */}
      {someoneAttending && descente && boatChoice === "has_boat" && (
        <fieldset>
          <legend>How many available spots do you have in your boat(s)?</legend>
          <input type="number" min={0} max={12} value={availableSpots} onChange={(e) => setAvailableSpots(Number(e.target.value))} />
        </fieldset>
      )}

      {/* Q5 — Needed spots */}
      {someoneAttending && descente && boatChoice === "needs_spot" && (
        <fieldset>
          <legend>How many spots do you need?</legend>
          <input type="number" min={0} max={4} value={neededSpots} onChange={(e) => setNeededSpots(Number(e.target.value))} />
        </fieldset>
      )}

      <button type="submit" disabled={attendance === null}>Submit</button>
      {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
    </form>
  )
}
