"use client";

import { useMemo, useState } from "react";
import { Check, Search, Shield, Sparkles } from "lucide-react";
import type { ContentAccessLevel, ContentItemType } from "@/lib/content-access";
import { cn } from "@/lib/utils";

type ContentPermissionRow = {
  contentType: ContentItemType;
  contentKey: string;
  title: string;
  description: string;
  access: ContentAccessLevel;
  reason: string;
  source: "DATABASE" | "DEFAULT";
};

const accessOptions: { value: ContentAccessLevel; label: string; description: string }[] = [
  { value: "PUBLIC", label: "公开", description: "未登录也能看" },
  { value: "MEMBER", label: "登录", description: "注册登录后可看" },
  { value: "VIP", label: "VIP", description: "Wise VIP 可看" },
  { value: "VIP_PLUS", label: "SVIP", description: "Wise SVIP 可看" },
];

const typeLabels: Record<ContentItemType, string> = {
  ARTICLE: "文章",
  ROADMAP_DETAIL: "学习路线",
  ROADMAP_ROUTE: "资金地图",
};

export function ContentPermissionTable({ rows }: { rows: ContentPermissionRow[] }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState(rows);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) =>
      `${item.title} ${item.description} ${item.contentKey}`.toLowerCase().includes(keyword)
    );
  }, [items, query]);

  const updateLocal = (row: ContentPermissionRow, patch: Partial<ContentPermissionRow>) => {
    setItems((prev) =>
      prev.map((item) =>
        item.contentType === row.contentType && item.contentKey === row.contentKey
          ? { ...item, ...patch }
          : item
      )
    );
  };

  const saveRow = async (row: ContentPermissionRow) => {
    setSavingKey(`${row.contentType}:${row.contentKey}`);
    try {
      const response = await fetch("/api/admin/content-permissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contentType: row.contentType,
          contentKey: row.contentKey,
          title: row.title,
          access: row.access,
          reason: row.reason,
        }),
      });
      if (!response.ok) throw new Error("保存失败");
      updateLocal(row, { source: "DATABASE" });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 p-5 dark:border-slate-800 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              <Shield className="h-3.5 w-3.5" />
              Content Access
            </div>
            <h2 className="text-2xl font-black">内容权限配置</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              未配置的内容会使用系统默认规则；保存后以这里的权限为准。
            </p>
          </div>
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索标题、路径"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-semibold outline-none transition focus:border-amber-300 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {filtered.map((row) => {
          const rowKey = `${row.contentType}:${row.contentKey}`;
          const isSaving = savingKey === rowKey;
          return (
            <div key={rowKey} className="grid gap-4 p-5 md:grid-cols-[1fr_180px_1.1fr_auto] md:items-center md:p-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    {typeLabels[row.contentType]}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-black",
                      row.source === "DATABASE"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                    )}
                  >
                    {row.source === "DATABASE" ? "已配置" : "默认"}
                  </span>
                </div>
                <p className="mt-3 truncate text-base font-black text-slate-950 dark:text-white">{row.title}</p>
                <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{row.description}</p>
                <p className="mt-2 truncate font-mono text-[11px] font-bold text-slate-400">{row.contentKey}</p>
              </div>

              <select
                value={row.access}
                onChange={(event) => updateLocal(row, { access: event.target.value as ContentAccessLevel })}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black outline-none transition focus:border-amber-300 dark:border-slate-800 dark:bg-slate-950"
              >
                {accessOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.description}
                  </option>
                ))}
              </select>

              <textarea
                value={row.reason}
                onChange={(event) => updateLocal(row, { reason: event.target.value })}
                rows={2}
                className="min-h-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold leading-6 outline-none transition focus:border-amber-300 focus:bg-white dark:border-slate-800 dark:bg-slate-950"
                placeholder="登录墙提示原因"
              />

              <button
                type="button"
                onClick={() => void saveRow(row)}
                disabled={isSaving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-amber-300 transition hover:bg-amber-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-400 dark:text-slate-950"
              >
                {isSaving ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Check className="h-4 w-4" />}
                保存
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
