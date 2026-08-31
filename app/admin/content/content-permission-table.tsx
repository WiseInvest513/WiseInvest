"use client";

import { useMemo, useState } from "react";
import { Check, FileText, Map, Route, Search, Shield, Sparkles } from "lucide-react";
import type { ContentAccessLevel, ContentItemType } from "@/lib/content-access";
import { cn } from "@/lib/utils";

type ContentPermissionRow = {
  contentType: ContentItemType;
  contentKey: string;
  title: string;
  description: string;
  group: string;
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

const typeIcons: Record<ContentItemType, typeof FileText> = {
  ARTICLE: FileText,
  ROADMAP_DETAIL: Route,
  ROADMAP_ROUTE: Map,
};

const typeFilters: { key: "ALL" | ContentItemType; label: string }[] = [
  { key: "ALL", label: "全部内容" },
  { key: "ARTICLE", label: "文章" },
  { key: "ROADMAP_DETAIL", label: "学习路线" },
  { key: "ROADMAP_ROUTE", label: "资金地图" },
];

export function ContentPermissionTable({ rows }: { rows: ContentPermissionRow[] }) {
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"ALL" | ContentItemType>("ALL");
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [selectedAccess, setSelectedAccess] = useState<"ALL" | ContentAccessLevel>("ALL");
  const [items, setItems] = useState(rows);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const groups = useMemo(() => {
    const source = selectedType === "ALL" ? items : items.filter((item) => item.contentType === selectedType);
    return Array.from(new Set(source.map((item) => item.group))).sort((a, b) => a.localeCompare(b, "zh-CN"));
  }, [items, selectedType]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      database: items.filter((item) => item.source === "DATABASE").length,
      public: items.filter((item) => item.access === "PUBLIC").length,
      member: items.filter((item) => item.access === "MEMBER").length,
      vip: items.filter((item) => item.access === "VIP" || item.access === "VIP_PLUS").length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchKeyword = !keyword || `${item.title} ${item.description} ${item.contentKey} ${item.group}`.toLowerCase().includes(keyword);
      const matchType = selectedType === "ALL" || item.contentType === selectedType;
      const matchGroup = selectedGroup === "ALL" || item.group === selectedGroup;
      const matchAccess = selectedAccess === "ALL" || item.access === selectedAccess;
      return matchKeyword && matchType && matchGroup && matchAccess;
    });
  }, [items, query, selectedAccess, selectedGroup, selectedType]);

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
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          {[
            ["总内容", stats.total],
            ["已配置", stats.database],
            ["公开", stats.public],
            ["登录可看", stats.member],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs font-black text-slate-400">{label}</p>
              <p className="mt-1 text-2xl font-black">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-b border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60 lg:border-b-0 lg:border-r">
          <div>
            <p className="px-2 text-xs font-black uppercase text-slate-400">内容类型</p>
            <div className="mt-2 space-y-1">
              {typeFilters.map((filter) => {
                const active = selectedType === filter.key;
                const count = filter.key === "ALL" ? items.length : items.filter((item) => item.contentType === filter.key).length;
                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => {
                      setSelectedType(filter.key);
                      setSelectedGroup("ALL");
                    }}
                    className={cn(
                      "flex h-10 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-black transition",
                      active
                        ? "bg-slate-950 text-amber-300 dark:bg-white dark:text-slate-950"
                        : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900"
                    )}
                  >
                    <span>{filter.label}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs", active ? "bg-white/10" : "bg-white text-slate-400 dark:bg-slate-900")}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            <p className="px-2 text-xs font-black uppercase text-slate-400">分类</p>
            <div className="mt-2 max-h-[360px] space-y-1 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => setSelectedGroup("ALL")}
                className={cn(
                  "flex h-10 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-black transition",
                  selectedGroup === "ALL"
                    ? "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
                    : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900"
                )}
              >
                全部分类
                <span className="text-xs text-slate-400">{groups.length}</span>
              </button>
              {groups.map((group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => setSelectedGroup(group)}
                  className={cn(
                    "flex min-h-10 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-black transition",
                    selectedGroup === group
                      ? "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
                      : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900"
                  )}
                >
                  <span className="line-clamp-1">{group}</span>
                  <span className="text-xs text-slate-400">
                    {items.filter((item) => item.group === group && (selectedType === "ALL" || item.contentType === selectedType)).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="px-2 text-xs font-black uppercase text-slate-400">权限</p>
            <select
              value={selectedAccess}
              onChange={(event) => setSelectedAccess(event.target.value as "ALL" | ContentAccessLevel)}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-black outline-none transition focus:border-amber-300 dark:border-slate-800 dark:bg-slate-900"
            >
              <option value="ALL">全部权限</option>
              {accessOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
            </select>
          </div>
        </aside>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <div className="flex items-center justify-between gap-3 px-5 py-3 text-sm font-bold text-slate-500 dark:text-slate-400">
            <span>当前显示 {filtered.length} 条</span>
            <span className="hidden sm:inline">VIP/SVIP 限制内容 {stats.vip} 条</span>
          </div>
          {filtered.map((row) => {
          const rowKey = `${row.contentType}:${row.contentKey}`;
          const isSaving = savingKey === rowKey;
          const TypeIcon = typeIcons[row.contentType];
          return (
            <div key={rowKey} className="grid gap-4 p-5 xl:grid-cols-[minmax(0,1fr)_180px_minmax(260px,0.9fr)_auto] xl:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    <TypeIcon className="mr-1 inline h-3 w-3" />
                    {typeLabels[row.contentType]}
                  </span>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
                    {row.group}
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
          {filtered.length === 0 && (
            <p className="p-8 text-sm font-bold text-slate-500 dark:text-slate-400">没有找到匹配内容。</p>
          )}
        </div>
      </div>
    </section>
  );
}
