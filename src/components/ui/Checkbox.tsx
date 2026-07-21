import type { InputHTMLAttributes, ReactNode } from "react"
import styles from "./Checkbox.module.css"

type Props = InputHTMLAttributes<HTMLInputElement> & {
    label: ReactNode
}

export function Checkbox({ label, className, ...props }: Props) {
    return (
        <label className={styles.label}>
            <input
                type="checkbox"
                className={`${styles.input} ${className ?? ""}`}
                {...props}
            />
            {label}
        </label>
    )
}
