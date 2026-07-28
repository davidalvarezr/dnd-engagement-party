"use client"

import Image from "next/image"
import { useState } from "react"
import type { getInvitationByCode } from "@/lib/invitations"
import typography from "@/styles/typography.module.css"
import { type BoatStats, EventInfo } from "./EventInfo"
import { InviteShell } from "./InviteShell"
import styles from "./UpsertForm.module.css"
import { BoatDivider } from "./ui/BoatDivider"
import { Button } from "./ui/Button"
import { Checkbox } from "./ui/Checkbox"
import { NumberInput } from "./ui/NumberInput"
import { Radio } from "./ui/Radio"
import { WavyDivider } from "./ui/WavyDivider"

type Invitation = NonNullable<Awaited<ReturnType<typeof getInvitationByCode>>>
type Activity = "DESCENTE_RHONE" | "BBQ_MIDI"

type Props = {
    invitation: Invitation
    boatStats: BoatStats
    onSubmit: (data: SubmitPayload) => void
    onCancel?: () => void
    isPending?: boolean
}

export type SubmitPayload = {
    guests: { id: number; participating: boolean }[]
    activities: Activity[]
    boatInfo?: { availableSpots?: number; neededSpots?: number }
}

export function deriveAttendance(invitation: Invitation): string | null {
    const [guestA, guestB] = invitation.guests
    if (guestA.participating === null) return null
    if (invitation.guests.length === 1)
        return guestA.participating ? "yes" : "no"
    if (guestA.participating && guestB.participating) return "both"
    if (guestA.participating) return "guestA"
    if (guestB.participating) return "guestB"
    return "none"
}

export function deriveBoatChoice(
    invitation: Invitation,
): "has_boat" | "needs_spot" | null {
    if (!invitation.boatInfo) return null
    if (invitation.boatInfo.availableSpots !== null) return "has_boat"
    if (invitation.boatInfo.neededSpots !== null) return "needs_spot"
    return null
}

export function UpsertForm({
    invitation,
    boatStats,
    onSubmit,
    onCancel,
    isPending = false,
}: Props) {
    const isCouple = invitation.guests.length === 2
    const [guestA, guestB] = invitation.guests

    const [attendance, setAttendance] = useState<string | null>(() =>
        deriveAttendance(invitation),
    )
    const [activities, setActivities] = useState<Activity[]>(() =>
        invitation.activityParticipants.map((a) => a.activity as Activity),
    )
    const [boatChoice, setBoatChoice] = useState<
        "has_boat" | "needs_spot" | null
    >(() => deriveBoatChoice(invitation))
    const [availableSpots, setAvailableSpots] = useState(
        () => invitation.boatInfo?.availableSpots ?? 0,
    )
    const [neededSpots, setNeededSpots] = useState(
        () => invitation.boatInfo?.neededSpots ?? 0,
    )

    const someoneAttending =
        attendance !== null && attendance !== "none" && attendance !== "no"
    const descente = activities.includes("DESCENTE_RHONE")

    function toggleActivity(activity: Activity) {
        setActivities((prev) =>
            prev.includes(activity)
                ? prev.filter((a) => a !== activity)
                : [...prev, activity],
        )
    }

    function buildPayload(): SubmitPayload {
        const guests = isCouple
            ? [
                  {
                      id: guestA.id,
                      participating:
                          attendance === "both" || attendance === "guestA",
                  },
                  {
                      id: guestB.id,
                      participating:
                          attendance === "both" || attendance === "guestB",
                  },
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
        <InviteShell>
            <form
                className={styles.form}
                onSubmit={(e) => {
                    e.preventDefault()
                    onSubmit(buildPayload())
                }}
            >
                <BoatDivider align="center" />

                <div className={styles.intro}>
                    <div className={styles.illustrations}>
                        <Image
                            src="/images/invite/david-group.svg"
                            alt=""
                            width={128}
                            height={139}
                            className={`${styles.funPerson} ${styles.davidGroup}`}
                            aria-hidden
                        />
                        <Image
                            src="/images/invite/danielle-group.svg"
                            alt=""
                            width={203}
                            height={79}
                            className={`${styles.funPerson} ${styles.danielleGroup}`}
                            aria-hidden
                        />
                    </div>
                    <div className={styles.paragraphs}>
                        <p
                            className={`${typography.p} ${styles.leadParagraph}`}
                        >
                            <strong>Okay, let’s GO</strong> fêter nos
                            fiançailles !
                        </p>
                        <p className={typography.p}>
                            <strong>
                                Cela nous ferait plaisir de vous avoir parmi
                                nous pour célébrer ensemble.
                            </strong>
                        </p>
                        <p className={typography.p}>
                            Les infos ainsi que le questionnaire pour
                            l’organisation se trouvent ci-dessous,{" "}
                            <strong>veuillez compléter au plus vite</strong>{" "}
                            pour s’assurer d’avoir une place dans un bateau :)
                        </p>
                    </div>
                </div>

                <EventInfo boatStats={boatStats} />

                <WavyDivider />

                <section className={styles.section}>
                    <h3 className={`${typography.h3} ${styles.headingLeft}`}>
                        questionnaire
                    </h3>

                    {/* Q1 — Attendance */}
                    <fieldset className={styles.fieldset}>
                        <legend className={styles.legend}>
                            {isCouple ? "Qui vient ?" : "Tu viens ?"}
                        </legend>
                        <div className={styles.optionList}>
                            {isCouple ? (
                                <>
                                    <Radio
                                        name="attendance"
                                        value="both"
                                        checked={attendance === "both"}
                                        onChange={(e) =>
                                            setAttendance(e.target.value)
                                        }
                                        label="Les deux"
                                    />
                                    <Radio
                                        name="attendance"
                                        value="guestA"
                                        checked={attendance === "guestA"}
                                        onChange={(e) =>
                                            setAttendance(e.target.value)
                                        }
                                        label={guestA.name}
                                    />
                                    <Radio
                                        name="attendance"
                                        value="guestB"
                                        checked={attendance === "guestB"}
                                        onChange={(e) =>
                                            setAttendance(e.target.value)
                                        }
                                        label={guestB.name}
                                    />
                                    <Radio
                                        name="attendance"
                                        value="none"
                                        checked={attendance === "none"}
                                        onChange={(e) =>
                                            setAttendance(e.target.value)
                                        }
                                        label="Personne"
                                    />
                                </>
                            ) : (
                                <>
                                    <Radio
                                        name="attendance"
                                        value="yes"
                                        checked={attendance === "yes"}
                                        onChange={(e) =>
                                            setAttendance(e.target.value)
                                        }
                                        label="Oui"
                                    />
                                    <Radio
                                        name="attendance"
                                        value="no"
                                        checked={attendance === "no"}
                                        onChange={(e) =>
                                            setAttendance(e.target.value)
                                        }
                                        label="Non"
                                    />
                                </>
                            )}
                        </div>
                    </fieldset>

                    {/* Q2 — Activities */}
                    {someoneAttending && (
                        <fieldset className={styles.fieldset}>
                            <legend className={styles.legend}>
                                Je participe à :
                            </legend>
                            <div className={styles.optionList}>
                                <Checkbox
                                    checked={activities.includes(
                                        "DESCENTE_RHONE",
                                    )}
                                    onChange={() =>
                                        toggleActivity("DESCENTE_RHONE")
                                    }
                                    label={
                                        <>
                                            <strong>11h00</strong> Descente du
                                            Rhône
                                        </>
                                    }
                                />
                                <Checkbox
                                    checked={activities.includes("BBQ_MIDI")}
                                    onChange={() => toggleActivity("BBQ_MIDI")}
                                    label={
                                        <>
                                            <strong>14h30</strong> BBQ
                                        </>
                                    }
                                />
                            </div>
                        </fieldset>
                    )}

                    {/* Q3 — Boat */}
                    {someoneAttending && descente && (
                        <fieldset className={styles.fieldset}>
                            <legend className={styles.legend}>
                                As-tu un bateau ?
                            </legend>
                            <div className={styles.optionList}>
                                <Radio
                                    name="boat"
                                    value="has_boat"
                                    checked={boatChoice === "has_boat"}
                                    onChange={() => setBoatChoice("has_boat")}
                                    label="J’ai un/des bateau(x) gonflable(s)"
                                />
                                <Radio
                                    name="boat"
                                    value="needs_spot"
                                    checked={boatChoice === "needs_spot"}
                                    onChange={() => setBoatChoice("needs_spot")}
                                    label="J’ai besoin d’une/plusieurs place(s) dans un bateau gonflable"
                                />
                            </div>
                        </fieldset>
                    )}

                    {/* Q4 — Available spots */}
                    {someoneAttending &&
                        descente &&
                        boatChoice === "has_boat" && (
                            <fieldset className={styles.fieldset}>
                                <legend className={styles.legend}>
                                    Combien de places sont dispo dans ton bateau
                                    ?
                                </legend>
                                <NumberInput
                                    value={availableSpots}
                                    onChange={setAvailableSpots}
                                    min={0}
                                    max={12}
                                />
                            </fieldset>
                        )}

                    {/* Q5 — Needed spots */}
                    {someoneAttending &&
                        descente &&
                        boatChoice === "needs_spot" && (
                            <fieldset className={styles.fieldset}>
                                <legend className={styles.legend}>
                                    Combien de places as-tu besoin dans un
                                    bateau ?
                                </legend>
                                <NumberInput
                                    value={neededSpots}
                                    onChange={setNeededSpots}
                                    min={0}
                                    max={4}
                                />
                            </fieldset>
                        )}
                </section>

                <div className={styles.submitRow}>
                    <Button
                        type="submit"
                        disabled={attendance === null || isPending}
                    >
                        {isPending ? "envoi…" : "envoyer"}
                    </Button>
                    {onCancel && (
                        <button
                            type="button"
                            className={styles.cancel}
                            onClick={onCancel}
                            disabled={isPending}
                        >
                            annuler
                        </button>
                    )}
                </div>
            </form>
        </InviteShell>
    )
}
