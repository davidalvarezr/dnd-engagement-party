"use client"

import type { getInvitationByCode } from "@/lib/invitations"
import typography from "@/styles/typography.module.css"
import { type BoatStats, EventInfo } from "./EventInfo"
import { InviteShell } from "./InviteShell"
import styles from "./ReadMode.module.css"
import { BoatDivider } from "./ui/BoatDivider"
import { Button } from "./ui/Button"
import { WavyDivider } from "./ui/WavyDivider"

type Invitation = NonNullable<Awaited<ReturnType<typeof getInvitationByCode>>>

const ACTIVITY_LABELS: Record<string, string> = {
    DESCENTE_RHONE: "11h00 — Descente du Rhône",
    BBQ_MIDI: "14h30 — BBQ",
}

type Props = {
    invitation: Invitation
    boatStats: BoatStats
    onEdit: () => void
}

export function ReadMode({ invitation, boatStats, onEdit }: Props) {
    const attending = invitation.guests.filter((g) => g.participating)
    const notAttending = invitation.guests.filter((g) => !g.participating)

    return (
        <InviteShell>
            <div className={styles.content}>
                <BoatDivider align="center" />

                <div className={styles.intro}>
                    <h3 className={typography.h3}>merci !</h3>
                    <p className={typography.p}>
                        Voici ce qu’on a retenu de ta réponse :
                    </p>
                </div>

                <WavyDivider />

                <section className={styles.section}>
                    {attending.length > 0 && (
                        <p className={typography.p}>
                            ✅ Viennent :{" "}
                            {attending.map((g) => g.name).join(" & ")}
                        </p>
                    )}
                    {notAttending.length > 0 && (
                        <p className={typography.p}>
                            ❌ Ne viennent pas :{" "}
                            {notAttending.map((g) => g.name).join(" & ")}
                        </p>
                    )}

                    {invitation.activityParticipants.length > 0 && (
                        <div className={styles.section}>
                            <p className={typography.p}>
                                <strong>Activités :</strong>
                            </p>
                            <ul className={styles.activityList}>
                                {invitation.activityParticipants.map((a) => (
                                    <li key={a.id} className={typography.p}>
                                        {ACTIVITY_LABELS[a.activity] ??
                                            a.activity}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {invitation.boatInfo?.availableSpots !== null &&
                        invitation.boatInfo?.availableSpots !== undefined && (
                            <p className={typography.p}>
                                🚣 Bateau disponible —{" "}
                                {invitation.boatInfo.availableSpots} place(s)
                            </p>
                        )}
                    {invitation.boatInfo?.neededSpots !== null &&
                        invitation.boatInfo?.neededSpots !== undefined && (
                            <p className={typography.p}>
                                🚣 Besoin de {invitation.boatInfo.neededSpots}{" "}
                                place(s) dans un bateau
                            </p>
                        )}
                </section>

                <div className={styles.actions}>
                    <Button type="button" onClick={onEdit}>
                        modifier
                    </Button>
                </div>

                <EventInfo boatStats={boatStats} />
            </div>
        </InviteShell>
    )
}
