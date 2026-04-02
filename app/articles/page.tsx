"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ChevronDown, ChevronRight, BookOpen, Clock, Calendar,
  Library, ArrowRight, Search,
} from "lucide-react";
import { articles, categories, type Article } from "@/lib/articles-data";
import { cn } from "@/lib/utils";

// ─── TOC 提取 ──────────────────────────────────────────────
function extractToc(content: string) {
  const toc: { id: string; text: string; level: number }[] = [];
  let idx = 0;
  content.split("\n").forEach((line) => {
    const m = line.match(/^(#{1,4})\s+(.+)/);
    if (m) toc.push({ id: `h-${idx++}`, text: m[2].replace(/\*\*/g, ""), level: m[1].length });
  });
  return toc;
}

// ─── Inline markdown (bold / code) ────────────────────────
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|`(.+?)`/g;
  let lastIdx = 0; let key = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push(<span key={key++}>{text.slice(lastIdx, match.index)}</span>);
    if (match[1] != null) parts.push(<strong key={key++} className="font-semibold text-slate-900 dark:text-white">{match[1]}</strong>);
    else if (match[2] != null) parts.push(<code key={key++} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono text-amber-700 dark:text-amber-400">{match[2]}</code>);
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) parts.push(<span key={key++}>{text.slice(lastIdx)}</span>);
  return <>{parts}</>;
}

// ─── Markdown Renderer ─────────────────────────────────────
function renderMarkdown(content: string, toc: { id: string; text: string; level: number }[]) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let tocIdx = 0; let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // heading
    const hm = trimmed.match(/^(#{1,4})\s+(.+)/);
    if (hm) {
      const level = hm[1].length;
      const text = hm[2].replace(/\*\*/g, "");
      const id = toc[tocIdx]?.id ?? `h-${tocIdx}`; tocIdx++;
      const cls = {
        1: "text-2xl font-bold text-slate-900 dark:text-white mt-10 mb-4 scroll-mt-24",
        2: "text-xl font-bold text-slate-800 dark:text-slate-100 mt-8 mb-3 scroll-mt-24",
        3: "text-lg font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-2 scroll-mt-24",
        4: "text-base font-semibold text-slate-700 dark:text-slate-300 mt-4 mb-2 scroll-mt-24",
      }[level] ?? "";
      const Tag = `h${level}` as "h1"|"h2"|"h3"|"h4";
      elements.push(<Tag key={i} id={id} className={cls}>{text}</Tag>);
      i++; continue;
    }

    // hr
    if (trimmed === "---") { elements.push(<hr key={i} className="my-8 border-slate-100 dark:border-slate-800" />); i++; continue; }

    // code block
    if (trimmed.startsWith("```")) {
      const block: string[] = []; i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) { block.push(lines[i]); i++; }
      elements.push(
        <pre key={i} className="my-5 rounded-xl bg-slate-900 dark:bg-slate-950 p-5 overflow-x-auto border border-slate-800">
          <code className="text-[13px] font-mono text-slate-300 leading-7">{block.join("\n")}</code>
        </pre>
      );
      i++; continue;
    }

    // blockquote
    if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="my-5 pl-5 border-l-4 border-amber-400 bg-amber-50/50 dark:bg-amber-900/10 py-3 pr-4 rounded-r-lg text-slate-600 dark:text-slate-400 italic">
          {renderInline(trimmed.slice(2))}
        </blockquote>
      );
      i++; continue;
    }

    // table
    if (trimmed.startsWith("|") && i + 1 < lines.length && lines[i+1].trim().match(/^\|[-| :]+\|$/)) {
      const headerCells = trimmed.split("|").filter(Boolean).map(c => c.trim());
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(lines[i].trim().split("|").filter(Boolean).map(c => c.trim())); i++;
      }
      elements.push(
        <div key={i} className="my-5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr>{headerCells.map((h,j) => <th key={j} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row, ri) => (
                <tr key={ri} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  {row.map((cell, ci) => <td key={ci} className="px-5 py-3 text-slate-700 dark:text-slate-300">{renderInline(cell)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // unordered list
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))) { items.push(lines[i].trim().slice(2)); i++; }
      elements.push(
        <ul key={i} className="my-4 space-y-2 pl-5">
          {items.map((it, j) => <li key={j} className="text-slate-700 dark:text-slate-300 leading-7 list-disc marker:text-amber-400">{renderInline(it)}</li>)}
        </ul>
      );
      continue;
    }

    // ordered list
    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^\d+\.\s/, "")); i++; }
      elements.push(
        <ol key={i} className="my-4 space-y-2 pl-5 list-decimal marker:text-amber-500 marker:font-semibold">
          {items.map((it, j) => <li key={j} className="text-slate-700 dark:text-slate-300 leading-7">{renderInline(it)}</li>)}
        </ol>
      );
      continue;
    }

    if (!trimmed) { elements.push(<div key={i} className="h-2" />); i++; continue; }

    elements.push(
      <p key={i} className="my-3 text-[15px] text-slate-600 dark:text-slate-400 leading-8">{renderInline(trimmed)}</p>
    );
    i++;
  }
  return elements;
}

// ─── Active TOC hook ───────────────────────────────────────
function useActiveToc(toc: { id: string }[]) {
  const [activeId, setActiveId] = useState("");
  useEffect(() => {
    if (!toc.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        let best = { id: "", ratio: 0 };
        entries.forEach(e => { if (e.isIntersecting && e.intersectionRatio > best.ratio) best = { id: e.target.id, ratio: e.intersectionRatio }; });
        if (best.id) setActiveId(best.id);
      },
      { rootMargin: "-15% 0px -60% 0px", threshold: [0, 0.5, 1] }
    );
    toc.forEach(({ id }) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [toc]);
  return activeId;
}

// ─── Main Component ────────────────────────────────────────
export default function ArticlesPage() {
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(["crypto"]));
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  const selectedArticle = useMemo(() => articles.find(a => a.id === selectedArticleId) ?? null, [selectedArticleId]);
  const toc = useMemo(() => selectedArticle ? extractToc(selectedArticle.content) : [], [selectedArticle]);
  const activeId = useActiveToc(toc);

  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return articles;
    const q = searchQuery.toLowerCase();
    return articles.filter(a => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q));
  }, [searchQuery]);

  const articlesByCategory = useMemo(() => {
    const map = new Map<string, Article[]>();
    filteredArticles.forEach(a => { if (!map.has(a.categoryId)) map.set(a.categoryId, []); map.get(a.categoryId)!.push(a); });
    return map;
  }, [filteredArticles]);

  const toggleCategory = (id: string) => {
    setOpenCategories(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const selectArticle = (id: string, catId: string) => {
    setSelectedArticleId(id);
    setOpenCategories(prev => new Set([...prev, catId]));
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => { contentRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [selectedArticleId]);

  const renderedContent = useMemo(
    () => selectedArticle ? renderMarkdown(selectedArticle.content, toc) : null,
    [selectedArticle, toc]
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* ══ 内容更新中遮罩 ══ */}
      <div className="fixed inset-x-0 bottom-0 top-16 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl px-12 py-10 flex flex-col items-center gap-4 max-w-sm w-full mx-4">
          <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-3xl">🛠️</div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center">内容正在更新中</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center leading-relaxed">尽情期待</p>
        </div>
      </div>

      <div className="w-full flex h-[calc(100vh-64px)]">

        {/* ══ LEFT SIDEBAR ═══════════════════════════════ */}
        <aside className="w-72 shrink-0 flex flex-col border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">

          {/* Header */}
          <div className="px-5 pt-6 pb-4">
            <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mb-4">文章</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索文章..."
                className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="mx-5 h-px bg-slate-100 dark:bg-slate-800" />

          {/* Category tree */}
          <nav className="flex-1 overflow-y-auto py-3 scrollbar-hide">
            {categories.map(cat => {
              const catArticles = articlesByCategory.get(cat.id) ?? [];
              const isOpen = openCategories.has(cat.id);
              const hasSelected = catArticles.some(a => a.id === selectedArticleId);

              return (
                <div key={cat.id} className="mb-0.5">
                  {/* Category button */}
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors",
                      hasSelected
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    )}
                  >
                    <span className="text-base leading-none">{cat.emoji}</span>
                    <span className="flex-1 text-left">{cat.name}</span>
                    {catArticles.length > 0 && (
                      <span className={cn(
                        "text-[11px] font-medium tabular-nums px-1.5 py-0.5 rounded-full",
                        hasSelected
                          ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                      )}>{catArticles.length}</span>
                    )}
                    <span className="text-slate-400 dark:text-slate-600">
                      {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </span>
                  </button>

                  {/* Article list */}
                  {isOpen && (
                    <div className="mb-1">
                      {catArticles.map(art => {
                        const isActive = selectedArticleId === art.id;
                        return (
                          <button
                            key={art.id}
                            onClick={() => selectArticle(art.id, cat.id)}
                            className={cn(
                              "w-full text-left px-5 pl-[3.25rem] py-2.5 text-sm transition-all duration-150 relative",
                              isActive
                                ? "text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/15 font-medium"
                                : "text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                            )}
                          >
                            {isActive && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-amber-400 rounded-r-full" />
                            )}
                            <span className="line-clamp-2 leading-snug">{art.title}</span>
                            <span className="flex items-center gap-1 mt-1 text-[11px] text-slate-400 dark:text-slate-600">
                              <Clock className="w-2.5 h-2.5" />{art.readTime} 分钟
                            </span>
                          </button>
                        );
                      })}
                      {catArticles.length === 0 && (
                        <p className="pl-[3.25rem] py-2 text-xs text-slate-400 italic">暂无匹配</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 文集入口 */}
            <div className="px-4 mt-4 mb-2">
              <div className="h-px bg-slate-100 dark:bg-slate-800 mb-4" />
              <Link
                href="/anthology"
                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50 to-indigo-50/30 dark:from-indigo-950/40 dark:to-slate-900 text-indigo-700 dark:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 hover:from-indigo-100 transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center shrink-0">
                  <Library className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold leading-none mb-1">经典文集</div>
                  <div className="text-[11px] text-indigo-400 dark:text-indigo-600 leading-none truncate">段永平 · 芒格 · 巴菲特</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-80 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </nav>
        </aside>

        {/* ══ CENTER CONTENT ═════════════════════════════ */}
        <main ref={contentRef} className="flex-1 min-w-0 overflow-y-auto" style={{ backgroundImage: "radial-gradient(circle, rgba(148,163,184,0.25) 1.5px, transparent 1.5px)", backgroundSize: "22px 22px" }}>
          {selectedArticle ? (
            <article className="max-w-4xl mx-auto px-12 py-12">
              {/* Category badge */}
              <div className="flex items-center gap-2 mb-5">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400">
                  {categories.find(c => c.id === selectedArticle.categoryId)?.emoji}
                  {categories.find(c => c.id === selectedArticle.categoryId)?.name}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-[28px] font-bold text-slate-900 dark:text-white leading-snug mb-4 tracking-tight">
                {selectedArticle.title}
              </h1>

              {/* Summary */}
              <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed mb-5 border-l-2 border-slate-200 dark:border-slate-700 pl-4">
                {selectedArticle.summary}
              </p>

              {/* Meta */}
              <div className="flex items-center gap-5 text-xs text-slate-400 pb-7 border-b border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{selectedArticle.date}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />约 {selectedArticle.readTime} 分钟阅读</span>
              </div>

              {/* Body */}
              <div className="mt-8">{renderedContent}</div>
            </article>
          ) : (
            /* ── Welcome screen ── */
            <div className="h-full flex flex-col items-center justify-center px-8 py-16">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center mb-6 shadow-lg shadow-amber-200 dark:shadow-amber-900/30">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2 tracking-tight">
                选择一篇文章开始阅读
              </h2>
              <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm text-center leading-relaxed mb-12">
                从左侧按分类浏览所有文章，点击后在此处本地阅读，无需跳转外部链接。
              </p>

              {/* Quick picks grid */}
              <div className="grid grid-cols-2 gap-4 w-full max-w-xl mb-6">
                {articles.slice(0, 4).map(art => {
                  const cat = categories.find(c => c.id === art.categoryId);
                  return (
                    <button
                      key={art.id}
                      onClick={() => selectArticle(art.id, art.categoryId)}
                      className="text-left p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md hover:shadow-amber-100/50 dark:hover:shadow-amber-900/20 transition-all duration-200 group"
                    >
                      <div className="text-2xl mb-3">{cat?.emoji}</div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors leading-snug mb-2">
                        {art.title}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{art.readTime} 分钟
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 文集 card */}
              <Link
                href="/anthology"
                className="flex items-center gap-4 w-full max-w-xl p-5 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-950/30 dark:to-slate-900 hover:border-indigo-400 dark:hover:border-indigo-700 hover:shadow-md transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center shrink-0">
                  <Library className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-indigo-800 dark:text-indigo-300 mb-0.5">经典文集</div>
                  <div className="text-xs text-indigo-500/80 dark:text-indigo-500">段永平 · 查理芒格 · 巴菲特 · 经典演讲与著作</div>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}
        </main>

        {/* ══ RIGHT TOC ══════════════════════════════════ */}
        <aside className="w-56 shrink-0 border-l border-slate-200/80 dark:border-slate-800 hidden lg:flex flex-col bg-white dark:bg-slate-900">
          <div className="px-5 pt-6 pb-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600">
              本页目录
            </p>
          </div>
          <nav className="flex-1 overflow-y-auto pb-8 scrollbar-hide">
            {toc.length > 0 ? (
              <div className="relative">
                {/* Track line */}
                <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-800" />
                {toc.map(item => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={e => { e.preventDefault(); document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" }); }}
                    className={cn(
                      "relative flex items-start pl-8 pr-4 py-1.5 text-xs leading-snug transition-all duration-150",
                      item.level >= 3 && "pl-12",
                      activeId === item.id
                        ? "text-amber-600 dark:text-amber-400 font-medium"
                        : "text-slate-400 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-400"
                    )}
                  >
                    {activeId === item.id && (
                      <span className="absolute left-[17px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white dark:ring-slate-900" />
                    )}
                    {item.text}
                  </a>
                ))}
              </div>
            ) : (
              <p className="px-5 py-3 text-[11px] text-slate-400 dark:text-slate-600 italic leading-relaxed">
                {selectedArticle ? "暂无目录" : "选择文章后\n显示目录"}
              </p>
            )}
          </nav>
        </aside>

      </div>
    </div>
  );
}
