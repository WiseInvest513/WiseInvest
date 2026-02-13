"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
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
import { SectionCardShell } from "@/components/sections/SectionCardShell";

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

// Group tools by category (similar to resources/perks structure)
interface ToolCategory {
  id: string;
  label: string;
  emoji: string;
  items: Tool[];
}

const toolCategories: ToolCategory[] = [
  {
    id: "calculators",
    label: "计算器",
    emoji: "🧮",
    items: tools.filter((t) => t.category === "Calculators"),
  },
  {
    id: "contract-management",
    label: "合约管理",
    emoji: "📈",
    items: tools.filter((t) => t.category === "Contract Management"),
  },
  {
    id: "market-data",
    label: "市场数据",
    emoji: "📊",
    items: tools.filter((t) => t.category === "Market Data"),
  },
  // 上帝视角分类已删除，加密货币收益率矩阵已移动到市场数据
  // Web3 追踪分类暂时隐藏，代码保留
  // {
  //   id: "web3-tracking",
  //   label: "Web3 追踪",
  //   emoji: "🌐",
  //   items: tools.filter((t) => t.category === "Web3 Tracking"),
  // },
];

export default function ToolsPage() {
  const pathname = usePathname();
  const hasRestoredRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 初始状态：服务器端和客户端保持一致
  const [activeCategory, setActiveCategory] = useState<string>(
    toolCategories[0]?.id || ""
  );

  // 客户端挂载后恢复状态（只执行一次）
  useEffect(() => {
    if (hasRestoredRef.current) return;
    
    // 恢复激活分类
    const savedCategory = localStorage.getItem('tools-active-category');
    if (savedCategory && toolCategories.find(cat => cat.id === savedCategory)) {
      setActiveCategory(savedCategory);
    }

    // 恢复滚动位置 - 使用多重延迟确保DOM已完全渲染
    const savedScrollY = sessionStorage.getItem('tools-scroll-y');
    if (savedScrollY) {
      const scrollY = parseInt(savedScrollY, 10);
      // 使用 requestAnimationFrame 确保在下一帧执行
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // 再次延迟，确保所有内容都已渲染
          setTimeout(() => {
            window.scrollTo({
              top: scrollY,
              behavior: 'instant' as ScrollBehavior
            });
            // 恢复后清除，避免下次进入时还恢复
            sessionStorage.removeItem('tools-scroll-y');
            hasRestoredRef.current = true;
          }, 50);
        });
      });
    } else {
      hasRestoredRef.current = true;
    }
  }, []);

  // 保存滚动位置和激活分类
  useEffect(() => {
    // 只在 /tools 页面时保存
    if (pathname !== '/tools') return;

    let scrollTimeout: NodeJS.Timeout;
    
    const saveState = () => {
      try {
        sessionStorage.setItem('tools-scroll-y', window.scrollY.toString());
        localStorage.setItem('tools-active-category', activeCategory);
      } catch (e) {
        // 忽略存储错误（如隐私模式）
        console.warn('Failed to save state:', e);
      }
    };

    // 防抖保存滚动位置（滚动停止后300ms保存）
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        saveState();
      }, 300);
    };

    // 监听滚动事件
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 监听页面可见性变化（切换标签页时保存）
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveState();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 定期保存（每2秒）
    const interval = setInterval(saveState, 2000);

    // 立即保存一次激活分类
    saveState();

    return () => {
      clearTimeout(scrollTimeout);
      clearInterval(interval);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // 组件卸载时也保存一次
      saveState();
    };
  }, [activeCategory, pathname]);

  // Handle smooth scroll and active category detection (Optimized with throttle)
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const sections = toolCategories
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
              const newCategory = section.id;
              if (newCategory !== activeCategory) {
                setActiveCategory(newCategory);
                // 实时保存激活分类
                if (typeof window !== 'undefined') {
                  localStorage.setItem('tools-active-category', newCategory);
                }
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
      // 立即保存激活分类
      if (typeof window !== 'undefined') {
        localStorage.setItem('tools-active-category', categoryId);
      }
      
      // 滚动完成后保存滚动位置
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('tools-scroll-y', window.scrollY.toString());
        }
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Main Container */}
      <div className="max-w-[1600px] mx-auto flex items-start relative pt-0">
        {/* --- LEFT SIDEBAR --- */}
        <aside className="w-48 shrink-0 sticky top-16 pt-6 self-start max-h-[calc(100vh-64px)] overflow-y-auto border-r border-transparent hidden md:block scrollbar-hide">
          {/* Inner padding for content */}
          <div className="px-2">
            <h2 className="px-2 text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">
              工具分类
            </h2>
            <nav className="space-y-1 px-2 flex flex-col items-center">
              {toolCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`w-fit text-center transition-all duration-200 rounded-lg border-x-2 ${
                    activeCategory === category.id
                      ? "border-yellow-400 dark:border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 font-bold px-3 py-1.5"
                      : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 px-3 py-1.5"
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
            <div className="px-8">
              <div className="flex items-baseline gap-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Investment Tools
                </h1>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 dark:text-slate-400 text-sm">
                    共 <span className="font-semibold text-slate-900 dark:text-slate-50">
                      {toolCategories.reduce((sum, cat) => sum + cat.items.length, 0)}
                    </span> 个工具
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SCROLLABLE CONTENT */}
          <div className="px-8 pb-20 pt-6">
            {/* Render tools grouped by category */}
            {toolCategories.map((category) => (
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
                    共 {category.items.length} 个工具
                  </p>
                </div>

                {/* Tool Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {category.items.map((tool) => {
                    const Icon = iconMap[tool.icon] || Calculator;
                    const isAvailable = tool.status === "Available";
                    const toolRoute = getToolRoute(tool.id);

                    const ToolCardContent = (
                      <>
                        <div className="absolute top-4 right-4">
                          {tool.type === "dynamic" ? (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-xs font-medium text-green-700 dark:text-green-400">
                                Live Data
                              </span>
                            </div>
                          ) : (
                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-xs font-medium">
                              工具
                            </span>
                          )}
                        </div>

                        {!isAvailable && (
                          <div className="absolute top-4 left-4 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 rounded-full text-xs font-medium">
                            即将推出
                          </div>
                        )}

                        <div className="mb-4">
                          <div className="w-16 h-16 bg-yellow-400 dark:bg-yellow-500 rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
                            <Icon className="h-8 w-8 text-black" />
                          </div>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">
                          {tool.name}
                        </h3>

                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4 line-clamp-2">
                          {tool.description}
                        </p>

                        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {category.label}
                          </span>
                          {isAvailable && (
                            <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors" />
                          )}
                        </div>
                      </>
                    );

                    if (!isAvailable) {
                      return (
                        <SectionCardShell
                          key={tool.id}
                          className="h-full opacity-60 cursor-not-allowed"
                          contentClassName="p-6 rounded-xl flex flex-col h-full"
                          watermarkNode={
                            <Icon className="w-full h-full text-slate-300 dark:text-slate-700 group-hover:text-yellow-300 transition-colors duration-500" />
                          }
                        >
                          {ToolCardContent}
                        </SectionCardShell>
                      );
                    }

                    return (
                      <Link
                        key={tool.id}
                        href={toolRoute}
                        className="block h-full"
                      >
                        <SectionCardShell
                          className="h-full"
                          contentClassName="p-6 rounded-xl flex flex-col h-full"
                          watermarkNode={
                            <Icon className="w-full h-full text-slate-300 dark:text-slate-700 group-hover:text-yellow-300 transition-colors duration-500" />
                          }
                        >
                          {ToolCardContent}
                        </SectionCardShell>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
