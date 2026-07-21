import type { ButtonHTMLAttributes } from "react"
import styles from "./Button.module.css"

type Props = ButtonHTMLAttributes<HTMLButtonElement>

export function Button({ className, ...props }: Props) {
    return (
        <button className={`${styles.button} ${className ?? ""}`} {...props} />
    )
}
