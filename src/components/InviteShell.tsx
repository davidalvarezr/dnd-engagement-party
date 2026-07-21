import Image from "next/image"
import type { ReactNode } from "react"
import styles from "./InviteShell.module.css"

type Props = {
    children: ReactNode
}

export function InviteShell({ children }: Props) {
    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <Image
                    src="/images/invite/flowers.png"
                    alt=""
                    width={402}
                    height={473}
                    className={styles.flowersTop}
                    aria-hidden
                    priority
                />
                <div className={styles.title}>
                    <h1 className={styles.h1}>d &amp; d</h1>
                    <h2 className={styles.h2}>fête de fiançialles</h2>
                </div>
            </header>

            <div className={styles.content}>{children}</div>

            <footer className={styles.footer}>
                <Image
                    src="/images/invite/flowers-bottom.png"
                    alt=""
                    width={790}
                    height={394}
                    className={styles.flowersBottom}
                    aria-hidden
                />
            </footer>
        </div>
    )
}
