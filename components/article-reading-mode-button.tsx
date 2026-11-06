"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import styles from "./article-reading-mode.module.css";

type ReadingPosition = { element: HTMLElement; top: number };

/** Change the existing reader, keeping its images, access gate and DOM intact. */
export function ArticleReadingModeButton() {
  const [active, setActive] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const positionRef = useRef<ReadingPosition | null>(null);

  const rememberPosition = useCallback(() => {
    const reader = buttonRef.current?.closest<HTMLElement>("[data-article-reader]");
    const blocks = reader?.querySelectorAll<HTMLElement>("article > header h1, [data-reading-body] > *");
    positionRef.current = null;
    for (const element of blocks ?? []) {
      const rect = element.getBoundingClientRect();
      if (rect.height > 0 && rect.bottom > 100 && rect.top < window.innerHeight) {
        positionRef.current = { element, top: Math.min(rect.top, 128) };
        break;
      }
    }
  }, []);

  useLayoutEffect(() => {
    const reader = buttonRef.current?.closest<HTMLElement>("[data-article-reader]");
    const pane = reader?.querySelector<HTMLElement>('[aria-label="文章内容"]');
    if (!reader || !pane) return;
    if (active) reader.dataset.immersive = "true";
    else delete reader.dataset.immersive;

    const position = positionRef.current;
    if (position?.element.isConnected) {
      // Desktop already scrolls inside the pane; mobile normally scrolls the page.
      const scroller = active || window.matchMedia("(min-width: 768px)").matches ? pane : window;
      scroller.scrollBy({ top: position.element.getBoundingClientRect().top - position.top, behavior: "instant" });
      positionRef.current = null;
      buttonRef.current?.focus({ preventScroll: true });
    }
    return () => { delete reader.dataset.immersive; };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      // An image viewer or access dialog owns Escape until it has closed.
      if (document.querySelector('dialog[open], [role="dialog"]')) return;
      event.preventDefault();
      rememberPosition();
      setActive(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, rememberPosition]);

  return (
    <button
      ref={buttonRef}
      type="button"
      data-reading-toggle
      aria-pressed={active}
      aria-label={active ? "退出全屏阅读" : "进入全屏阅读"}
      title={active ? "退出全屏阅读（Esc）" : "全屏阅读：隐藏导航与侧栏"}
      className={styles.toggle}
      onClick={() => { rememberPosition(); setActive(value => !value); }}
    >
      {active ? <Minimize2 size={16} aria-hidden="true" /> : <Maximize2 size={16} aria-hidden="true" />}
      <span>{active ? "退出全屏" : "全屏阅读"}</span>
      {active ? <kbd className={styles.escapeHint}>Esc</kbd> : null}
    </button>
  );
}
