import "dotenv/config"
import { writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { couples, singles } from "../prisma/guests-data"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = join(__dirname, "../prisma/invitee-list.csv")

// Minimal CSV quote-escaping: wrap a field in quotes (doubling any quotes
// inside it) only if it contains a comma, quote, or newline.
function csvField(value: string): string {
    if (/[",\n]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`
    }
    return value
}

function csvRow(fields: string[]): string {
    return fields.map(csvField).join(",")
}

function main() {
    const lines = ["guest1,guest2,code"]

    for (const { partners, code } of couples) {
        const [nameA, nameB] = partners
        lines.push(csvRow([nameA, nameB, code]))
    }
    for (const { name, code } of singles) {
        lines.push(csvRow([name, "", code]))
    }

    writeFileSync(OUTPUT_PATH, `${lines.join("\n")}\n`, "utf-8")

    console.log(
        `Wrote ${couples.length + singles.length} invitee row(s) to ${OUTPUT_PATH}`,
    )
}

main()
