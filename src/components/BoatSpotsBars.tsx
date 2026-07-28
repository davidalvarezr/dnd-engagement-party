import typography from "@/styles/typography.module.css"
import styles from "./BoatSpotsBars.module.css"

type Props = {
    availableSpots: number
    neededSpots: number
    totalAttendingGuests: number
}

export function pct(value: number, total: number) {
    return total > 0 ? Math.min(100, (value / total) * 100) : 0
}

// A boat's own passengers aren't a shortfall, so "needed" only turns
// worrying relative to how much has actually been offered: green while
// there's comfortable slack, orange once it's a tight fit, red once demand
// outstrips supply.
export function status(
    available: number,
    needed: number,
): "green" | "orange" | "red" {
    if (needed > available) return "red"
    if (available === 0) return "green"
    return needed / available > 0.8 ? "orange" : "green"
}

export function BoatSpotsBars({
    availableSpots,
    neededSpots,
    totalAttendingGuests,
}: Props) {
    const barStatus = status(availableSpots, neededSpots)

    return (
        <div className={styles.bars}>
            <div className={styles.bar}>
                <p className={typography.p}>Besoin de {neededSpots} place(s)</p>
                <div className={styles.track}>
                    <div
                        className={`${styles.fill} ${styles[barStatus]}`}
                        style={{
                            transform: `scaleX(${pct(neededSpots, totalAttendingGuests) / 100})`,
                        }}
                    />
                </div>
            </div>

            <div className={styles.bar}>
                <p className={typography.p}>
                    {availableSpots} place(s) disponible(s)
                </p>
                <div className={styles.track}>
                    <div
                        className={`${styles.fill} ${styles[barStatus]}`}
                        style={{
                            transform: `scaleX(${pct(availableSpots, totalAttendingGuests) / 100})`,
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
