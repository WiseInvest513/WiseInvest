import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import styles from "./home.module.css";

export const wiseSites = {
  etf: "https://www.wise-etf.com/",
  chain: "https://chain.wise-invest.org/",
  ipo: "https://www.wise-ipo.com/",
  crypto: "https://crypto.wise-invest.org/",
  sim: "https://www.wise-sim.org/",
  witness: "https://www.wise-witness.com/",
  hold: "https://www.wise-hold.com/",
  vip: "https://vip.wise-invest.org/join",
} as const;

export function HomeAction({ href, children, primary = false, icon }: {
  href: string;
  children: ReactNode;
  primary?: boolean;
  icon?: LucideIcon;
}) {
  const external = href.startsWith("https://");
  const Icon = icon ?? (external ? ArrowUpRight : ArrowRight);
  const className = primary ? styles.primaryAction : styles.textAction;
  const content = <>{children}<Icon size={18} strokeWidth={1.8} aria-hidden="true" /></>;
  if (external) return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{content}</a>;
  if (href.startsWith("#")) return <a href={href} className={className}>{content}</a>;
  return <Link href={href} prefetch={false} className={className}>{content}</Link>;
}

export function ChapterMarker({ number, children }: { number: string; children: ReactNode }) {
  return <p className={styles.chapterMarker}>{number} <span aria-hidden="true">/</span> {children}</p>;
}

export function LearningSteps({ steps }: { steps: readonly string[] }) {
  return <ol className={styles.steps}>
    {steps.map((step, index) => <li key={step}>
      <span className={styles.stepNumber} aria-hidden="true">{index + 1}</span>
      <span>{step}</span>
    </li>)}
  </ol>;
}

export type HomeTool = { label: string; href: string; icon?: LucideIcon };

export function ToolLinks({ title, items }: { title?: string; items: readonly HomeTool[] }) {
  return <div className={styles.toolBar}>
    {title && <h3>{title}</h3>}
    <div className={styles.toolLinks}>
      {items.map(({ label, href, icon: Icon }) => <div className={styles.toolLink} key={href}>
        {Icon && <Icon size={26} strokeWidth={1.5} aria-hidden="true" />}
        <HomeAction href={href}>{label}</HomeAction>
      </div>)}
    </div>
  </div>;
}

export function ChapterTransition({ href, number, children }: { href: string; number: string; children: ReactNode }) {
  return <a className={styles.chapterTransition} href={href}>
    <span>{number} <span aria-hidden="true">/</span> {children}</span><ArrowRight size={18} aria-hidden="true" />
  </a>;
}
