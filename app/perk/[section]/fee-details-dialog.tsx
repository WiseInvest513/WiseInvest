"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Landmark, ReceiptText, X } from "lucide-react";
import type { Perks2FeeDetails } from "../data";

export function FeeDetailsDialog({
  details,
  productTitle,
  variant = "inline",
}: {
  details: Perks2FeeDetails;
  productTitle: string;
  variant?: "inline" | "panel";
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          variant === "panel"
            ? "flex min-h-[92px] w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-gradient-to-br from-amber-50 via-white to-orange-50 px-4 py-4 text-base font-black text-amber-700 shadow-inner shadow-white/70 transition-all hover:border-amber-400 hover:from-amber-100 hover:to-orange-100 dark:border-amber-800/60 dark:from-amber-950/20 dark:via-slate-950 dark:to-orange-950/20 dark:text-amber-300 dark:hover:bg-amber-900/20"
            : "inline-flex items-center justify-center gap-1 rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[10px] font-black text-amber-700 transition-colors hover:border-amber-300 hover:bg-amber-50 dark:border-amber-800/60 dark:bg-slate-950 dark:text-amber-300 dark:hover:bg-amber-900/20"
        }
      >
        <ReceiptText className={variant === "panel" ? "h-5 w-5" : "h-3 w-3"} />
        费率详情
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/45 px-4 py-8 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <section
            className="relative max-h-[calc(100dvh-4rem)] w-full max-w-2xl overflow-y-auto rounded-[24px] border border-slate-200/90 bg-white p-4 shadow-[0_28px_80px_rgba(15,23,42,0.24)] dark:border-slate-800 dark:bg-slate-950"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-20 mb-2 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg shadow-slate-950/10 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-amber-700 dark:hover:bg-amber-900/20"
                aria-label="关闭费率详情"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 flex items-start gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-800/60">
                  <Landmark className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-400 dark:text-slate-500">{productTitle}</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{details.title}</h2>
                  {details.subtitle && (
                    <p className="mt-1 text-sm font-semibold leading-5 text-slate-500 dark:text-slate-400">
                      {details.subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {details.highlight && (
              <div className="mb-4 rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 via-white to-orange-50 p-4 dark:border-orange-900/60 dark:from-orange-950/20 dark:via-slate-950 dark:to-orange-950/20">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-2xl font-black text-orange-600 dark:text-orange-300">
                      {details.highlight.label}
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300">
                      {details.highlight.note}
                    </p>
                  </div>
                  <div className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(234,88,12,0.22)] dark:bg-orange-500">
                    {details.highlight.value}
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/70">
              {details.rows.map((row, index) => (
                <div
                  key={`${row.label}-${index}`}
                  className={`grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-slate-200 px-3 py-3 last:border-b-0 dark:border-slate-800 ${
                    index === 0 ? "bg-orange-50/70 dark:bg-orange-950/15" : ""
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {row.badge && (
                      <span className="shrink-0 rounded-md bg-red-50 px-2 py-1 text-xs font-black text-red-600 dark:bg-red-950/35 dark:text-red-300">
                        {row.badge}
                      </span>
                    )}
                    <span className="truncate text-sm font-black text-slate-900 dark:text-slate-100">
                      {row.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-950 dark:text-white">{row.value}</div>
                    {row.note && (
                      <div className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {row.note}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {details.notice && (
              <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-600 dark:border-blue-900/60 dark:bg-blue-950/20 dark:text-slate-300">
                {details.notice}
              </div>
            )}

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-amber-500 hover:text-slate-950 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
            >
              关闭
            </button>
          </section>
        </div>
      )}
    </>
  );
}
