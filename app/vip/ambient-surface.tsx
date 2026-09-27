"use client";

import { useId, useState, useSyncExternalStore, type ReactNode } from "react";
import styles from "./ambient-surface.module.css";

const motionQuery = "(prefers-reduced-motion: reduce)";

function subscribeMotionPreference(onChange: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia(motionQuery).matches;
}

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

const getVisibility = () => document.visibilityState === "visible";
// Keep the server-rendered surface still until the browser preference is known.
const getServerReducedMotion = () => true;
const getServerVisibility = () => false;

export function AmbientSurface({ children, className }: { children: ReactNode; className?: string }) {
  const motionDescriptionId = useId();
  const [enabled, setEnabled] = useState(true);
  const reducedMotion = useSyncExternalStore(subscribeMotionPreference, getReducedMotion, getServerReducedMotion);
  const visible = useSyncExternalStore(subscribeVisibility, getVisibility, getServerVisibility);
  const playing = enabled && !reducedMotion && visible;

  return (
    <div className={`${styles.surface}${className ? ` ${className}` : ""}`} data-ambient-playing={playing}>
      <div className={styles.decoration} aria-hidden="true">
        <div className={styles.viewport}>
          <div className={`${styles.drift} ${styles.left}`} />
          <div className={`${styles.drift} ${styles.right}`} />
        </div>
      </div>
      <button
        type="button"
        className={styles.toggle}
        aria-label="背景动效"
        aria-describedby={reducedMotion ? motionDescriptionId : undefined}
        aria-pressed={playing}
        disabled={reducedMotion}
        title={reducedMotion ? "已遵循系统减少动态效果设置" : enabled ? "暂停背景动效" : "播放背景动效"}
        onClick={() => setEnabled(previous => !previous)}
      >
        <span>{reducedMotion ? "动效已关闭 · 系统设置" : "背景动效"}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" fill="currentColor">
          {playing ? <path d="M3 2h2v8H3zm4 0h2v8H7z" /> : <path d="M4 2.5v7L9 6z" />}
        </svg>
        {reducedMotion ? <span id={motionDescriptionId} className={styles.srOnly}>已遵循系统减少动态效果设置</span> : null}
      </button>
      {children}
    </div>
  );
}
