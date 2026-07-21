import styles from "./NumberInput.module.css"

type Props = {
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
}

export function NumberInput({ value, onChange, min = 0, max = 99 }: Props) {
    return (
        <div className={styles.wrapper}>
            <button
                type="button"
                className={styles.stepper}
                onClick={() => onChange(Math.max(min, value - 1))}
                disabled={value <= min}
                aria-label="Diminuer"
            >
                −
            </button>
            <span className={styles.value}>{value}</span>
            <button
                type="button"
                className={styles.stepper}
                onClick={() => onChange(Math.min(max, value + 1))}
                disabled={value >= max}
                aria-label="Augmenter"
            >
                +
            </button>
        </div>
    )
}
