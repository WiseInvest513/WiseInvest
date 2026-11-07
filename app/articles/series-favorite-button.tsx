"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { LoginRequiredDialog } from "@/components/content-access-gate";
import { getSeriesOverviewHref } from "@/lib/article-series";
import styles from "./series-reader.module.css";

export function SeriesFavoriteButton({ seriesId, title, summary }: { seriesId: string; title: string; summary: string }) {
  const href = getSeriesOverviewHref(seriesId);
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setFavorited(false);
    setError("");
    fetch(`/api/account/content-library?href=${encodeURIComponent(href)}`, { cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (response.status === 401) return;
        if (!response.ok) throw new Error("favorite status unavailable");
        const payload = await response.json();
        if (!controller.signal.aborted) setFavorited(payload.favorited === true);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("收藏状态暂时无法读取，请稍后重试。");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [href]);

  async function toggleFavorite() {
    if (loading || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/content/activity", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ eventType: favorited ? "FAVORITE_REMOVE" : "FAVORITE_ADD", href, title, summary, metadata: { seriesId, kind: "series" } }),
      });
      if (response.status === 401) {
        setLoginOpen(true);
        return;
      }
      const payload = await response.json();
      if (!response.ok || payload.preview || typeof payload.favorited !== "boolean") throw new Error("favorite update unavailable");
      setFavorited(payload.favorited);
    } catch {
      setError("收藏暂时无法保存，请稍后重试。");
    } finally {
      setBusy(false);
    }
  }

  return <>
    <button type="button" className={styles.favoriteButton} aria-pressed={favorited} aria-busy={loading || busy} disabled={loading || busy} onClick={() => void toggleFavorite()}>
      {favorited ? <BookmarkCheck size={16} aria-hidden="true" /> : <Bookmark size={16} aria-hidden="true" />}
      {busy ? "保存中…" : favorited ? "已收藏系列" : "收藏系列"}
    </button>
    {error && <span className={styles.favoriteError} role="status">{error}</span>}
    <LoginRequiredDialog open={loginOpen} href={href} heading="登录后收藏这个系列" reason="登录 Wise ID 后，系列会保存在「我的收藏」中，方便下次继续学习。" onOpenChange={setLoginOpen} />
  </>;
}
