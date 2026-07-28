"use client"

import { useState, useTransition } from "react"
import type { getInvitationByCode } from "@/lib/invitations"
import type { BoatStats } from "./EventInfo"
import { ReadMode } from "./ReadMode"
import { type SubmitPayload, UpsertForm } from "./UpsertForm"

type Invitation = NonNullable<Awaited<ReturnType<typeof getInvitationByCode>>>

type Props = {
    invitation: Invitation
    boatStats: BoatStats
}

export function InviteForm({ invitation: initial, boatStats }: Props) {
    const [invitation, setInvitation] = useState(initial)
    const [isEditing, setIsEditing] = useState(false)
    const [isPending, startTransition] = useTransition()

    function handleSubmit(data: SubmitPayload) {
        startTransition(async () => {
            const response = await fetch(
                `/api/invitations/${invitation.code}/response`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                },
            )
            const updated = await response.json()
            setInvitation(updated)
            setIsEditing(false)
        })
    }

    if (invitation.respondedAt && !isEditing) {
        return (
            <ReadMode
                invitation={invitation}
                boatStats={boatStats}
                onEdit={() => setIsEditing(true)}
            />
        )
    }

    return (
        <UpsertForm
            invitation={invitation}
            boatStats={boatStats}
            onSubmit={handleSubmit}
            isPending={isPending}
            onCancel={
                invitation.respondedAt ? () => setIsEditing(false) : undefined
            }
        />
    )
}
