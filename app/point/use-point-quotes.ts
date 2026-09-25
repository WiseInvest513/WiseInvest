"use client";

import { useEffect, useState } from "react";
import type { PointQuote } from "@/lib/point/types";
import { effectivePointQuote } from "@/lib/point/presentation";

/** One batch per visible page; no per-row polling and no client-fabricated prices. */
export function usePointQuotes(
  symbols: string[],
  enabled: boolean,
  onDenied: () => void,
  endpoint: "/api/point/quotes" | "/api/admin/point/quotes" = "/api/point/quotes",
) {
  const key = [...new Set(symbols)].sort().join(",");
  const [result, setResult] = useState<{
    key: string;
    quotes: Record<string, PointQuote>;
  }>({ key: "", quotes: {} });
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled || !key) return;
    let disposed = false;
    let controller: AbortController | null = null;
    let lastSuccess = 0;
    const refresh = async (scheduled = false) => {
      if (document.hidden || controller) return;
      if (!scheduled && Date.now() - lastSuccess < 60_000) return;
      controller = new AbortController();
      const request = controller;
      const timeout = window.setTimeout(() => request.abort(), 15_000);
      try {
        const response = await fetch(
          `${endpoint}?symbols=${encodeURIComponent(key)}`,
          { cache: "no-store", signal: controller.signal },
        );
        if (disposed || request.signal.aborted) return;
        if (response.status === 401 || response.status === 403) {
          setResult({ key: "", quotes: {} });
          onDenied();
          return;
        }
        if (!response.ok) throw new Error("行情暂不可用");
        const body = (await response.json()) as { quotes: PointQuote[] };
        if (!Array.isArray(body.quotes)) throw new Error("行情暂不可用");
        if (!disposed && !request.signal.aborted) {
          lastSuccess = Date.now();
          setResult({
            key: `${endpoint}:${key}`,
            quotes: Object.fromEntries(body.quotes.map((q) => [q.symbol, q])),
          });
        }
      } catch {
        if (!disposed)
          setResult((previous) => ({
            key: previous.key,
            quotes: Object.fromEntries(
              Object.entries(previous.quotes).map(([symbol, q]) => [
                symbol,
                { ...q, status: "stale" as const },
              ]),
            ),
          }));
      } finally {
        window.clearTimeout(timeout);
        controller = null;
        if (!disposed) setNow(Date.now());
      }
    };
    void refresh();
    const foregroundRefresh = () => {
      setNow(Date.now());
      void refresh();
    };
    const interval = window.setInterval(() => void refresh(true), 300_000);
    const clock = window.setInterval(() => setNow(Date.now()), 30_000);
    document.addEventListener("visibilitychange", foregroundRefresh);
    window.addEventListener("focus", foregroundRefresh);
    return () => {
      disposed = true;
      controller?.abort();
      window.clearInterval(interval);
      window.clearInterval(clock);
      document.removeEventListener("visibilitychange", foregroundRefresh);
      window.removeEventListener("focus", foregroundRefresh);
    };
  }, [key, enabled, onDenied, endpoint]);
  const quotes =
    enabled && result.key === `${endpoint}:${key}`
      ? Object.fromEntries(
          Object.entries(result.quotes).map(([symbol, quote]) => [
            symbol,
            effectivePointQuote(quote, now),
          ]),
        )
      : {};
  return { quotes, now };
}
