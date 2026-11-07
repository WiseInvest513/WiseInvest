"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  clearSeriesProgress,
  getSeriesProgressSnapshot,
  isSeriesProgressDisabled,
  markSeriesArticleRead,
  readSeriesProgressIds,
  setSeriesProgressDisabled,
  type SeriesProgressSnapshot,
} from "@/lib/article-series-progress";
import type { ArticleSeries } from "@/lib/article-library";
import type { SeriesReadingState } from "@/lib/article-series";
import styles from "./series-reader.module.css";

export function getReadableSeriesArticleIds(
  series: Pick<ArticleSeries, "existingArticleId">,
  reading: Pick<SeriesReadingState, "chapters" | "existingHref">,
) {
  const ids = reading.chapters
    .filter(chapter => chapter.href && chapter.articleId)
    .map(chapter => chapter.articleId as string);
  if (series.existingArticleId && reading.existingHref && !ids.includes(series.existingArticleId)) {
    ids.unshift(series.existingArticleId);
  }
  return ids;
}

export function useReadableSeriesProgress(
  series: Pick<ArticleSeries, "kind" | "existingArticleId">,
  reading: Pick<SeriesReadingState, "chapters" | "existingHref">,
  articleId?: string,
  markCurrent = true,
) {
  const chapterKey = reading.chapters.map(chapter => `${chapter.articleId ?? ""}:${chapter.href ? "1" : "0"}`).join("|");
  const readableArticleIds = useMemo(
    () => getReadableSeriesArticleIds(series, reading),
    // chapterKey captures published chapter identity without depending on fresh array references.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series.existingArticleId, series.kind, reading.existingHref, chapterKey],
  );
  return useSeriesProgress({
    readableArticleIds,
    currentArticleId: articleId,
    unit: series.kind === "topic" ? "篇" : "课",
    markCurrent: markCurrent && Boolean(articleId),
  });
}


function browserStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function useSeriesProgress(options: {
  readableArticleIds: readonly string[];
  currentArticleId?: string;
  unit?: "课" | "篇";
  markCurrent?: boolean;
}) {
  const { readableArticleIds, currentArticleId, unit = "课", markCurrent = true } = options;
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [disabled, setDisabled] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storage = browserStorage();
    const off = isSeriesProgressDisabled(storage);
    setDisabled(off);
    setReadIds(off ? new Set() : readSeriesProgressIds(storage));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || disabled || !markCurrent || !currentArticleId) return;
    if (!readableArticleIds.includes(currentArticleId)) return;
    const next = markSeriesArticleRead(currentArticleId, browserStorage());
    setReadIds(current => {
      if (current.has(currentArticleId) && current.size === next.size) return current;
      const merged = new Set(next);
      if (current.size === merged.size && [...current].every(id => merged.has(id))) return current;
      return merged;
    });
  }, [ready, disabled, markCurrent, currentArticleId, readableArticleIds]);

  const snapshot = useMemo(
    () => getSeriesProgressSnapshot(readableArticleIds, readIds, currentArticleId, unit),
    [readableArticleIds, readIds, currentArticleId, unit],
  );

  const clear = useCallback(() => {
    clearSeriesProgress(browserStorage());
    setReadIds(new Set());
  }, []);

  const toggleDisabled = useCallback(() => {
    const storage = browserStorage();
    const next = !disabled;
    setSeriesProgressDisabled(next, storage);
    setDisabled(next);
    if (next) {
      clearSeriesProgress(storage);
      setReadIds(new Set());
    } else {
      setReadIds(readSeriesProgressIds(storage));
    }
  }, [disabled]);

  const isRead = useCallback((articleId?: string) => Boolean(articleId && readIds.has(articleId)), [readIds]);

  return { snapshot, ready, disabled, isRead, clear, toggleDisabled };
}

export function SeriesProgressPanel({
  snapshot,
  ready,
  disabled,
  onClear,
  onToggleDisabled,
  compact = false,
}: {
  snapshot: SeriesProgressSnapshot;
  ready?: boolean;
  disabled?: boolean;
  onClear?: () => void;
  onToggleDisabled?: () => void;
  compact?: boolean;
}) {
  if (!ready) {
    return (
      <div className={compact ? styles.progressCompact : styles.progressPanel} aria-hidden="true">
        <div className={styles.progressTrack}><span style={{ width: "0%" }} /></div>
        <p className={styles.progressLabel}>学习进度加载中</p>
      </div>
    );
  }

  if (disabled) {
    return (
      <div className={compact ? styles.progressCompact : styles.progressPanel}>
        <p className={styles.progressLabel}>本机进度已关闭</p>
        {onToggleDisabled && (
          <button type="button" className={styles.progressAction} onClick={onToggleDisabled}>
            重新开启
          </button>
        )}
      </div>
    );
  }

  if (snapshot.total === 0) return null;

  return (
    <div className={compact ? styles.progressCompact : styles.progressPanel} aria-label="系列学习进度">
      <div className={styles.progressMeta}>
        <p className={styles.progressLabel}>{snapshot.label}</p>
        <span className={styles.progressPercent}>{snapshot.percent}%</span>
      </div>
      <div className={styles.progressTrack} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={snapshot.percent} aria-label={`已读 ${snapshot.readCount} / ${snapshot.total}`}>
        <span style={{ width: `${snapshot.percent}%` }} />
      </div>
      {!compact && (onClear || onToggleDisabled) && (
        <div className={styles.progressActions}>
          {onClear && snapshot.readCount > 0 && (
            <button type="button" className={styles.progressAction} onClick={onClear}>
              清除本机进度
            </button>
          )}
          {onToggleDisabled && (
            <button type="button" className={styles.progressAction} onClick={onToggleDisabled}>
              关闭本机进度
            </button>
          )}
        </div>
      )}
    </div>
  );
}
