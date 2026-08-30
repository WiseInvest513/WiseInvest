"use client";

import { useState, type ReactNode } from "react";
import { BookOpen, Copy, ExternalLink, Sparkles, X } from "lucide-react";
import type { Perks2Product } from "../data";
import { getSafeExternalUrl } from "@/lib/security/external-links";
import { ProtectedContentLink } from "@/components/content-access-gate";
import { isWiseInvestHref } from "@/lib/content-access";

const isExternalUrl = (url: string) => (url.startsWith("http://") || url.startsWith("https://")) && !isWiseInvestHref(url);

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-black text-slate-600 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
    >
      <Copy className="h-3.5 w-3.5" />
      {copied ? "已复制" : "复制"}
    </button>
  );
}

function LinkButton({
  href,
  children,
  variant = "light",
}: {
  href: string;
  children: ReactNode;
  variant?: "light" | "dark";
}) {
  const className =
    variant === "dark"
      ? "inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-black text-amber-300 transition-colors hover:bg-amber-400 hover:text-slate-950 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
      : "inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm font-black text-slate-700 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-amber-700 dark:hover:bg-amber-900/20 dark:hover:text-amber-300";

  if (isExternalUrl(href)) {
    return (
      <a href={getSafeExternalUrl(href)} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <ProtectedContentLink href={href} className={className}>
      {children}
    </ProtectedContentLink>
  );
}

export function CexComparisonDialog({ products }: { products: Perks2Product[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-black text-amber-700 transition-colors hover:border-amber-300 hover:bg-amber-100 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/35"
      >
        <Sparkles className="h-4 w-4" />
        对比交易所
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm">
          <section className="max-h-[calc(100dvh-3rem)] w-full max-w-6xl overflow-y-auto rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_28px_80px_rgba(15,23,42,0.24)] dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-slate-800 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  CEX 对比
                </div>
                <h2 className="mt-3 text-xl font-black text-slate-950 dark:text-white">
                  交易所注册入金怎么选
                </h2>
                <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">
                  新手优先看注册、KYC、C2C 入金、现货交易、返佣绑定和后续链上钱包衔接。活动权益以交易所页面显示为准。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-amber-700 dark:hover:bg-amber-900/20"
                aria-label="关闭对比表"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[880px] w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                    {["交易所", "适合场景", "邀请码", "核心权益", "推荐理由", "操作"].map((header) => (
                      <th key={header} className="border-b border-slate-200 px-3 py-3 dark:border-slate-800">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="align-top">
                      <td className="border-b border-slate-100 px-3 py-3 dark:border-slate-800">
                        <div className="font-black text-slate-950 dark:text-white">{product.title}</div>
                        <div className="mt-1 text-xs font-bold text-amber-600 dark:text-amber-300">{product.recommendationText}</div>
                      </td>
                      <td className="border-b border-slate-100 px-3 py-3 text-xs font-semibold leading-5 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                        {product.description}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-3 dark:border-slate-800">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="max-w-[150px] truncate rounded-lg border border-dashed border-slate-300 bg-slate-50 px-2.5 py-1.5 font-mono text-xs font-black tracking-[0.06em] text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                            {product.code ?? "无需填写"}
                          </span>
                          {product.code && <CopyCodeButton code={product.code} />}
                        </div>
                      </td>
                      <td className="border-b border-slate-100 px-3 py-3 text-xs font-semibold leading-5 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                        <span className="font-black text-amber-600 dark:text-amber-300">{product.highlightValue}</span>
                        <span className="ml-1">{product.benefit}</span>
                      </td>
                      <td className="border-b border-slate-100 px-3 py-3 text-xs font-semibold leading-5 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                        {product.badge ?? "补充选择"}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-3 dark:border-slate-800">
                        <div className="flex min-w-[160px] flex-col gap-2">
                          {product.tutorialLink && (
                            <LinkButton href={product.tutorialLink}>
                              <BookOpen className="h-4 w-4" />
                              教程
                            </LinkButton>
                          )}
                          <LinkButton href={product.registerLink} variant="dark">
                            注册
                            <ExternalLink className="h-4 w-4" />
                          </LinkButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
