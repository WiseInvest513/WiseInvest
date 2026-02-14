"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Clock, BookOpen } from "lucide-react";
import { roadmaps, type RoadmapCategory } from "@/lib/roadmaps-data";
import { SectionCardShell } from "@/components/sections/SectionCardShell";

// Category definitions
const categoryConfig: Record<
  RoadmapCategory,
  { label: string; icon: string }
> = {
  investment: {
    label: "投资理财",
    icon: "💰",
  },
  us_stocks: {
    label: "美股市场",
    icon: "📈",
  },
  web3: {
    label: "Web3 探索",
    icon: "🌐",
  },
  index_investing: {
    label: "指数投资",
    icon: "📊",
  },
  overseas_earning: {
    label: "出海赚钱",
    icon: "💸",
  },
};

// Group roadmaps by category (similar to resources/perks/tools structure)
interface RoadmapCategoryGroup {
  id: string;
  label: string;
  emoji: string;
  items: (typeof roadmaps)[number][];
}

const roadmapCategories: RoadmapCategoryGroup[] = [
  {
    id: "investment",
    label: "投资理财",
    emoji: "💰",
    items: roadmaps.filter((r) => r.category === "investment"),
  },
  {
    id: "us_stocks",
    label: "美股市场",
    emoji: "📈",
    items: roadmaps.filter((r) => r.category === "us_stocks"),
  },
  {
    id: "web3",
    label: "Web3 探索",
    emoji: "🌐",
    items: roadmaps.filter((r) => r.category === "web3"),
  },
  {
    id: "index_investing",
    label: "指数投资",
    emoji: "📊",
    items: roadmaps.filter((r) => r.category === "index_investing"),
  },
  {
    id: "overseas_earning",
    label: "出海赚钱",
    emoji: "💸",
    items: roadmaps.filter((r) => r.category === "overseas_earning"),
  },
];

// Roadmap Card Component
function RoadmapCard({ roadmap }: { roadmap: (typeof roadmaps)[0] }) {
  const config = categoryConfig[roadmap.category];

  return (
    <Link
      href={`/roadmap/${roadmap.id}`}
      className="block h-full"
    >
      <SectionCardShell
        className="h-full"
        contentClassName="p-6 rounded-xl flex flex-col h-full"
        watermarkNode={
          <div className="w-full h-full flex items-center justify-center text-[120px] leading-none text-slate-300 dark:text-slate-700 group-hover:text-yellow-300 transition-colors duration-500">
            {roadmap.icon}
          </div>
        }
      >
        <div className="flex items-start justify-between mb-4">
          <div className="text-4xl">{roadmap.icon}</div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {config.label}
          </span>
        </div>

        <h2 className="font-bold text-xl text-slate-900 dark:text-slate-50 mb-2 group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors">
          {roadmap.title}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 flex-1 line-clamp-2">
          {roadmap.description}
        </p>

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
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-500 group-hover:translate-x-1 transition-all" />
        </div>
      </SectionCardShell>
    </Link>
  );
}

export default function RoadmapPage() {
  const [activeCategory, setActiveCategory] = useState<string>(
    roadmapCategories[0]?.id || ""
  );

  // Handle smooth scroll and active category detection (Optimized with throttle)
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const sections = roadmapCategories
            .map((cat) => {
              const element = document.getElementById(cat.id);
              if (element) {
                const rect = element.getBoundingClientRect();
                return {
                  id: cat.id,
                  top: rect.top,
                  bottom: rect.bottom,
                };
              }
              return null;
            })
            .filter(Boolean) as Array<{ id: string; top: number; bottom: number }>;

          // Find the section currently in view
          const viewportMiddle = window.innerHeight / 2 + 100; // Offset for sticky header
          for (const section of sections) {
            if (section.top <= viewportMiddle && section.bottom >= viewportMiddle) {
              setActiveCategory(section.id);
              break;
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    const element = document.getElementById(categoryId);
    if (element) {
      const offset = 80; // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      setActiveCategory(categoryId);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Main Container */}
      <div className="max-w-[1520px] mx-auto flex items-start relative pt-0">
        {/* --- LEFT SIDEBAR --- */}
        <aside className="w-48 shrink-0 sticky top-16 pt-6 self-start max-h-[calc(100vh-64px)] overflow-y-auto border-r border-transparent hidden md:block scrollbar-hide">
          {/* Inner padding for content */}
          <div className="px-2">
            <h2 className="px-2 text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">
              路线分类
            </h2>
            <nav className="space-y-1 px-2 flex flex-col items-center">
              {roadmapCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`directory-nav-button ${
                    activeCategory === category.id
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

        {/* --- RIGHT CONTENT AREA --- */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* HEADER (Sticky) */}
          <div className="sticky top-16 z-20 bg-white/95 dark:bg-slate-950/95 backdrop-blur pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 transition-all">
            <div className="px-6 md:px-8">
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline gap-4">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    学习路线
                  </h1>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 dark:text-slate-400 text-sm">
                      共 <span className="font-semibold text-slate-900 dark:text-slate-50">{roadmaps.length}</span> 个路线图
                    </span>
                  </div>
                </div>
                <p className="text-base text-slate-600 dark:text-slate-400">
                  系统化的学习路径，从零基础到进阶，一步步掌握投资和 Web3 的核心技能
                </p>
              </div>
            </div>
          </div>

          {/* SCROLLABLE CONTENT */}
          <div className="content-fade-in px-6 md:px-8 pb-20 pt-6">
            {/* Render roadmaps grouped by category */}
            {roadmapCategories.map((category) => (
              <section
                key={category.id}
                id={category.id}
                className="mb-16 scroll-mt-24"
              >
                {/* Category Header */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                    <span className="text-2xl">{category.emoji}</span>
                    {category.label}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    共 {category.items.length} 个路线图
                  </p>
                </div>

                {/* Roadmap Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {category.items.map((roadmap) => (
                    <RoadmapCard key={roadmap.id} roadmap={roadmap} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
