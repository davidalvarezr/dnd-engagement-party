import typography from "@/styles/typography.module.css"
import { BoatSpotsBars } from "./BoatSpotsBars"
import styles from "./EventInfo.module.css"
import { BoatDivider } from "./ui/BoatDivider"
import { WavyDivider } from "./ui/WavyDivider"

export type BoatStats = {
    availableSpots: number
    neededSpots: number
    totalAttendingGuests: number
}

type Props = {
    boatStats: BoatStats
}

export function EventInfo({ boatStats }: Props) {
    return (
        <>
            <WavyDivider />

            <section className={styles.section}>
                <h3 className={`${typography.h3} ${styles.headingLeft}`}>
                    infos
                </h3>
                <p className={`${typography.p} ${styles.headingLeft}`}>
                    <strong>Dimanche 16 Août</strong>
                </p>
                <h4 className={`${typography.h4} ${styles.headingLeft}`}>
                    horaires
                </h4>

                <div className={styles.scheduleRow}>
                    <div className={styles.leftParagraphs}>
                        <p className={typography.p}>
                            Descente du Rhône : <strong>11h00</strong>
                        </p>
                        <p className={typography.p}>
                            BBQ : à partir de <strong>14h30</strong>
                        </p>
                    </div>
                    <BoatDivider align="right" />
                </div>

                <BoatSpotsBars {...boatStats} />

                <p className={typography.p}>
                    Si vous nous rejoignez pour le BBQ, on risque d’avoir un peu
                    de retard si le courant est faible alors pas de stress pour
                    être à l’heure :)
                </p>
            </section>

            <WavyDivider flip />

            <section className={styles.section}>
                <div className={styles.lieuHeader}>
                    <BoatDivider align="left" />
                    <h4 className={typography.h4}>lieu</h4>
                </div>

                <div className={styles.paragraphsRight}>
                    <p className={typography.p}>
                        Début de la Descente du Rhône :
                    </p>
                    <p className={typography.p}>
                        <strong>
                            <a
                                href="https://maps.app.goo.gl/QZDumV7cN2mvUdLX9"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.link}
                            >
                                46°12'12.8"N 6°07'58.1"E
                            </a>
                        </strong>
                    </p>
                    <p className={typography.p}>
                        Arrêt{" "}
                        <strong>
                            <a
                                href="https://maps.app.goo.gl/36EVfKpL1bjwogUt5"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.link}
                            >
                                Paladium
                            </a>
                        </strong>
                        , Genève
                    </p>
                    <p className={typography.p}>
                        BBQ :<br />
                        <strong>
                            <a
                                href="https://maps.app.goo.gl/PqiaJnRtwaJ9UTdS8"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.link}
                            >
                                Le Deck, Chem. du Moulin des Frères 43
                            </a>
                        </strong>
                        , 1214 Vernier
                    </p>
                    <p className={typography.p}>
                        Arrêt{" "}
                        <strong>
                            <a
                                href="https://maps.app.goo.gl/Re5MYfZVxKHkLmEY7"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.link}
                            >
                                Vernier, De Sauvage
                            </a>
                        </strong>
                        , Genève
                    </p>
                    <p className={typography.p}>
                        Ou l’arrêt{" "}
                        <strong>
                            <a
                                href="https://maps.app.goo.gl/qVZdimWisDPjBxry8"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.link}
                            >
                                Vernier, Barde
                            </a>
                        </strong>
                    </p>
                </div>
            </section>
        </>
    )
}
