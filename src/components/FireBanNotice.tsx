"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import styles from "./FireBanNotice.module.css"

const STORAGE_KEY = "fire-ban-notice-dismissed-v1"

export function FireBanNotice() {
    const [isOpen, setIsOpen] = useState(false)
    const dialogRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        try {
            if (window.localStorage.getItem(STORAGE_KEY) !== "1") {
                setIsOpen(true)
            }
        } catch {
            setIsOpen(true)
        }
    }, [])

    const dismiss = useCallback(() => {
        setIsOpen(false)
        try {
            window.localStorage.setItem(STORAGE_KEY, "1")
        } catch {
            // localStorage unavailable — nothing to persist, the notice will
            // simply reappear next visit
        }
    }, [])

    useEffect(() => {
        if (!isOpen) return

        dialogRef.current?.focus()
        document.body.style.overflow = "hidden"

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                dismiss()
                return
            }
            if (event.key !== "Tab") return

            const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
            )
            if (!focusable || focusable.length === 0) return

            const first = focusable[0]
            const last = focusable[focusable.length - 1]

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first.focus()
            }
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => {
            document.removeEventListener("keydown", handleKeyDown)
            document.body.style.overflow = ""
        }
    }, [isOpen, dismiss])

    if (!isOpen) return null

    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: click-to-dismiss backdrop; keyboard users close via Escape or the button below
        <div className={styles.backdrop} role="presentation" onClick={dismiss}>
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: only stops the backdrop's click-to-dismiss from bubbling, not itself an interactive control */}
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="fire-ban-title"
                aria-describedby="fire-ban-body"
                tabIndex={-1}
                className={styles.dialog}
                onClick={(event) => event.stopPropagation()}
            >
                <div className={styles.grabber} aria-hidden="true" />

                <button
                    type="button"
                    className={styles.closeButton}
                    onClick={dismiss}
                    aria-label="Fermer"
                >
                    <span aria-hidden="true">×</span>
                </button>

                <p className={styles.badge} aria-hidden="true">
                    🚫🔥
                </p>

                <h2 id="fire-ban-title" className={styles.title}>
                    Info canicule
                </h2>

                <p id="fire-ban-body" className={styles.body}>
                    Avec la chaleur et la sécheresse, tout feu et barbecue est
                    actuellement interdit dans le canton de Genève. Pensez à
                    bien vous hydrater !
                </p>

                <button
                    type="button"
                    className={styles.confirmButton}
                    onClick={dismiss}
                >
                    J’ai compris
                </button>
            </div>
        </div>
    )
}
