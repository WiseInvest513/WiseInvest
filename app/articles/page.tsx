"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ChevronDown, ChevronRight, BookOpen, Clock, Calendar,
  Library, ArrowRight, Search,
} from "lucide-react";
import { articles as hardcodedArticles, categories, type Article } from "@/lib/articles-data";
import type { FsArticle } from "@/lib/articles-fs";
import { cn } from "@/lib/utils";
import { extractToc, renderMarkdown, genUid } from "@/lib/article-renderer";

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
  const [allArticles, setAllArticles] = useState<(Article | FsArticle)[]>(hardcodedArticles);

  useEffect(() => {
    fetch("/api/articles-fs")
      .then(r => r.json())
      .then((fsArticles: FsArticle[]) => {
        // Merge: FS articles override hardcoded ones with the same id
        const fsIds = new Set(fsArticles.map(a => a.id));
        const merged = [...hardcodedArticles.filter(a => !fsIds.has(a.id)), ...fsArticles];
        setAllArticles(merged);
      })
      .catch(() => {});
  }, []);

  // Auto-select article from URL on load
  useEffect(() => {
    if (!allArticles.length) return;
    const match = window.location.pathname.match(/^\/articles\/([^/]+)\/([a-zA-Z0-9]{8})$/);
    if (!match) return;
    const [, catId, uid] = match;
    const found = allArticles.find(a => a.categoryId === catId && genUid(a.id) === uid);
    if (found && !selectedArticleId) {
      setSelectedArticleId(found.id);
      setOpenCategories(prev => new Set([...prev, catId]));
    }
  }, [allArticles]);

  const selectedArticle = useMemo(() => allArticles.find(a => a.id === selectedArticleId) ?? null, [selectedArticleId, allArticles]);
  const toc = useMemo(() => selectedArticle ? extractToc(selectedArticle.content) : [], [selectedArticle]);
  const activeId = useActiveToc(toc);

  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return allArticles;
    const q = searchQuery.toLowerCase();
    return allArticles.filter(a => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q));
  }, [searchQuery, allArticles]);

  const articlesByCategory = useMemo(() => {
    const map = new Map<string, (Article | FsArticle)[]>();
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
    window.history.pushState(null, "", `/articles/${catId}/${genUid(id)}`);
  };

  useEffect(() => { contentRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [selectedArticleId]);

  const renderedContent = useMemo(
    () => selectedArticle ? renderMarkdown(selectedArticle.content, toc) : null,
    [selectedArticle, toc]
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="w-full flex h-[calc(100vh-64px)]">

        {/* ══ LEFT SIDEBAR ═══════════════════════════════ */}
        <aside className="w-72 shrink-0 flex flex-col border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
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
          <div className="mx-5 h-px bg-slate-100 dark:bg-slate-800" />
          <nav className="flex-1 overflow-y-auto py-3 scrollbar-hide">
            {categories.map(cat => {
              const catArticles = articlesByCategory.get(cat.id) ?? [];
              const isOpen = openCategories.has(cat.id);
              const hasSelected = catArticles.some(a => a.id === selectedArticleId);
              return (
                <div key={cat.id} className="mb-0.5">
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
                            {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-amber-400 rounded-r-full" />}
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
                  <div className="text-sm font-semibold leading-tight">经典文集</div>
                  <div className="text-[11px] text-indigo-500/70 dark:text-indigo-500 mt-0.5 truncate">段永平 · 查理芒格 · 巴菲特</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-80 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </nav>
        </aside>

        {/* ══ CENTER CONTENT ═════════════════════════════ */}
        <main ref={contentRef} className="flex-1 min-w-0 overflow-y-auto" style={{ backgroundImage: "radial-gradient(circle, rgba(148,163,184,0.25) 1.5px, transparent 1.5px)", backgroundSize: "22px 22px" }}>
          {selectedArticle ? (
            <article key={selectedArticleId} className="max-w-6xl mx-auto px-8 py-12">
              <div className="flex items-center gap-2 mb-5">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400">
                  {categories.find(c => c.id === selectedArticle.categoryId)?.emoji}
                  {categories.find(c => c.id === selectedArticle.categoryId)?.name}
                </span>
              </div>
              <h1 className="text-[28px] font-bold text-slate-900 dark:text-white leading-snug mb-4 tracking-tight">
                {selectedArticle.title}
              </h1>
              <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed mb-5 border-l-2 border-slate-200 dark:border-slate-700 pl-4">
                {selectedArticle.summary}
              </p>
              <div className="flex items-center gap-5 text-xs text-slate-400 pb-7 border-b border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{selectedArticle.date}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />约 {selectedArticle.readTime} 分钟阅读</span>
              </div>
              <div className="mt-8">{renderedContent}</div>
            </article>
          ) : (
            <div className="h-full flex flex-col items-center justify-center px-8 py-16">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center mb-6 shadow-lg shadow-amber-200 dark:shadow-amber-900/30">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2 tracking-tight">选择一篇文章开始阅读</h2>
              <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm text-center leading-relaxed mb-12">
                从左侧按分类浏览所有文章，点击后在此处本地阅读，无需跳转外部链接。
              </p>
              <div className="grid grid-cols-2 gap-4 w-full max-w-xl mb-6">
                {allArticles.slice(0, 4).map(art => {
                  const cat = categories.find(c => c.id === art.categoryId);
                  return (
                    <button
                      key={art.id}
                      onClick={() => selectArticle(art.id, art.categoryId)}
                      className="text-left p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md hover:shadow-amber-100/50 dark:hover:shadow-amber-900/20 transition-all duration-200 group"
                    >
                      <div className="text-2xl mb-3">{cat?.emoji}</div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors leading-snug mb-2">{art.title}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-600 flex items-center gap-1"><Clock className="w-3 h-3" />{art.readTime} 分钟</div>
                    </button>
                  );
                })}
              </div>
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
        <aside className="w-72 shrink-0 border-l border-slate-200/80 dark:border-slate-800 hidden lg:flex flex-col bg-white dark:bg-slate-900">
          <div className="px-5 pt-6 pb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-900 dark:text-slate-100">本页目录</p>
          </div>
          <nav className="flex-1 overflow-y-auto pb-8 scrollbar-hide">
            {toc.length > 0 ? (
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-800" />
                {toc.map(item => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={e => { e.preventDefault(); document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" }); }}
                    className={cn(
                      "relative flex items-start pl-8 pr-4 py-1.5 text-sm leading-snug transition-all duration-150",
                      item.level >= 3 && "pl-12",
                      activeId === item.id
                        ? "text-amber-600 dark:text-amber-400 font-semibold"
                        : "text-slate-900 dark:text-slate-100 hover:text-amber-600 dark:hover:text-amber-400"
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
              <p className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400 italic leading-relaxed">
                {selectedArticle ? "暂无目录" : "选择文章后显示目录"}
              </p>
            )}
          </nav>
        </aside>

      </div>
    </div>
  );
}
