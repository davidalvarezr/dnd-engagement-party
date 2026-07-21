import styles from "./WavyDivider.module.css"

type Props = {
    flip?: boolean
}

/**
 * Approximation of the hand-drawn squiggle that runs through the Figma mock
 * (docs/design/whole-page.png did not export as its own asset, only rasterized
 * into the full-page mock, so this is a redrawn stand-in, not a 1:1 trace).
 */
export function WavyDivider({ flip = false }: Props) {
    return (
        <svg
            className={styles.wave}
            style={flip ? { transform: "scaleX(-1)" } : undefined}
            viewBox="0 0 400 100"
            preserveAspectRatio="none"
            role="presentation"
            aria-hidden="true"
        >
            <path
                d="M 0 20 C 100 20, 100 80, 200 80 S 300 20, 400 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    )
}
