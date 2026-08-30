"use client";

import Link from "next/link";
import { useState, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck, X } from "lucide-react";
import { buildLoginHref, isWiseInvestHref, requiresLoginForContent, toWiseInvestRelativeHref } from "@/lib/content-access";
import { cn } from "@/lib/utils";

type SessionState = "unknown" | "guest" | "signed-in";

let cachedSessionState: SessionState = "unknown";

async function getClientSessionState(): Promise<SessionState> {
  if (cachedSessionState !== "unknown") return cachedSessionState;

  try {
    const response = await fetch("/api/auth/session", { cache: "no-store" });
    if (!response.ok) {
      cachedSessionState = "guest";
      return cachedSessionState;
    }

    const session = await response.json();
    cachedSessionState = session?.user?.id || session?.user?.email ? "signed-in" : "guest";
    return cachedSessionState;
  } catch {
    cachedSessionState = "guest";
    return cachedSessionState;
  }
}

function getCallbackUrl(href: string) {
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin === window.location.origin) {
      return `${url.pathname}${url.search}`;
    }
  } catch {
    return href;
  }

  return href;
}

async function checkContentAccess(href: string) {
  try {
    const response = await fetch(`/api/content-access/check?href=${encodeURIComponent(href)}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("content access check failed");
    return (await response.json()) as {
      allowed: boolean;
      reason?: string;
      loginHref?: string;
    };
  } catch {
    const sessionState = await getClientSessionState();
    return {
      allowed: !requiresLoginForContent(href) || sessionState === "signed-in",
      reason: "完整内容需要登录 Wise ID 后查看",
      loginHref: buildLoginHref(href),
    };
  }
}

function recordLoginPrompt(href: string, title?: string) {
  void fetch("/api/content/activity", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      eventType: "LOGIN_PROMPT",
      href,
      title,
      metadata: { source: "content_access_gate" },
    }),
    keepalive: true,
  }).catch(() => {});
}

export function LoginRequiredDialog({
  open,
  href,
  reason,
  onOpenChange,
}: {
  open: boolean;
  href: string;
  reason?: string;
  onOpenChange: (open: boolean) => void;
}) {
  if (!open) return null;

  const callbackUrl = getCallbackUrl(href);
  const loginHref = buildLoginHref(callbackUrl);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/42 px-4 py-6 backdrop-blur-sm">
      <section className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.26)] dark:border-slate-800 dark:bg-slate-950">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:border-slate-800 dark:text-slate-400 dark:hover:border-amber-700 dark:hover:bg-amber-900/20"
          aria-label="关闭"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300">
          <LockKeyhole className="h-5 w-5" />
        </div>

        <div className="mt-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
            Wise ID
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            这部分内容需要登录后查看
          </h2>
          <p className="mt-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-300">
            {reason ?? "当前页面属于 Wise 会员内容。登录或注册后，可以继续阅读完整文章和学习路线。"}
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
            <p className="text-xs font-semibold leading-6 text-slate-500 dark:text-slate-400">
              登录后会自动回到刚才点击的位置，不影响你继续学习。
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            先留在当前页
          </button>
          <Link
            href={loginHref}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-black text-amber-300 transition-colors hover:bg-amber-400 hover:text-slate-950 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
          >
            去登录
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

export function useContentAccessGate() {
  const [blocked, setBlocked] = useState<{ href: string; reason?: string } | null>(null);

  const guardHref = async (href: string) => {
    if (!isWiseInvestHref(href)) return true;
    const navigationHref = toWiseInvestRelativeHref(href);
    const result = await checkContentAccess(navigationHref);
    if (result.allowed) return true;
    recordLoginPrompt(navigationHref);
    setBlocked({ href: navigationHref, reason: result.reason });
    return false;
  };

  const dialog = (
    <LoginRequiredDialog
      open={Boolean(blocked)}
      href={blocked?.href ?? "/login"}
      reason={blocked?.reason}
      onOpenChange={(open) => {
        if (!open) setBlocked(null);
      }}
    />
  );

  return { guardHref, dialog };
}

type ProtectedContentLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children: ReactNode;
  className?: string;
};

export function ProtectedContentLink({
  href,
  children,
  className,
  onClick,
  ...props
}: ProtectedContentLinkProps) {
  const [blocked, setBlocked] = useState<{ href: string; reason?: string } | null>(null);
  const navigationHref = toWiseInvestRelativeHref(href);

  const handleClick = async (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;

    const target = event.currentTarget.getAttribute("target");
    if (target && target !== "_self") return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    const result = await checkContentAccess(navigationHref);
    if (result.allowed) {
      window.location.assign(navigationHref);
      return;
    }
    recordLoginPrompt(navigationHref, typeof children === "string" ? children : undefined);
    setBlocked({ href: navigationHref, reason: result.reason });
  };

  if (!isWiseInvestHref(href)) {
    return (
      <a href={href} className={cn(className)} onClick={onClick} {...props}>
        {children}
      </a>
    );
  }

  return (
    <>
      <Link href={navigationHref} className={cn(className)} onClick={handleClick} {...props}>
        {children}
      </Link>
      <LoginRequiredDialog
        open={Boolean(blocked)}
        href={blocked?.href ?? navigationHref}
        reason={blocked?.reason}
        onOpenChange={(open) => {
          if (!open) setBlocked(null);
        }}
      />
    </>
  );
}
