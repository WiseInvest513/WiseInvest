/** Browser-based guest trial, not an identity or VIP entitlement. */
export const READING_WINDOW_DAYS = 30;
export const READING_WINDOW_MS = READING_WINDOW_DAYS * 24 * 60 * 60 * 1000;
export const READING_REMINDER_AT = 5;
export const READING_LIMIT = 15;
export const READING_DWELL_MS = 20_000;
export const READING_COOKIE = "wise-reading-trial-v1";
export type ReadingEntry = [id: string, readAt: number];
export type ReadingMeterStatus = { count: number; locked: boolean; authenticated: boolean };

export function normalizeReadings(value: unknown, now: number): ReadingEntry[] {
  if (!Array.isArray(value)) return [];
  const unique = new Map<string, number>();
  for (const entry of value) {
    if (!Array.isArray(entry) || entry.length !== 2) continue;
    const [id, time] = entry;
    if (typeof id !== "string" || !/^[a-f0-9]{16}$/.test(id) || typeof time !== "number" || !Number.isFinite(time)) continue;
    if (time > now || time <= now - READING_WINDOW_MS) continue;
    unique.set(id, Math.max(unique.get(id) ?? 0, time));
  }
  return [...unique].sort((a, b) => b[1] - a[1]).slice(0, READING_LIMIT);
}

export function recordReading(entries: ReadingEntry[], id: string, now: number): ReadingEntry[] {
  const current = normalizeReadings(entries, now);
  // A refresh or repeat visit does not count again or prolong the trial window.
  if (current.length >= READING_LIMIT || current.some(([key]) => key === id)) return current;
  return normalizeReadings([...current, [id, now]], now);
}
