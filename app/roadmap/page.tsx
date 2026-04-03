"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Clock, BookOpen, Brain } from "lucide-react";
import MindMapCanvas from "@/components/MindMapCanvas";
import { roadmaps, type RoadmapCategory } from "@/lib/roadmaps-data";

// Category definitions
const categoryConfig: Record<RoadmapCategory, { label: string; icon: string }> = {
  investment:       { label: "投资理财",    icon: "💰" },
  us_stocks:        { label: "美股市场",    icon: "📈" },
  web3:             { label: "Web3 探索",  icon: "🌐" },
  index_investing:  { label: "指数投资",    icon: "📊" },
  overseas_earning: { label: "出海赚钱",    icon: "💸" },
  ai_zone:          { label: "AI 学习专区", icon: "🤖" },
};

interface RoadmapCategoryGroup {
  id: string;
  label: string;
  emoji: string;
  items: (typeof roadmaps)[number][];
}

const roadmapCategories: RoadmapCategoryGroup[] = [
  { id: "investment",       label: "投资理财",    emoji: "💰", items: roadmaps.filter(r => r.category === "investment") },
  { id: "us_stocks",        label: "美股市场",    emoji: "📈", items: roadmaps.filter(r => r.category === "us_stocks") },
  { id: "web3",             label: "Web3 探索",  emoji: "🌐", items: roadmaps.filter(r => r.category === "web3") },
  { id: "index_investing",  label: "指数投资",    emoji: "📊", items: roadmaps.filter(r => r.category === "index_investing") },
  { id: "overseas_earning", label: "出海赚钱",    emoji: "💸", items: roadmaps.filter(r => r.category === "overseas_earning") },
  { id: "ai_zone",          label: "AI 学习专区", emoji: "🤖", items: roadmaps.filter(r => r.category === "ai_zone") },
];

// 每个分类对应的色系
const categoryAccent: Record<RoadmapCategory, { dot: string; badge: string; badgeText: string; glow: string }> = {
  investment:       { dot: "bg-amber-400",   badge: "bg-amber-100 dark:bg-amber-900/30",   badgeText: "text-amber-700 dark:text-amber-400",   glow: "group-hover:shadow-amber-100 dark:group-hover:shadow-amber-900/20" },
  us_stocks:        { dot: "bg-indigo-400",  badge: "bg-indigo-100 dark:bg-indigo-900/30",  badgeText: "text-indigo-700 dark:text-indigo-400",  glow: "group-hover:shadow-indigo-100 dark:group-hover:shadow-indigo-900/20" },
  web3:             { dot: "bg-blue-400",    badge: "bg-blue-100 dark:bg-blue-900/30",      badgeText: "text-blue-700 dark:text-blue-400",      glow: "group-hover:shadow-blue-100 dark:group-hover:shadow-blue-900/20" },
  index_investing:  { dot: "bg-emerald-400", badge: "bg-emerald-100 dark:bg-emerald-900/30",badgeText: "text-emerald-700 dark:text-emerald-400",glow: "group-hover:shadow-emerald-100 dark:group-hover:shadow-emerald-900/20" },
  overseas_earning: { dot: "bg-violet-400",  badge: "bg-violet-100 dark:bg-violet-900/30",  badgeText: "text-violet-700 dark:text-violet-400",  glow: "group-hover:shadow-violet-100 dark:group-hover:shadow-violet-900/20" },
  ai_zone:          { dot: "bg-rose-400",    badge: "bg-rose-100 dark:bg-rose-900/30",      badgeText: "text-rose-700 dark:text-rose-400",      glow: "group-hover:shadow-rose-100 dark:group-hover:shadow-rose-900/20" },
};

// Roadmap Card Component
function RoadmapCard({ roadmap, index }: { roadmap: (typeof roadmaps)[0]; index: number }) {
  const config = categoryConfig[roadmap.category];
  const accent = categoryAccent[roadmap.category];
  const maxDots = 6;
  const stepCount = roadmap.steps.length;
  const dots = Math.min(stepCount, maxDots);

  return (
    <Link
      href={`/roadmap/${roadmap.id}`}
      className={`group block h-full roadmap-card-enter`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className={`relative h-full flex flex-col rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${accent.glow}`}>
        {/* 顶部彩色 accent 条 */}
        <div className={`h-1 w-full ${accent.dot} opacity-80`} />

        <div className="flex flex-col flex-1 p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="text-3xl leading-none">{roadmap.icon}</div>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${accent.badge} ${accent.badgeText}`}>
              {config.label}
            </span>
          </div>

          {/* Title */}
          <h2 className="font-bold text-[17px] leading-snug text-slate-900 dark:text-white mb-2 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
            {roadmap.title}
          </h2>

          {/* Description */}
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed flex-1">
            {roadmap.description}
          </p>

          {/* Step nodes visualization */}
          <div className="mt-4 mb-3">
            <div className="flex items-center gap-0">
              {Array.from({ length: dots }).map((_, i) => (
                <div key={i} className="flex items-center">
                  <div className={`w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ring-1 ring-offset-0 transition-all duration-200 ${
                    i < Math.ceil(dots / 2)
                      ? `${accent.dot} ring-current`
                      : "bg-slate-200 dark:bg-slate-700 ring-slate-200 dark:ring-slate-700"
                  }`} />
                  {i < dots - 1 && (
                    <div className={`h-px w-5 ${i < Math.ceil(dots / 2) - 1 ? accent.dot + " opacity-60" : "bg-slate-200 dark:bg-slate-700"}`} />
                  )}
                </div>
              ))}
              {stepCount > maxDots && (
                <span className="ml-2 text-[10px] text-slate-400">+{stepCount - maxDots}</span>
              )}
            </div>
          </div>

          {/* Footer meta */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {stepCount} 步骤
              </span>
              {roadmap.estimatedTotalTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {roadmap.estimatedTotalTime}
                </span>
              )}
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function RoadmapPage() {
  const searchParams = useSearchParams();
  const initialView = searchParams.get("view") === "cards" ? (roadmapCategories[0]?.id || "investment") : "mindmap";

  const [viewMode, setViewMode] = useState<"mindmap" | string>(initialView);
  const [activeCategory, setActiveCategory] = useState<string>(roadmapCategories[0]?.id || "");
  const pendingCategoryRef = useRef<string | null>(null);

  const scrollToSection = (categoryId: string) => {
    const el = document.getElementById(categoryId);
    if (!el) return;
    const offsetPos = el.getBoundingClientRect().top + window.pageYOffset - 80;
    window.scrollTo({ top: offsetPos, behavior: "smooth" });
  };

  // Scroll-spy — only when showing cards
  useEffect(() => {
    if (viewMode === "mindmap") return;
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const mid = window.innerHeight / 2 + 100;
          for (const cat of roadmapCategories) {
            const el = document.getElementById(cat.id);
            if (!el) continue;
            const { top, bottom } = el.getBoundingClientRect();
            if (top <= mid && bottom >= mid) { setActiveCategory(cat.id); break; }
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [viewMode]);

  // After switching from mindmap → cards, scroll to the clicked category
  useEffect(() => {
    if (viewMode !== "mindmap" && pendingCategoryRef.current) {
      const catId = pendingCategoryRef.current;
      pendingCategoryRef.current = null;
      setTimeout(() => scrollToSection(catId), 80);
    }
  }, [viewMode]);

  const handleCategoryClick = (categoryId: string) => {
    if (viewMode === "mindmap") {
      pendingCategoryRef.current = categoryId;
      setActiveCategory(categoryId);
      setViewMode(categoryId);
    } else {
      setActiveCategory(categoryId);
      scrollToSection(categoryId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative dot-grid">
      {/* 点阵背景由 .dot-grid 伪元素提供 */}
      <div className={`flex items-start relative pt-0 ${viewMode === "mindmap" ? "w-full" : "max-w-[1400px] mx-auto"}`}>

        {/* ── LEFT SIDEBAR ── */}
        <aside className="w-48 shrink-0 sticky top-16 pt-6 self-start max-h-[calc(100vh-64px)] overflow-y-auto border-r border-transparent hidden md:block scrollbar-hide">
          <div className="px-2">
            <h2 className="px-2 text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">路线分类</h2>
            <nav className="space-y-1 px-2 flex flex-col items-center">

              {/* 投资脑图 — toggles back to mindmap view */}
              <button
                onClick={() => setViewMode("mindmap")}
                className={`flex items-center justify-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 mb-1 ${
                  viewMode === "mindmap"
                    ? "bg-amber-100 border border-amber-300 text-amber-900 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300"
                    : "bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-400 dark:hover:bg-amber-900/40"
                }`}
              >
                <Brain className="w-4 h-4 flex-shrink-0" />
                投资脑图
              </button>

              <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-1" />

              {roadmapCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`directory-nav-button ${
                    viewMode !== "mindmap" && activeCategory === category.id
                      ? "directory-nav-button-active directory-nav-active"
                      : ""
                  }`}
                >
                  <span className="mr-2">{category.emoji}</span>
                  {category.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 min-w-0 flex flex-col">
          {viewMode === "mindmap" ? (
            /* Embedded mind map — rendered directly, no iframe */
            <div style={{ height: "calc(100vh - 64px)" }}>
              <MindMapCanvas embedded={true} />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="relative px-8 pt-8 pb-6">
                <div className="flex items-end justify-between flex-wrap gap-4">
                  <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">学习路线</h1>
                    <p className="mt-1.5 text-slate-500 dark:text-slate-400 text-sm max-w-md">
                      系统化的学习路径，从零基础到进阶，一步步掌握投资和 Web3 的核心技能
                    </p>
                  </div>
                  {/* Stats */}
                  <div className="flex items-center gap-1">
                    {[
                      { value: roadmaps.length, label: "条路线" },
                      { value: roadmapCategories.filter(c => c.items.length > 0).length, label: "个分类" },
                      { value: roadmaps.reduce((s, r) => s + r.steps.length, 0), label: "个步骤" },
                    ].map((stat, i) => (
                      <div key={stat.label} className="flex items-center gap-1">
                        {i > 0 && <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2" />}
                        <div className="text-center px-2">
                          <div className="text-xl font-black text-slate-800 dark:text-slate-100">{stat.value}</div>
                          <div className="text-[11px] text-slate-400">{stat.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cards — 斑马纹分区 */}
              <div className="content-fade-in pb-16">
                {roadmapCategories.filter(c => c.items.length > 0).map((category, sectionIdx) => {
                  const accent = categoryAccent[category.id as RoadmapCategory];
                  const isEven = sectionIdx % 2 === 0;
                  return (
                    <section
                      key={category.id}
                      id={category.id}
                      className="scroll-mt-20 py-7 px-6 md:px-8"
                    >
                      {/* 分类标题 */}
                      <div className="flex items-center gap-3 mb-5">
                        <div className={`w-1 h-6 rounded-full ${accent.dot}`} />
                        <span className="text-xl leading-none">{category.emoji}</span>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">{category.label}</h2>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${accent.badge} ${accent.badgeText}`}>
                          {category.items.length} 条路线
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {category.items.map((roadmap, idx) => (
                          <RoadmapCard key={roadmap.id} roadmap={roadmap} index={idx} />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
