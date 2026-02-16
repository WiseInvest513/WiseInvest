"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, Sparkles, TrendingUp, Calendar as CalendarIcon, Star } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { PriceTesterPasswordDialog } from "@/components/PriceTesterPasswordDialog";
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

const navItems = [
  { label: "首页", href: "/" },
  { label: "推文", href: "/tweets" },
  { label: "工具", href: "/tools" },
  { label: "学习路线", href: "/roadmap" },
  { label: "文集", href: "/anthology" },
  { label: "福利", href: "/perks" },
  { label: "常用导航", href: "/resources" },
  { label: "实践", href: "/practice" },
  { label: "关于我", href: "/aboutme" },
];

export function Navbar() {
  const [priceTesterOpen, setPriceTesterOpen] = useState(false);
  const [eventCalendarOpen, setEventCalendarOpen] = useState(false);
  const [recommendationOpen, setRecommendationOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const pathname = usePathname();

  // Helper function to check if a link is active
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const handleToolSelect = (tool: Tool) => {
    setSelectedTool(tool);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" prefetch={true} className="font-heading text-xl font-bold flex items-center gap-2">
            <span>Wise Invest</span>
          </Link>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const isPerks = item.href === "/perks";
              return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={cn(
                  "text-[15px] font-semibold transition-all relative flex items-center gap-1.5 group px-2 py-1.5 rounded-md",
                  active
                    ? "text-yellow-700 dark:text-yellow-400 font-bold bg-amber-50/80 dark:bg-amber-900/20 nav-item-burst"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
                )}
              >
                {isPerks && (
                  <Sparkles className="h-3.5 w-3.5 text-yellow-500 dark:text-yellow-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-300 transition-colors" />
                )}
                {item.label}
                {isPerks && (
                  <span className="absolute -top-0.5 -right-1.5 h-2 w-2 bg-red-500 dark:bg-red-400 rounded-full animate-pulse" />
                )}
                <span
                  className={cn(
                    "absolute -bottom-1 left-2 right-2 h-0.5 rounded-full bg-yellow-600 dark:bg-yellow-500 transition-transform duration-300 origin-center",
                    active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  )}
                />
              </Link>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Event Calendar Button */}
            <button
              onClick={() => setEventCalendarOpen(true)}
              className="p-2 rounded-md hover:bg-muted transition-colors"
              aria-label="重要事件日历"
              title="重要事件日历"
            >
              <CalendarIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </button>

            {/* Daily Recommendation Button - 今日精选 */}
            <button
              onClick={() => setRecommendationOpen(true)}
              className="p-2 rounded-md hover:bg-muted transition-colors relative group"
              aria-label="今日精选"
              title="今日精选"
            >
              <Gift className="h-5 w-5 text-yellow-600 dark:text-yellow-400 group-hover:scale-110 transition-transform" />
            </button>

            {/* Price Tester Button */}
            <button
              onClick={() => setPriceTesterOpen(true)}
              className="p-2 rounded-md hover:bg-muted transition-colors"
              aria-label="后台测试入口"
              title="后台测试入口"
            >
              <TrendingUp className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Event Calendar */}
      <EventCalendar open={eventCalendarOpen} onOpenChange={setEventCalendarOpen} />

      {/* Daily Recommendation */}
      <DailyRecommendation open={recommendationOpen} onOpenChange={setRecommendationOpen} />

      {/* Price Tester Password Dialog */}
      <PriceTesterPasswordDialog
        open={priceTesterOpen}
        onOpenChange={setPriceTesterOpen}
      />

      {/* Tool Modal */}
      <Dialog
        open={selectedTool !== null}
        onOpenChange={(open) => !open && setSelectedTool(null)}
      >
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              {selectedTool?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedTool?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedTool?.id === "compound-calc" ? (
              <CompoundInterestCalc />
            ) : selectedTool?.type === "static" ? (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-8 text-center">
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  Loading Calculator UI...
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                  工具界面正在加载中
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-8 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-lg text-slate-600 dark:text-slate-400">
                    Connecting to API endpoint...
                  </p>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  正在连接数据源，请稍候
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
