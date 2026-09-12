"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

export type ArticleLimitedRelease = {
  endsAt: string;
  serverNow: number;
  canReadAfterExpiry: boolean;
  previewContent: string;
};

type ArticleReleaseCountdownProps = Pick<ArticleLimitedRelease, "endsAt" | "serverNow" | "canReadAfterExpiry"> & {
  expired: boolean;
  onExpire: () => void;
  onResume: () => void;
};

const beijingDate = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "long",
  day: "numeric",
});

/** Keep the one-second updates here, away from the long Markdown article. */
export function ArticleReleaseCountdown({
  endsAt,
  serverNow,
  canReadAfterExpiry,
  expired,
  onExpire,
  onResume,
}: ArticleReleaseCountdownProps) {
  const deadline = Date.parse(endsAt);
  const [remainingSeconds, setRemainingSeconds] = useState(() => Math.max(0, Math.ceil((deadline - serverNow) / 1000)));

  useEffect(() => {
    if (expired) return;

    // The server supplies the absolute time. A monotonic elapsed clock avoids
    // relying on the reader's local time zone or an incorrectly set system clock.
    const startedAt = performance.now();
    const wallStartedAt = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    let notified = false;

    const update = () => {
      clearTimeout(timer);
      // Some browsers pause performance.now() during device sleep. A wall-clock
      // delta catches that gap without trusting the local absolute date/time.
      const elapsed = Math.max(performance.now() - startedAt, Date.now() - wallStartedAt);
      const remaining = deadline - (serverNow + elapsed);
      setRemainingSeconds(Math.max(0, Math.ceil(remaining / 1000)));

      if (remaining <= 0) {
        if (!notified) {
          notified = true;
          onExpire();
        }
        return;
      }

      timer = setTimeout(update, Math.min(1000, remaining));
    };

    const resume = () => {
      update();
      if (!notified && document.visibilityState === "visible") onResume();
    };

    update();
    window.addEventListener("focus", resume);
    window.addEventListener("pageshow", resume);
    document.addEventListener("visibilitychange", resume);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", resume);
      window.removeEventListener("pageshow", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [deadline, expired, onExpire, onResume, serverNow]);

  const ended = expired || remainingSeconds === 0;
  const days = Math.floor(remainingSeconds / 86400);
  const hours = Math.floor((remainingSeconds % 86400) / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  // The release ends at midnight: display the preceding day's 24:00 to avoid
  // the ambiguous phrase “Sunday midnight”.
  const publicThrough = beijingDate.format(new Date(deadline - 1));

  return (
    <section
      aria-label="本文阅读权限"
      className="mt-6 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 dark:border-amber-900/60 dark:bg-amber-950/20 md:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-200">
          <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
          {ended ? "限时公开已结束" : "限时公开阅读"}
        </p>
        {!ended && (
          <span role="timer" aria-live="off" aria-label={`距离公开阅读结束还有 ${days} 天 ${hours} 小时 ${minutes} 分 ${seconds} 秒`} className="flex items-baseline gap-2 whitespace-nowrap text-amber-900 dark:text-amber-200">
            <span className="text-xs text-amber-800/70 dark:text-amber-300/70">剩余</span>
            <span className="font-mono text-base font-semibold tabular-nums">{pad(days)}<span className="mx-1 text-xs font-normal">天</span>{pad(hours)}:{pad(minutes)}:{pad(seconds)}</span>
          </span>
        )}
      </div>
      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
        {ended
          ? canReadAfterExpiry
            ? "公开期已结束，您的 VIP 权限可继续阅读完整文章。"
            : "现可免费阅读本文前 30%，剩余内容仅限 Wise VIP 阅读。"
          : <>
              全文公开至<time dateTime={endsAt} className="font-semibold">北京时间 {publicThrough} 24:00</time>。到期后可读前 30%，VIP 可继续阅读全文。
            </>}
      </p>
      {!canReadAfterExpiry && (
        <Link href="/vip" className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 underline-offset-4 hover:underline dark:text-amber-300">
          了解如何加入 Wise VIP <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}
