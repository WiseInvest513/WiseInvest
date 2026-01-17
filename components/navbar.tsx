"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Gift, Sparkles, Calendar, TrendingUp } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchCommand } from "@/components/search-command";
import { PriceTesterPasswordDialog } from "@/components/PriceTesterPasswordDialog";
// DEBUG: Commented out for isolation test
// import { FOMCCalendar } from "@/components/fomc-calendar";
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [priceTesterOpen, setPriceTesterOpen] = useState(false);
  // DEBUG: Commented out for isolation test
  // const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const pathname = usePathname();

  // Keyboard shortcut listener
  useEffect(() => {
    // Only add event listener in browser
    if (typeof window === 'undefined') return;
    
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

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
          <Link href="/" prefetch={true} className="font-heading text-xl font-bold">
            Wise Invest
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
                  "text-sm font-medium transition-colors relative flex items-center gap-1.5 group",
                  active
                    ? "text-yellow-600 dark:text-yellow-500 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                {isPerks && (
                  <Sparkles className="h-3.5 w-3.5 text-yellow-500 dark:text-yellow-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-300 transition-colors" />
                )}
                {item.label}
                {isPerks && (
                  <span className="absolute -top-0.5 -right-1.5 h-2 w-2 bg-red-500 dark:bg-red-400 rounded-full animate-pulse" />
                )}
                {active && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-yellow-600 dark:bg-yellow-500 rounded-full" />
                )}
              </Link>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* DEBUG: FOMC Calendar Button - Commented out for isolation test */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              Debug Mode
            </div>
            {/* <button
              onClick={() => setCalendarOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-background hover:bg-muted transition-colors text-sm font-medium"
              aria-label="FOMC 会议日程"
            >
              <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-muted-foreground">FOMC</span>
            </button>

            <button
              onClick={() => setCalendarOpen(true)}
              className="sm:hidden p-2 rounded-md hover:bg-muted transition-colors"
              aria-label="FOMC 会议日程"
            >
              <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </button> */}

            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-background hover:bg-muted transition-colors text-sm font-medium"
            >
              <Search className="h-4 w-4" />
              <span className="text-muted-foreground">搜索</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>

            {/* Mobile Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="sm:hidden p-2 rounded-md hover:bg-muted transition-colors"
              aria-label="搜索"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Price Tester Button */}
            <button
              onClick={() => setPriceTesterOpen(true)}
              className="p-2 rounded-md hover:bg-muted transition-colors"
              aria-label="价格服务测试"
              title="价格服务测试"
            >
              <TrendingUp className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Price Tester Password Dialog */}
      <PriceTesterPasswordDialog
        open={priceTesterOpen}
        onOpenChange={setPriceTesterOpen}
      />

      {/* DEBUG: FOMC Calendar - Commented out for isolation test */}
      {/* <FOMCCalendar open={calendarOpen} onOpenChange={setCalendarOpen} /> */}
      <div style={{ display: 'none' }}>Debug Mode: Calendar Disabled</div>

      {/* Search Command */}
      <SearchCommand
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onToolSelect={handleToolSelect}
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
