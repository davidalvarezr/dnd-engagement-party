import "dotenv/config"
import { mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { toBuffer } from "qrcode"
import sharp from "sharp"
import { couples, singles } from "../prisma/guests-data"

const __dirname = dirname(fileURLToPath(import.meta.url))

const HOST_URL = process.env.HOST_URL
if (!HOST_URL) throw new Error("HOST_URL is not set in .env")

const QR_SIZE = 400
const LOGO_SIZE = Math.round(QR_SIZE * 0.25)
const OUTPUT_DIR = join(__dirname, "output")
const LOGO_PATH = join(__dirname, "qr-code-image-final.png")

mkdirSync(OUTPUT_DIR, { recursive: true })

async function generate(label: string, code: string) {
    const url = `${HOST_URL}/invite/${code}`
    const filename = join(
        OUTPUT_DIR,
        `${label.replace(/[^a-zA-Z0-9]/g, "_")}.png`,
    )

    const qrBuffer = await toBuffer(url, { type: "png", width: QR_SIZE })

    const logo = await sharp(LOGO_PATH).resize(LOGO_SIZE, LOGO_SIZE).toBuffer()

    await sharp(qrBuffer)
        .composite([{ input: logo, gravity: "center" }])
        .toFile(filename)

    console.log(`✅ ${label}`)
}

async function main() {
    for (const { code, partners } of couples) {
        await generate(partners.join(" & "), code)
    }
    for (const { code, name } of singles) {
        await generate(name, code)
    }
    console.log(
        `\nDone — ${couples.length + singles.length} QR codes saved to scripts/output/`,
    )
}

main().catch(console.error)
