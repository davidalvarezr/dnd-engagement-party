import { mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const __dirname = dirname(fileURLToPath(import.meta.url))

const HEART_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
    <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill="#e2434f"
    />
</svg>
`

const BACKGROUND = "#f6f8f3"
const OUTPUT_DIR = join(__dirname, "..", "public", "icons")

async function renderIcon(size: number, heartScale: number, filename: string) {
    const heartSize = Math.round(size * heartScale)
    const heart = await sharp(Buffer.from(HEART_SVG))
        .resize(heartSize, heartSize)
        .png()
        .toBuffer()

    await sharp({
        create: {
            width: size,
            height: size,
            channels: 4,
            background: BACKGROUND,
        },
    })
        .composite([{ input: heart, gravity: "center" }])
        .png()
        .toFile(join(OUTPUT_DIR, filename))

    console.log(`✅ ${filename}`)
}

async function main() {
    mkdirSync(OUTPUT_DIR, { recursive: true })

    // Regular icons: generous padding, background shows as a soft frame.
    await renderIcon(192, 0.6, "icon-192.png")
    await renderIcon(512, 0.6, "icon-512.png")

    // Maskable: heart must sit inside the ~80%-diameter safe zone since
    // the OS can crop the background into any shape (circle, squircle...).
    await renderIcon(512, 0.45, "icon-512-maskable.png")

    // Apple touch icon: iOS applies its own rounding, wants an opaque square.
    await renderIcon(180, 0.6, "apple-touch-icon.png")

    console.log("\nDone — PWA icons saved to public/icons/")
}

main()
