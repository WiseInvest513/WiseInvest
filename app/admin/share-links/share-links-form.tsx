"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "@/app/admin/vip/copy-button";
import {
  ACQUISITION_SOURCES,
  buildShareUrl,
  type AcquisitionSource,
} from "@/lib/auth/acquisition-source";
import { cn } from "@/lib/utils";

const shortcuts = [
  { label: "首页", path: "/" },
  { label: "开始页", path: "/start" },
  { label: "注册页", path: "/register" },
  { label: "文章库", path: "/articles" },
  { label: "U 卡", path: "/card" },
  { label: "福利", path: "/perk" },
] as const;

type ShareArticleOption = {
  title: string;
  path: string;
};

export function ShareLinksForm({ articles }: { articles: ShareArticleOption[] }) {
  const [pathInput, setPathInput] = useState("/");
  const [articleQuery, setArticleQuery] = useState("");
  const [source, setSource] = useState<AcquisitionSource>("wx");

  const result = useMemo(() => buildShareUrl(pathInput, source), [pathInput, source]);
  const matches = useMemo(() => {
    const keyword = articleQuery.trim().toLowerCase();
    if (!keyword) return [];
    return articles
      .filter((article) => article.title.toLowerCase().includes(keyword) || article.path.toLowerCase().includes(keyword))
      .slice(0, 8);
  }, [articleQuery, articles]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
      <div className="flex flex-wrap gap-2">
        {shortcuts.map((item) => {
          const active = pathInput.trim() === item.path || (item.path === "/" && pathInput.trim() === "");
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => setPathInput(item.path)}
              className={cn(
                "inline-flex h-10 items-center rounded-xl border px-3 text-sm font-black transition",
                active
                  ? "border-slate-950 bg-slate-950 text-amber-300 dark:border-white dark:bg-white dark:text-slate-950"
                  : "border-slate-200 bg-white text-slate-600 hover:border-amber-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <label className="mt-6 block">
        <span className="text-sm font-black text-slate-950 dark:text-white">目标地址</span>
        <input
          value={pathInput}
          onChange={(event) => setPathInput(event.target.value)}
          placeholder="粘贴站内路径或完整 URL，例如 /articles/crypto/u8bcPdDs"
          className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-950"
        />
      </label>

      <label className="mt-4 block">
        <span className="text-sm font-black text-slate-950 dark:text-white">搜索文章</span>
        <input
          value={articleQuery}
          onChange={(event) => setArticleQuery(event.target.value)}
          placeholder="输入标题或路径，点选后自动填入目标地址"
          className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-950"
        />
      </label>
      {articleQuery.trim() ? (
        <div className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {matches.length > 0 ? matches.map((article) => (
            <button
              key={article.path}
              type="button"
              onClick={() => {
                setPathInput(article.path);
                setArticleQuery("");
              }}
              className="flex w-full flex-col items-start gap-1 px-4 py-3 text-left transition hover:bg-amber-50 dark:hover:bg-amber-950/20"
            >
              <span className="text-sm font-black text-slate-950 dark:text-white">{article.title}</span>
              <span className="font-mono text-xs text-slate-400">{article.path}</span>
            </button>
          )) : (
            <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">没有找到匹配文章。</p>
          )}
        </div>
      ) : null}

      <div className="mt-6">
        <p className="text-sm font-black text-slate-950 dark:text-white">选择渠道</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {ACQUISITION_SOURCES.map((item) => {
            const active = item.code === source;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => setSource(item.code)}
                className={cn(
                  "inline-flex h-10 items-center rounded-xl border px-3 text-sm font-black transition",
                  active
                    ? "border-slate-950 bg-slate-950 text-amber-300 dark:border-white dark:bg-white dark:text-slate-950"
                    : "border-slate-200 bg-white text-slate-600 hover:border-amber-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-black text-slate-950 dark:text-white">完整链接</p>
          {result.ok ? <CopyButton value={result.url} label="复制链接" /> : null}
        </div>
        {result.ok ? (
          <p className="mt-3 break-all font-mono text-sm font-bold text-slate-700 dark:text-amber-100">{result.url}</p>
        ) : (
          <p className="mt-3 text-sm text-rose-600 dark:text-rose-300">{result.message}</p>
        )}
        <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
          链接会固定生成到 www.wise-invest.org。参数名是 utm_source，值是渠道短代码，不会出现完整中文平台名。
        </p>
      </div>
    </section>
  );
}
