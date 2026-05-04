"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Wrench } from "lucide-react";
import {
  Calculator,
  TrendingUp,
  Coins,
  BarChart3,
  PieChart,
  Percent,
  Zap,
  Search,
  Clock,
  Target,
  DollarSign,
  AlertTriangle,
  Eye,
  Package,
  LucideIcon,
} from "lucide-react";
import { tools, type Tool } from "@/lib/data";
import { getToolRoute } from "@/lib/tool-routes";

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  Calculator,
  TrendingUp,
  Coins,
  BarChart3,
  PieChart,
  Percent,
  Zap,
  Search,
  Clock,
  Target,
  DollarSign,
  AlertTriangle,
  Eye,
  Package,
};

interface ToolCategory {
  id: string;
  label: string;
  emoji: string;
  accent: {
    icon: string;      // icon container bg + text
    border: string;    // section left border
    badge: string;     // category badge
    hover: string;     // card hover border
    glow: string;      // card hover shadow
  };
  items: Tool[];
}

const toolCategories: ToolCategory[] = [
  {
    id: "calculators",
    label: "计算器",
    emoji: "🧮",
    accent: {
      icon: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
      border: "border-amber-400",
      badge: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
      hover: "hover:border-amber-300 dark:hover:border-amber-700",
      glow: "hover:shadow-amber-100 dark:hover:shadow-amber-900/20",
    },
    items: tools.filter((t) => t.category === "Calculators"),
  },
  {
    id: "contract-management",
    label: "合约管理",
    emoji: "📈",
    accent: {
      icon: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
      border: "border-indigo-400",
      badge: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
      hover: "hover:border-indigo-300 dark:hover:border-indigo-700",
      glow: "hover:shadow-indigo-100 dark:hover:shadow-indigo-900/20",
    },
    items: tools.filter((t) => t.category === "Contract Management"),
  },
  {
    id: "market-data",
    label: "市场数据",
    emoji: "📊",
    accent: {
      icon: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-400",
      badge: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
      hover: "hover:border-emerald-300 dark:hover:border-emerald-700",
      glow: "hover:shadow-emerald-100 dark:hover:shadow-emerald-900/20",
    },
    items: tools.filter((t) => t.category === "Market Data"),
  },
];

export default function ToolsPage() {
  const pathname = usePathname();
  const hasRestoredRef = useRef(false);

  const [activeCategory, setActiveCategory] = useState<string>(
    toolCategories[0]?.id || ""
  );

  useEffect(() => {
    if (hasRestoredRef.current) return;
    const savedCategory = localStorage.getItem("tools-active-category");
    if (savedCategory && toolCategories.find((cat) => cat.id === savedCategory)) {
      setActiveCategory(savedCategory);
    }
    const savedScrollY = sessionStorage.getItem("tools-scroll-y");
    if (savedScrollY) {
      const scrollY = parseInt(savedScrollY, 10);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            window.scrollTo({ top: scrollY, behavior: "instant" as ScrollBehavior });
            sessionStorage.removeItem("tools-scroll-y");
            hasRestoredRef.current = true;
          }, 50);
        });
      });
    } else {
      hasRestoredRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (pathname !== "/tools") return;
    let scrollTimeout: NodeJS.Timeout;
    const saveState = () => {
      try {
        sessionStorage.setItem("tools-scroll-y", window.scrollY.toString());
        localStorage.setItem("tools-active-category", activeCategory);
      } catch {}
    };
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(saveState, 300);
    };
    const handleVisibility = () => { if (document.visibilityState === "hidden") saveState(); };
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);
    const interval = setInterval(saveState, 2000);
    saveState();
    return () => {
      clearTimeout(scrollTimeout);
      clearInterval(interval);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("visibilitychange", handleVisibility);
      saveState();
    };
  }, [activeCategory, pathname]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const mid = window.innerHeight / 2 + 100;
          for (const cat of toolCategories) {
            const el = document.getElementById(cat.id);
            if (!el) continue;
            const rect = el.getBoundingClientRect();
            if (rect.top <= mid && rect.bottom >= mid) {
              if (cat.id !== activeCategory) {
                setActiveCategory(cat.id);
                try { localStorage.setItem("tools-active-category", cat.id); } catch {}
              }
              break;
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCategoryClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 80, behavior: "smooth" });
      setActiveCategory(id);
      try { localStorage.setItem("tools-active-category", id); } catch {}
      setTimeout(() => {
        try { sessionStorage.setItem("tools-scroll-y", window.scrollY.toString()); } catch {}
      }, 500);
    }
  };

  const totalTools = toolCategories.reduce((s, c) => s + c.items.length, 0);
  const availableTools = toolCategories.reduce(
    (s, c) => s + c.items.filter((t) => t.status === "Available").length, 0
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative dot-grid">
      <div className="relative z-[1] max-w-[1520px] mx-auto flex items-start gap-0 px-4 md:px-6 pt-6">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="w-52 shrink-0 sticky top-20 self-start max-h-[calc(100vh-80px)] overflow-y-auto hidden md:block scrollbar-hide">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm px-3 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 px-1">
              工具分类
            </p>
            <nav className="space-y-1">
              {toolCategories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-amber-400 dark:bg-amber-500 text-slate-900 shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </span>
                    <span className={`text-[11px] font-mono rounded-full px-1.5 ${
                      isActive ? "bg-amber-950/20 text-amber-900" : "text-slate-400 dark:text-slate-500"
                    }`}>
                      {cat.items.length}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Stats */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 px-1">
              <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>全部工具</span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">{totalTools}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>可立即使用</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{availableTools}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 min-w-0 pl-0 md:pl-6 pb-20">

          {/* Page header */}
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Wrench className="w-5 h-5 text-amber-500" />
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                  投资工具箱
                </h1>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {totalTools} 个工具，{availableTools} 个可立即使用
              </p>
            </div>
          </div>

          {toolCategories.map((category) => (
            <section key={category.id} id={category.id} className="mb-14 scroll-mt-24">

              {/* Category header */}
              <div className={`flex items-center gap-3 mb-5 pl-3 border-l-4 ${category.accent.border}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{category.emoji}</span>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {category.label}
                    </h2>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${category.accent.badge}`}>
                      {category.items.length} 个工具
                    </span>
                  </div>
                </div>
              </div>

              {/* Tool Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {category.items.map((tool) => {
                  const Icon = iconMap[tool.icon] || Calculator;
                  const isAvailable = tool.status === "Available";
                  const toolRoute = getToolRoute(tool.id);

                  const card = (
                    <div
                      className={`group relative flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all duration-200 h-full ${
                        isAvailable
                          ? `cursor-pointer ${category.accent.hover} hover:-translate-y-0.5 hover:shadow-lg ${category.accent.glow}`
                          : "opacity-60 cursor-not-allowed"
                      }`}
                      style={{ borderLeftWidth: 3, borderLeftColor: isAvailable ? undefined : undefined }}
                    >
                      {/* Top accent bar */}
                      <div className={`h-0.5 w-full ${category.accent.border.replace("border-", "bg-")} opacity-70`} />

                      <div className="p-5 flex flex-col flex-1">
                        {/* Header row: icon + badge */}
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${category.accent.icon} transition-transform duration-200 ${isAvailable ? "group-hover:scale-110" : ""}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {tool.type === "dynamic" ? (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                Live
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                工具
                              </span>
                            )}
                            {!isAvailable && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/20 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                                即将上线
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className={`font-bold text-[16px] leading-snug text-slate-900 dark:text-slate-50 mb-2 transition-colors ${isAvailable ? `group-hover:text-amber-700 dark:group-hover:text-amber-300` : ""}`}>
                          {tool.name}
                        </h3>

                        {/* Description */}
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 flex-1">
                          {tool.description}
                        </p>

                        {/* Footer */}
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${category.accent.badge}`}>
                            {category.label}
                          </span>
                          {isAvailable && (
                            <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                          )}
                        </div>
                      </div>
                    </div>
                  );

                  return isAvailable ? (
                    <Link key={tool.id} href={toolRoute} className="block h-full">
                      {card}
                    </Link>
                  ) : (
                    <div key={tool.id} className="h-full">{card}</div>
                  );
                })}
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}
