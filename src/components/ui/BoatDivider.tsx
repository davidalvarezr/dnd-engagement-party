import Image from "next/image"
import styles from "./BoatDivider.module.css"

type Props = {
    align?: "center" | "left" | "right"
    className?: string
}

export function BoatDivider({ align = "center", className }: Props) {
    return (
        <Image
            src="/images/invite/boat.png"
            alt=""
            width={211}
            height={134}
            aria-hidden
            className={`${styles.boat} ${styles[align]} ${className ?? ""}`}
        />
    )
}
