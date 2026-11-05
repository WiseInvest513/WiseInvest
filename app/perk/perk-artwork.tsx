import styles from "./overview.module.css";

export type PerkArtworkName = "exchanges" | "brokers" | "banking" | "cards" | "ipo" | "tools" | "gift" | "crown";

export function PerkArtwork({ name, className = "" }: { name: PerkArtworkName; className?: string }) {
  return <span aria-hidden="true" data-artwork={name} className={`${styles.artwork} ${className}`} />;
}
