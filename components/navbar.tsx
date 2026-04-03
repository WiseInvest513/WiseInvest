"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, Sparkles, Calendar as CalendarIcon, ChevronDown, BookOpen, Youtube } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { EventCalendar } from "@/components/EventCalendar";
import { DailyRecommendation } from "@/components/business/DailyRecommendation";
import { type Tool } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CompoundInterestCalc } from "@/components/tools/CompoundInterestCalc";

const navItemsBefore = [
  { label: "首页", href: "/" },
  { label: "推文", href: "/tweets" },
  { label: "工具", href: "/tools" },
  { label: "学习路线", href: "/roadmap" },
];

const navItemsAfter = [
  { label: "福利", href: "/perks" },
  { label: "常用导航", href: "/resources" },
  { label: "实践", href: "/practice" },
  { label: "关于我", href: "/aboutme" },
];

const contentItems = [
  { label: "文章", href: "/articles", icon: BookOpen, desc: "投资教程与深度文章" },
  { label: "视频", href: "/videos", icon: Youtube, desc: "YouTube 视频内容" },
];

export function Navbar() {
  const [eventCalendarOpen, setEventCalendarOpen] = useState(false);
  const [recommendationOpen, setRecommendationOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [contentOpen, setContentOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const isContentActive = contentItems.some(item => isActive(item.href));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
        setContentOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <nav className="sticky top-0 z-50 w-full flex justify-center px-4 pt-3 pb-1 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-[1400px] flex items-center h-12 px-3 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-xl shadow-md shadow-slate-300/30 dark:shadow-slate-950/60">

          {/* Logo */}
          <Link href="/" prefetch={true} className="font-heading text-base font-bold text-slate-900 dark:text-white px-2 shrink-0">
            Wise Invest
          </Link>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-2 shrink-0" />

          {/* Nav items */}
          <div className="flex-1 flex items-center justify-center gap-0.5">
            {navItemsBefore.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={cn(
                    "relative flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/70"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* 内容 下拉菜单 */}
            <div ref={contentRef} className="relative">
              <button
                onClick={() => setContentOpen(v => !v)}
                className={cn(
                  "relative flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isContentActive
                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/70"
                )}
              >
                内容
                <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", contentOpen && "rotate-180")} />
              </button>

              {contentOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 overflow-hidden z-50">
                  {contentItems.map(item => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setContentOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                          active
                            ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                      >
                        <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                        <div>
                          <div className="font-medium leading-tight">{item.label}</div>
                          <div className="text-[11px] text-slate-400 leading-tight mt-0.5">{item.desc}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {navItemsAfter.map((item) => {
              const active = isActive(item.href);
              const isPerks = item.href === "/perks";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={cn(
                    "relative flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/70"
                  )}
                >
                  {isPerks && <Sparkles className="h-3 w-3 text-yellow-500 dark:text-yellow-400 shrink-0" />}
                  {item.label}
                  {isPerks && <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 bg-red-500 rounded-full animate-pulse" />}
                </Link>
              );
            })}
          </div>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

          {/* Right actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button onClick={() => setEventCalendarOpen(true)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="重要事件日历">
              <CalendarIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </button>
            <button onClick={() => setRecommendationOpen(true)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="今日精选">
              <Gift className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <EventCalendar open={eventCalendarOpen} onOpenChange={setEventCalendarOpen} />
      <DailyRecommendation open={recommendationOpen} onOpenChange={setRecommendationOpen} />

      <Dialog open={selectedTool !== null} onOpenChange={(open) => !open && setSelectedTool(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">{selectedTool?.name}</DialogTitle>
            <DialogDescription>{selectedTool?.description}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedTool?.id === "compound-calc" ? (
              <CompoundInterestCalc />
            ) : selectedTool?.type === "static" ? (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-8 text-center">
                <p className="text-lg text-slate-600 dark:text-slate-400">Loading Calculator UI...</p>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-8 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-lg text-slate-600 dark:text-slate-400">Connecting to API endpoint...</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
