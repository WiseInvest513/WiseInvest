"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { BookOpen, Bookmark, Gift, ArrowRight, X } from "lucide-react";
import { readNavSession, subscribeNavSession } from "@/lib/auth/nav-session-client";
import { recordPopupShown, shouldShowAutomaticPopup } from "@/lib/popup-cooldown";
import { READING_DWELL_MS, READING_LIMIT, READING_REMINDER_AT, READING_WINDOW_MS, type ReadingMeterStatus } from "@/lib/article-reading-meter";
import styles from "./article-reading-registration.module.css";

const REMINDED_KEY = "wise-reading-reminded-at-v1";
const SYNC_KEY = "wise-reading-updated-at-v1";
function hasOtherDialog() {
  if (document.querySelector('dialog[open], [role="dialog"][data-state="open"]')) return true;
  return ["wise-kraken-popup", "wise-community-popup"].some(tag => document.querySelector(tag)?.shadowRoot?.querySelector("dialog[open]"));
}

export function ArticleReadingRegistration({ articleId, onLockChange }: { articleId: string; onLockChange: (locked: boolean) => void }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState<{ count: number; locked: boolean; callback: string } | null>(null);
  const promptRef = useRef(false);
  useEffect(() => {
    let disposed = false, busy = false, counted = false, activeMs = 0, lastTick = performance.now(), requestGeneration = 0;
    let meter: ReadingMeterStatus | null = null;
    let lockShown = false;
    const controllers = new Set<AbortController>();
    const apply = (next: ReadingMeterStatus) => {
      if (disposed) return;
      meter = next;
      onLockChange(next.locked);
      if (next.authenticated) { setPrompt(null); promptRef.current = false; }
    };
    const request = async (mark = false) => {
      const generation = ++requestGeneration;
      const controller = new AbortController(); controllers.add(controller);
      const timeout = window.setTimeout(() => controller.abort(), 10_000);
      try {
        const response = await fetch("/api/articles/reading", { method: mark ? "POST" : "GET", cache: "no-store", signal: controller.signal,
          ...(mark ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ articleId }) } : {}) });
        if (!response.ok) throw new Error("Reading status unavailable");
        const next = await response.json() as ReadingMeterStatus;
        if (generation === requestGeneration) apply(next);
        if (mark && !disposed) {
          counted = true;
          try { localStorage.setItem(SYNC_KEY, String(Date.now())); } catch { /* Cookies still persist the trial. */ }
        }
      } finally { window.clearTimeout(timeout); controllers.delete(controller); }
    };
    const refresh = () => { if (!document.hidden && !busy) void request().catch(() => {}); };
    const unsubscribe = subscribeNavSession(session => {
      if (session?.user && !disposed) { setPrompt(null); promptRef.current = false; refresh(); router.refresh(); }
    });
    const sync = (event: StorageEvent) => { if (event.key === SYNC_KEY) refresh(); };
    const hide = () => { setPrompt(null); promptRef.current = false; };
    refresh();
    const timer = window.setInterval(async () => {
      const now = performance.now(), elapsed = Math.min(now - lastTick, 1500); lastTick = now;
      if (document.hidden || busy || !meter || meter.authenticated) return;
      if (!hasOtherDialog() && document.hasFocus()) activeMs += elapsed;
      if (!counted && !meter.locked && activeMs >= READING_DWELL_MS) {
        busy = true;
        try {
          // Serialize cookie writes between tabs so simultaneous reads are not lost.
          if (navigator.locks) await navigator.locks.request("wise-reading-trial", () => disposed ? Promise.resolve() : request(true));
          else await request(true);
        } catch { /* Retry after the next foreground interval; never count a failed request. */ }
        finally { busy = false; }
      }
      if (disposed || !meter || meter.authenticated || promptRef.current || document.hidden) return;
      const { count, locked } = meter;
      if (locked && !lockShown) {
        lockShown = true;
        window.dispatchEvent(new Event("wise-reading:opening"));
      } else if (!locked && count >= READING_REMINDER_AT && activeMs >= READING_DWELL_MS) {
        let last = 0;
        try { last = Number(localStorage.getItem(REMINDED_KEY)) || 0; } catch { return; }
        if (Date.now() - last < READING_WINDOW_MS || !shouldShowAutomaticPopup() || hasOtherDialog()) return;
        // Revalidate login immediately before a reminder, including another tab's sign-in.
        busy = true;
        try { const session = await readNavSession(); if (session?.user || disposed) return; }
        catch { return; } finally { busy = false; }
        if (hasOtherDialog() || !shouldShowAutomaticPopup()) return;
        try { localStorage.setItem(REMINDED_KEY, String(Date.now())); } catch { return; }
      } else return;
      recordPopupShown(); promptRef.current = true;
      setPrompt({ count, locked, callback: location.pathname + location.search + location.hash });
    }, 1000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("storage", sync);
    window.addEventListener("wise-community:opening", hide);
    window.addEventListener("wise-campaign:opening", hide);
    return () => {
      disposed = true; window.clearInterval(timer); controllers.forEach(controller => controller.abort()); unsubscribe();
      window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("storage", sync); window.removeEventListener("wise-community:opening", hide); window.removeEventListener("wise-campaign:opening", hide);
    };
  }, [articleId, onLockChange, router]);

  const close = () => { promptRef.current = false; setPrompt(null); };
  return <Dialog.Root open={Boolean(prompt)} onOpenChange={open => { if (!open) close(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className={styles.overlay} />
      <Dialog.Content className={styles.card} data-reading-registration={prompt?.locked ? "required" : "reminder"}>
        <Dialog.Close className={styles.close} aria-label={prompt?.locked ? "关闭提示，查看预览" : "关闭注册提醒"}><X size={18} /></Dialog.Close>
        <div className={styles.icon}><BookOpen size={27} /></div>
        <p className={styles.eyebrow}>你的 Wise Invest 阅读之旅</p>
        <Dialog.Title className={styles.title}>你已经阅读了 <span>{prompt?.count ?? READING_LIMIT}</span> 篇文章</Dialog.Title>
        <Dialog.Description className={styles.description}>
          {prompt?.locked ? "最近 30 天的 15 篇免注册阅读体验已用完。免费注册 Wise ID，继续阅读完整内容。" : "这些内容对你有帮助吗？免费创建 Wise ID，让接下来的学习有记录、有收藏，也能找到适合自己的福利。"}
        </Dialog.Description>
        <div className={styles.benefits}>
          <div><BookOpen size={18} /><span><strong>持续阅读全文</strong><small>登录后不受访客篇数限制</small></span></div>
          <div><Bookmark size={18} /><span><strong>收藏与阅读记录</strong><small>在账户中找回感兴趣的内容</small></span></div>
          <div><Gift size={18} /><span><strong>福利与权益入口</strong><small>查看合作福利及各项领取条件</small></span></div>
        </div>
        <Link className={styles.primary} href={`/register?callbackUrl=${encodeURIComponent(prompt?.callback ?? "/articles")}`}>免费注册，继续阅读 <ArrowRight size={17} /></Link>
        <div className={styles.actions}><Link href={`/login?callbackUrl=${encodeURIComponent(prompt?.callback ?? "/articles")}`}>已有账号？去登录</Link><button type="button" onClick={close}>{prompt?.locked ? "先看文章预览" : "稍后再说"}</button></div>
        <p className={styles.note}>免费注册普通账户；VIP 与合作奖励按各自条件开通。</p>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
