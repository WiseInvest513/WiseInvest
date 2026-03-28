"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Clock, BookOpen, Brain } from "lucide-react";
import MindMapCanvas from "@/components/MindMapCanvas";
import { roadmaps, type RoadmapCategory } from "@/lib/roadmaps-data";
import { SectionCardShell } from "@/components/sections/SectionCardShell";

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

// Roadmap Card Component
function RoadmapCard({ roadmap, index }: { roadmap: (typeof roadmaps)[0]; index: number }) {
  const config = categoryConfig[roadmap.category];
  return (
    <Link href={`/roadmap/${roadmap.id}`} className="block h-full roadmap-card-enter" style={{ animationDelay: `${index * 60}ms` }}>
      <SectionCardShell className="h-full" contentClassName="p-6 rounded-xl flex flex-col h-full"
        watermarkNode={
          <svg viewBox="0 0 120 120" className="w-full h-full" aria-hidden>
            <circle cx="60" cy="60" r="52" fill="none" stroke="#374151" strokeWidth="1.5"/>
            <circle cx="60" cy="60" r="36" fill="none" stroke="#374151" strokeWidth="1"/>
            <circle cx="60" cy="60" r="18" fill="#374151"/>
          </svg>
        }
      >
        <div className="flex items-start justify-between mb-4">
          <div className="text-4xl">{roadmap.icon}</div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {config.label}
          </span>
        </div>
        <h2 className="font-bold text-xl text-slate-900 dark:text-slate-50 mb-2 group-hover:text-amber-700 dark:group-hover:text-amber-500 transition-colors">
          {roadmap.title}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 flex-1 line-clamp-2">{roadmap.description}</p>
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{roadmap.steps.length} 个步骤</span>
            </div>
            {roadmap.estimatedTotalTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{roadmap.estimatedTotalTime}</span>
              </div>
            )}
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
        </div>
      </SectionCardShell>
    </Link>
  );
}

export default function RoadmapPage() {
  // "mindmap" = show embedded mind map; anything else = category id showing cards
  const [viewMode, setViewMode] = useState<"mindmap" | string>("mindmap");
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
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className={`flex items-start relative pt-0 ${viewMode === "mindmap" ? "w-full" : "max-w-[1520px] mx-auto"}`}>

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
              {/* Sticky header */}
              <div className="sticky top-16 z-20 bg-white/95 dark:bg-slate-950/95 backdrop-blur pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 transition-all">
                <div className="px-6 md:px-8">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-baseline gap-4">
                      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">学习路线</h1>
                      <span className="text-slate-500 dark:text-slate-400 text-sm">
                        共 <span className="font-semibold text-slate-900 dark:text-slate-50">{roadmaps.length}</span> 个路线图
                      </span>
                    </div>
                    <p className="text-base text-slate-600 dark:text-slate-400">
                      系统化的学习路径，从零基础到进阶，一步步掌握投资和 Web3 的核心技能
                    </p>
                  </div>
                </div>
              </div>

              {/* Cards */}
              <div className="content-fade-in px-6 md:px-8 pb-20 pt-6">
                {roadmapCategories.map(category => (
                  <section key={category.id} id={category.id} className="mb-16 scroll-mt-24">
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                        <span className="text-2xl">{category.emoji}</span>
                        {category.label}
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">共 {category.items.length} 个路线图</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {category.items.map((roadmap, idx) => (
                        <RoadmapCard key={roadmap.id} roadmap={roadmap} index={idx} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
