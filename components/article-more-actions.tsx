"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import styles from "./article-more-actions.module.css";

/** A disclosure on phones; the same controls stay inline on desktop. */
export function ArticleMoreActions({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return <div ref={rootRef} className={styles.more} onBlur={event => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }} onKeyDown={event => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus({ preventScroll: true });
    }
  }}>
    <button ref={triggerRef} type="button" className={styles.trigger} aria-label="更多文章操作" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(value => !value)}>
      <MoreHorizontal size={16} aria-hidden="true" /><span>更多</span>
    </button>
    <div id={panelId} className={styles.panel} data-open={open} role="group" aria-label="分享与导出">{children}</div>
  </div>;
}
