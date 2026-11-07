/** Browser-local series reading progress (no account required). */

export const SERIES_PROGRESS_STORAGE_KEY = "wise-series-read-v1";
export const SERIES_PROGRESS_DISABLED_KEY = "wise-series-read-disabled";

export type SeriesProgressSnapshot = {
  total: number;
  readCount: number;
  remaining: number;
  currentLesson: number | null;
  percent: number;
  label: string;
};

export function parseSeriesReadIds(raw: string | null): Set<string> {
  if (!raw) return new Set();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((item): item is string => typeof item === "string" && item.length > 0));
  } catch {
    return new Set();
  }
}

export function serializeSeriesReadIds(ids: Iterable<string>) {
  return JSON.stringify([...new Set(ids)].sort());
}

export function getSeriesProgressSnapshot(
  readableArticleIds: readonly string[],
  readIds: ReadonlySet<string>,
  currentArticleId?: string,
  unit: "课" | "篇" = "课",
): SeriesProgressSnapshot {
  const readable = [...new Set(readableArticleIds.filter(Boolean))];
  const total = readable.length;
  const readCount = readable.filter(id => readIds.has(id)).length;
  const remaining = Math.max(0, total - readCount);
  const currentLesson = currentArticleId
    ? readable.findIndex(id => id === currentArticleId) + 1 || null
    : null;
  const percent = total === 0 ? 0 : Math.round((readCount / total) * 100);
  const parts = [`已读 ${readCount}/${total || 0}`];
  if (currentLesson) parts.push(`当前第 ${currentLesson} ${unit}`);
  if (total > 0) parts.push(remaining === 0 ? "本系列已读完" : `还剩 ${remaining} 篇`);
  return { total, readCount, remaining, currentLesson, percent, label: parts.join(" · ") };
}

export function isSeriesProgressDisabled(storage?: Pick<Storage, "getItem"> | null) {
  try {
    return storage?.getItem(SERIES_PROGRESS_DISABLED_KEY) === "1";
  } catch {
    return false;
  }
}

export function readSeriesProgressIds(storage?: Pick<Storage, "getItem"> | null) {
  if (isSeriesProgressDisabled(storage)) return new Set<string>();
  try {
    return parseSeriesReadIds(storage?.getItem(SERIES_PROGRESS_STORAGE_KEY) ?? null);
  } catch {
    return new Set<string>();
  }
}

export function writeSeriesProgressIds(ids: Iterable<string>, storage?: Pick<Storage, "setItem"> | null) {
  try {
    storage?.setItem(SERIES_PROGRESS_STORAGE_KEY, serializeSeriesReadIds(ids));
  } catch {
    // Ignore quota / private-mode failures; progress stays session-local.
  }
}

export function markSeriesArticleRead(
  articleId: string,
  storage?: Pick<Storage, "getItem" | "setItem"> | null,
) {
  if (!articleId || isSeriesProgressDisabled(storage)) return readSeriesProgressIds(storage);
  const next = readSeriesProgressIds(storage);
  if (next.has(articleId)) return next;
  next.add(articleId);
  writeSeriesProgressIds(next, storage);
  return next;
}

export function clearSeriesProgress(storage?: Pick<Storage, "removeItem"> | null) {
  try {
    storage?.removeItem(SERIES_PROGRESS_STORAGE_KEY);
  } catch {
    // no-op
  }
}

export function setSeriesProgressDisabled(
  disabled: boolean,
  storage?: Pick<Storage, "setItem" | "removeItem"> | null,
) {
  try {
    if (disabled) storage?.setItem(SERIES_PROGRESS_DISABLED_KEY, "1");
    else storage?.removeItem(SERIES_PROGRESS_DISABLED_KEY);
  } catch {
    // no-op
  }
}
