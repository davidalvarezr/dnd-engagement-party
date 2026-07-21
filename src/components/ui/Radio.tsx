import type { InputHTMLAttributes, ReactNode } from "react"
import styles from "./Radio.module.css"

type Props = InputHTMLAttributes<HTMLInputElement> & {
    label: ReactNode
}

export function Radio({ label, className, ...props }: Props) {
    return (
        <label className={styles.label}>
            <input
                type="radio"
                className={`${styles.input} ${className ?? ""}`}
                {...props}
            />
            {label}
        </label>
    )
}
