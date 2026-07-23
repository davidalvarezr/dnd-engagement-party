import { requireApiKey } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type ImportRow = {
    line: number
    guest1: string
    guest2: string
    code: string
}

type RowStatus = "create" | "skip" | "error"

type RowResult = ImportRow & {
    status: RowStatus
    reason?: string
}

type Totals = { create: number; skip: number; error: number }

function normalizeRow(row: Partial<ImportRow>, index: number): ImportRow {
    return {
        line: typeof row.line === "number" ? row.line : index + 2,
        guest1: String(row.guest1 ?? "").trim(),
        guest2: String(row.guest2 ?? "").trim(),
        code: String(row.code ?? "")
            .trim()
            .toLowerCase(),
    }
}

function namesOf(row: ImportRow): string[] {
    return [row.guest1, row.guest2].filter((name) => name.length > 0)
}

function nameSetKey(names: string[]): string {
    return JSON.stringify([...names].sort())
}

function setError(row: RowResult, reason: string) {
    row.status = "error"
    row.reason = reason
}

type InvitationWithGuests = {
    id: number
    code: string
    guests: { id: number; name: string }[]
}

async function classifyRows(rows: ImportRow[]): Promise<RowResult[]> {
    const results: RowResult[] = rows.map((row) => ({
        ...row,
        status: "create" as RowStatus,
    }))

    // A. Structural per-row checks.
    for (const row of results) {
        if (!row.guest1) {
            setError(row, "guest1 is required")
            continue
        }
        if (row.guest2 && row.guest1 === row.guest2) {
            setError(row, "guest1 and guest2 must be different")
            continue
        }
        if (row.code && !UUID_REGEX.test(row.code)) {
            setError(row, "invalid code format")
        }
    }

    // B. File-internal duplicate names.
    const nameLines = new Map<string, number[]>()
    for (const row of results) {
        for (const name of namesOf(row)) {
            const lines = nameLines.get(name) ?? []
            lines.push(row.line)
            nameLines.set(name, lines)
        }
    }
    for (const row of results) {
        if (row.status === "error") continue
        for (const name of namesOf(row)) {
            const lines = nameLines.get(name) ?? []
            if (lines.length > 1) {
                const other =
                    lines.find((line) => line !== row.line) ?? lines[0]
                setError(
                    row,
                    `duplicate name in file: ${name} (also line ${other})`,
                )
                break
            }
        }
    }

    // B. File-internal duplicate codes.
    const codeLines = new Map<string, number[]>()
    for (const row of results) {
        if (row.code) {
            const lines = codeLines.get(row.code) ?? []
            lines.push(row.line)
            codeLines.set(row.code, lines)
        }
    }
    for (const row of results) {
        if (row.status === "error") continue
        if (row.code) {
            const lines = codeLines.get(row.code) ?? []
            if (lines.length > 1) {
                const other =
                    lines.find((line) => line !== row.line) ?? lines[0]
                setError(
                    row,
                    `duplicate code in file: ${row.code} (also line ${other})`,
                )
            }
        }
    }

    // C. DB comparison.
    const invitations = await prisma.invitation.findMany({
        include: { guests: true },
    })
    const codeToInv = new Map<string, InvitationWithGuests>(
        invitations.map((inv) => [inv.code.toLowerCase(), inv]),
    )
    const nameSetToInv = new Map<string, InvitationWithGuests>(
        invitations.map((inv) => [
            nameSetKey(inv.guests.map((g) => g.name.trim())),
            inv,
        ]),
    )
    const nameToInvId = new Map<string, number>()
    for (const inv of invitations) {
        for (const guest of inv.guests) {
            nameToInvId.set(guest.name.trim(), inv.id)
        }
    }

    for (const row of results) {
        if (row.status === "error") continue

        const names = namesOf(row)
        const key = nameSetKey(names)

        if (row.code && codeToInv.has(row.code)) {
            const inv = codeToInv.get(row.code)
            const invKey = nameSetKey(
                inv ? inv.guests.map((g) => g.name.trim()) : [],
            )
            if (invKey === key) {
                row.status = "skip"
            } else {
                setError(
                    row,
                    `code ${row.code} already exists with different names`,
                )
            }
            continue
        }

        if (nameSetToInv.has(key)) {
            row.status = "skip"
            continue
        }

        const conflictName = names.find((name) => nameToInvId.has(name))
        if (conflictName) {
            setError(
                row,
                `name already exists under a different invitation: ${conflictName}`,
            )
            continue
        }

        row.status = "create"
    }

    return results
}

function totalsOf(results: RowResult[]): Totals {
    const totals: Totals = { create: 0, skip: 0, error: 0 }
    for (const row of results) totals[row.status]++
    return totals
}

export async function POST(request: Request) {
    const unauthorized = requireApiKey(request)
    if (unauthorized) return unauthorized

    const body = await request.json().catch(() => null)
    if (!body || !Array.isArray(body.rows) || body.rows.length === 0) {
        return Response.json({ error: "rows is required" }, { status: 400 })
    }

    const dryRun = body.dryRun === true
    const rows = (body.rows as Partial<ImportRow>[]).map(normalizeRow)

    const results = await classifyRows(rows)
    const totals = totalsOf(results)

    if (dryRun) {
        return Response.json({ applied: false, rows: results, totals })
    }

    if (totals.error > 0) {
        return Response.json(
            { error: `cannot apply: ${totals.error} row(s) have errors` },
            { status: 400 },
        )
    }

    const created = await prisma.$transaction(async (tx) => {
        let count = 0
        for (const row of results) {
            if (row.status !== "create") continue

            const names = namesOf(row)
            const invitation = await tx.invitation.create({
                data: {
                    ...(row.code && { code: row.code }),
                    guests: { create: names.map((name) => ({ name })) },
                },
                include: { guests: true },
            })

            if (invitation.guests.length === 2) {
                const [a, b] = invitation.guests
                await tx.guest.update({
                    where: { id: a.id },
                    data: { partnerId: b.id },
                })
                await tx.guest.update({
                    where: { id: b.id },
                    data: { partnerId: a.id },
                })
            }

            count++
        }
        return count
    })

    return Response.json({ applied: true, rows: results, totals, created })
}
