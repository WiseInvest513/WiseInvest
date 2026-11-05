"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ArticleShareButtonProps = {
  uid: string;
  className?: string;
};

/**
 * Copies the stable eight-character article URL. It deliberately avoids a
 * network call: the article UID is already a durable short identifier and
 * `/s/[uid]` resolves it server-side.
 */
export function ArticleShareButton({ uid, className }: ArticleShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyShortLink = async () => {
    const shortUrl = `${window.location.origin}/s/${uid}`;

    try {
      await navigator.clipboard.writeText(shortUrl);
    } catch {
      const input = document.createElement("textarea");
      input.value = shortUrl;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={() => void copyShortLink()}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-500 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-amber-800 dark:hover:bg-amber-950/30 dark:hover:text-amber-200",
        className
      )}
      aria-label="复制文章短链接"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
      {copied ? "已复制" : "分享"}
    </button>
  );
}
