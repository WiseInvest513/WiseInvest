"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Info, Landmark, ReceiptText, X } from "lucide-react";
import type { Perks2FeeDetails } from "../data";
import styles from "./fee-details-dialog.module.css";

export function FeeDetailsDialog({
  details,
  productTitle,
  variant = "inline",
}: {
  details: Perks2FeeDetails;
  productTitle: string;
  variant?: "inline" | "panel";
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={
            variant === "panel"
              ? "flex min-h-[92px] w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-gradient-to-br from-amber-50 via-white to-orange-50 px-4 py-4 text-base font-black text-amber-700 shadow-inner shadow-white/70 transition-all hover:border-amber-400 hover:from-amber-100 hover:to-orange-100 dark:border-amber-800/60 dark:from-amber-950/20 dark:via-slate-950 dark:to-orange-950/20 dark:text-amber-300 dark:hover:bg-amber-900/20"
              : "inline-flex items-center justify-center gap-1 rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[10px] font-black text-amber-700 transition-colors hover:border-amber-300 hover:bg-amber-50 dark:border-amber-800/60 dark:bg-slate-950 dark:text-amber-300 dark:hover:bg-amber-900/20"
          }
        >
          <ReceiptText className={variant === "panel" ? "h-5 w-5" : "h-3 w-3"} aria-hidden="true" />
          费率详情
        </button>
      </Dialog.Trigger>

      {/* Escape the cards' transform / backdrop-filter containing blocks. */}
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.dialog}>
          <header className={styles.header}>
            <span className={styles.brandIcon}><Landmark size={22} strokeWidth={1.6} aria-hidden="true" /></span>
            <div className={styles.heading}>
              <p className={styles.eyebrow}>{productTitle}</p>
              <Dialog.Title className={styles.title}>{details.title}</Dialog.Title>
              <Dialog.Description className={styles.subtitle}>{details.subtitle ?? "查看各类交易费率与适用条件。"}</Dialog.Description>
            </div>
            <Dialog.Close className={styles.close} aria-label="关闭费率详情">
              <X size={18} aria-hidden="true" />
            </Dialog.Close>
          </header>

          <div className={styles.body} role="region" aria-label="费率明细内容" tabIndex={0}>
            {details.highlight && (
              <section className={styles.highlight} aria-label="开户权益">
                <div className={styles.highlightHeading}>
                  <h3>{details.highlight.label}</h3>
                  <span className={styles.productTag}>{details.highlight.value}</span>
                </div>
                {details.highlight.note && <p>{details.highlight.note}</p>}
              </section>
            )}

            <section aria-label="各类交易费率" className={styles.rates}>
              <div className={styles.columnLabels} aria-hidden="true"><span>交易品种</span><span>费率与适用条件</span></div>
              <dl>
                {details.rows.map((row, index) => (
                  <div key={`${row.label}-${index}`} className={styles.row} data-featured={Boolean(row.badge)}>
                    <dt>
                      <span>{row.label}</span>
                      {row.badge && <span className={styles.badge}>{row.badge}</span>}
                    </dt>
                    <dd>
                      <strong>{row.value}</strong>
                      {row.note && <span className={styles.note}>{row.note}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            {details.notice && <p className={styles.notice}><Info size={16} aria-hidden="true" /><span>{details.notice}</span></p>}
          </div>

          <footer className={styles.footer}>
            <Dialog.Close className={styles.done}>关闭</Dialog.Close>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
