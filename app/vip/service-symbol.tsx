import type { ReactNode } from 'react'
import styles from './service-symbol.module.css'

type ServiceSymbolKind = 'discussion' | 'calendar' | 'live'

// Static artwork stays on the server; these decorative marks add no client code.
const artwork = {
  discussion: (
    <>
      <path
        className={styles.back}
        d="M24 7h11a7 7 0 0 1 7 7v7a7 7 0 0 1-7 7h-1l-5 4v-4h-5a7 7 0 0 1-7-7v-7a7 7 0 0 1 7-7Z"
      />
      <path
        className={styles.ink}
        d="M12 15h16a8 8 0 0 1 8 8v7a8 8 0 0 1-8 8h-9l-7 5v-5a8 8 0 0 1-8-8v-7a8 8 0 0 1 8-8Z"
      />
      <path className={styles.shine} d="M12 16h16a7 7 0 0 1 7 7v1H5v-1a7 7 0 0 1 7-7Z" />
      <circle className={styles.paper} cx="13" cy="27" r="2" />
      <circle className={styles.paper} cx="20" cy="27" r="2" />
      <circle className={styles.gold} cx="27" cy="27" r="2" />
      <path className={styles.gold} d="M27 11h8a2 2 0 0 1 0 4h-8a2 2 0 0 1 0-4Z" />
    </>
  ),
  calendar: (
    <>
      <rect className={styles.back} x="8" y="10" width="34" height="32" rx="7" transform="rotate(6 25 26)" />
      <rect className={styles.ink} x="5" y="7" width="36" height="33" rx="7" />
      <path className={styles.paper} d="M6 19h34v14a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6V19Z" />
      <path className={styles.shine} d="M12 8h22a6 6 0 0 1 6 6v1H6v-1a6 6 0 0 1 6-6Z" />
      <rect className={styles.back} x="13" y="4" width="3" height="9" rx="1.5" />
      <rect className={styles.back} x="30" y="4" width="3" height="9" rx="1.5" />
      <path
        className={styles.marks}
        d="M10 23h2v2h-2zm4 0h2v2h-2zm4 0h2v2h-2zm4 0h2v2h-2zm4 0h2v2h-2zm4 0h2v2h-2zM10 29h2v2h-2zm4 0h2v2h-2zm4 0h2v2h-2zm4 0h2v2h-2zm4 0h2v2h-2zm4 0h2v2h-2z"
      />
      <rect className={styles.gold} x="33" y="21" width="5" height="13" rx="2.5" />
      <circle className={styles.paper} cx="35.5" cy="24" r="1" />
      <circle className={styles.paper} cx="35.5" cy="30" r="1" />
    </>
  ),
  live: (
    <>
      <path
        className={styles.back}
        d="M19 19h17a7 7 0 0 1 7 7v6a7 7 0 0 1-7 7h-2v5l-7-5h-8a7 7 0 0 1-7-7v-6a7 7 0 0 1 7-7Z"
      />
      <rect className={styles.ink} x="4" y="8" width="34" height="26" rx="8" />
      <path className={styles.shine} d="M12 9h18a7 7 0 0 1 7 7v1H5v-1a7 7 0 0 1 7-7Z" />
      <path className={styles.paper} d="M18 15.5a1.2 1.2 0 0 1 1.8-1L28 20a1.2 1.2 0 0 1 0 2l-8.2 5.5a1.2 1.2 0 0 1-1.8-1v-11Z" />
      <circle className={styles.paper} cx="37" cy="10" r="5.5" />
      <circle className={styles.gold} cx="37" cy="10" r="3.5" />
    </>
  ),
} satisfies Record<ServiceSymbolKind, ReactNode>

export function ServiceSymbol({ kind }: { kind: ServiceSymbolKind }) {
  return (
    <span className={styles.symbol} data-kind={kind} aria-hidden="true">
      <span className={styles.face}>
        <svg className={styles.artwork} width="38" height="38" viewBox="0 0 48 48" fill="none" focusable="false">
          {artwork[kind]}
        </svg>
      </span>
    </span>
  )
}
