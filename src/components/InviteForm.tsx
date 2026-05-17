"use client"

import { useOptimistic, useState } from "react"
import type { getInvitationByCode } from "@/lib/invitations"
import { UpsertForm, type SubmitPayload } from "./UpsertForm"
import { ReadMode } from "./ReadMode"

type Invitation = NonNullable<Awaited<ReturnType<typeof getInvitationByCode>>>

type Props = {
  invitation: Invitation
}

export function InviteForm({ invitation: initial }: Props) {
  const [invitation, setInvitation] = useState(initial)
  const [optimisticInvitation, setOptimistic] = useOptimistic(invitation)
  const [isEditing, setIsEditing] = useState(false)

  async function handleSubmit(data: SubmitPayload) {
    setOptimistic({ ...invitation, respondedAt: new Date() })
    setIsEditing(false)

    const response = await fetch(`/api/invitations/${invitation.code}/response`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const updated = await response.json()
    setInvitation(updated)
  }

  if (optimisticInvitation.respondedAt && !isEditing) {
    return <ReadMode invitation={optimisticInvitation} onEdit={() => setIsEditing(true)} />
  }

  return (
    <UpsertForm
      invitation={invitation}
      onSubmit={handleSubmit}
      onCancel={invitation.respondedAt ? () => setIsEditing(false) : undefined}
    />
  )
}
