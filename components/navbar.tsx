"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Gift, Sparkles, Calendar as CalendarIcon, Menu, X, Search, UserCircle, Crown } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { type Tool } from "@/lib/data";
import { cn } from "@/lib/utils";
import { clearNavSession, readNavSession, subscribeNavSession, type NavSession } from "@/lib/auth/nav-session-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function NavPanelLoading() {
  return <div role="status" className="fixed bottom-6 right-6 z-[120] rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">正在加载...</div>;
}

const SearchCommand = dynamic(() => import("@/components/search-command").then((module) => module.SearchCommand), { ssr: false, loading: NavPanelLoading });
const EventCalendar = dynamic(() => import("@/components/EventCalendar").then((module) => module.EventCalendar), { ssr: false, loading: NavPanelLoading });
const DailyRecommendation = dynamic(() => import("@/components/business/DailyRecommendation").then((module) => module.DailyRecommendation), { ssr: false, loading: NavPanelLoading });
const CompoundInterestCalc = dynamic(() => import("@/components/tools/CompoundInterestCalc").then((module) => module.CompoundInterestCalc), { ssr: false, loading: NavPanelLoading });

const navItemsBefore = [
  { label: "首页", href: "/" },
  { label: "学习路线", href: "/roadmap" },
  { label: "文章", href: "/articles" },
];

const navItemsAfter = [
  { label: "福利", href: "/perk" },
  { label: "其他网站", href: "/website" },
  { label: "关于我", href: "/aboutme" },
];

export function Navbar() {
  const [eventCalendarOpen, setEventCalendarOpen] = useState(false);
  const [recommendationOpen, setRecommendationOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [requestedPanels, setRequestedPanels] = useState({ search: false, calendar: false, recommendation: false });
  const [accountUser, setAccountUser] = useState<NonNullable<NavSession>["user"] | null>(null);
  const pathname = usePathname();
  const isPointAdmin = pathname === "/admin/point" || pathname.startsWith("/admin/point/");

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!searchOpen && !eventCalendarOpen && !recommendationOpen) return;
    // Keep opened panels mounted so closing them does not discard search data.
    setRequestedPanels((previous) => ({
      search: previous.search || searchOpen,
      calendar: previous.calendar || eventCalendarOpen,
      recommendation: previous.recommendation || recommendationOpen,
    }));
  }, [searchOpen, eventCalendarOpen, recommendationOpen]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (isPointAdmin) return;
    return subscribeNavSession((session) => setAccountUser(session?.user ?? null));
  }, [isPointAdmin]);

  useEffect(() => {
    if (isPointAdmin) {
      // No hidden-navbar session requests or retained avatar while editing.
      clearNavSession();
      return;
    }
    void readNavSession().catch(() => {});
  }, [pathname, isPointAdmin]);

  // Point management has its own full-page navigation; the sticky public bar
  // must not cover the editor or intercept clicks on its controls.
  if (isPointAdmin) return null;

  return (
    <>
      <nav className={`sticky top-0 z-50 w-full flex justify-center px-4 pt-3 pb-1 pointer-events-none ${pathname === "/" ? "sm:px-8 sm:pt-4" : ""}`}>
        <div className={`pointer-events-auto w-full max-w-[1400px] flex items-center px-3 border border-slate-200/70 dark:border-slate-700/60 backdrop-blur-xl ${pathname === "/" ? "h-14 sm:h-16 rounded-[22px] bg-white/95 dark:bg-[#202327]/95 shadow-[0_4px_20px_rgba(40,45,50,0.06)]" : "h-12 rounded-2xl bg-slate-50/95 dark:bg-slate-800/95 shadow-md shadow-slate-300/30 dark:shadow-slate-950/60"}`}>

          {/* Logo */}
          <Link href="/" prefetch={true} className="font-heading text-base font-bold text-slate-900 dark:text-white px-2 shrink-0">
            Wise <span className={pathname === "/" ? "text-[#a97919] dark:text-[#d3ac64]" : undefined}>Invest</span>
          </Link>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-2 shrink-0 hidden xl:block" />

          {/* Nav items - desktop only */}
          <div className="hidden xl:flex flex-1 items-center justify-center gap-0.5 whitespace-nowrap">
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

            {navItemsAfter.map((item) => {
              const active = isActive(item.href);
              const isPerks = item.href === "/perk";
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

          {/* Mobile: spacer + hamburger */}
          <div className="flex-1 xl:hidden" />
          <a
            href="https://vip.wise-invest.org/join"
            target="_blank"
            rel="noopener noreferrer"
            className="mr-1 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-amber-50 px-2 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 dark:bg-amber-900/20 dark:text-amber-300 sm:px-3 xl:mr-2"
          >
            <Crown className="h-4 w-4" aria-hidden="true" />加入 VIP
          </a>
          <button
            className="xl:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-1"
            onClick={() => setMobileMenuOpen(v => !v)}
            aria-label="菜单"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {mobileMenuOpen
              ? <X className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              : <Menu className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            }
          </button>

          <div className="hidden xl:block w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

          {/* Right actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button onClick={() => setSearchOpen(true)} className="hidden items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 xl:inline-flex" title="搜索全站">
              <Search className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>搜索</span>
              <kbd className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-400 dark:border-slate-700 dark:bg-slate-900">⌘K</kbd>
            </button>
            <button onClick={() => setSearchOpen(true)} className="hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors sm:inline-flex xl:hidden" title="搜索全站">
              <Search className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </button>
            <button onClick={() => setEventCalendarOpen(true)} className="hidden xl:inline-flex p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="重要事件日历">
              <CalendarIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </button>
            <button onClick={() => setRecommendationOpen(true)} className="hidden xl:inline-flex p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="今日精选">
              <Gift className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </button>
            <Link
              href="/account"
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              title={accountUser?.name ? `Wise 账户：${accountUser.name}` : "Wise 账户"}
            >
              {accountUser?.image ? (
                <img
                  src={accountUser.image}
                  alt="账户头像"
                  referrerPolicy="no-referrer"
                  className="h-6 w-6 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                />
              ) : (
                <UserCircle className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              )}
            </Link>
            <div className="hidden sm:block"><ThemeToggle /></div>
          </div>
        </div>
      </nav>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div id="mobile-navigation" className="xl:hidden fixed top-[64px] left-0 right-0 z-40 mx-3 mt-1 max-h-[calc(100dvh-80px)] overflow-y-auto rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl shadow-lg">
          <div className="py-2">
            {navItemsBefore.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center px-5 py-3 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                {item.label}
              </Link>
            ))}
            {navItemsAfter.map(item => {
              const isPerks = item.href === "/perk";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  {isPerks && <Sparkles className="h-3.5 w-3.5 text-yellow-500" />}
                  {item.label}
                </Link>
              );
            })}
            <div className="border-t border-slate-200 dark:border-slate-700 mt-2 pt-2">
              <button className="flex items-center gap-3 w-full px-5 py-3 text-sm text-slate-700 dark:text-slate-300 sm:hidden" onClick={() => { setMobileMenuOpen(false); setSearchOpen(true); }}>
                <Search className="h-4 w-4" />搜索全站
              </button>
              <button className="flex items-center gap-3 w-full px-5 py-3 text-sm text-slate-700 dark:text-slate-300" onClick={() => { setMobileMenuOpen(false); setEventCalendarOpen(true); }}>
                <CalendarIcon className="h-4 w-4" />重要事件日历
              </button>
              <button className="flex items-center gap-3 w-full px-5 py-3 text-sm text-slate-700 dark:text-slate-300" onClick={() => { setMobileMenuOpen(false); setRecommendationOpen(true); }}>
                <Gift className="h-4 w-4" />今日精选
              </button>
              <div className="flex items-center justify-between px-5 py-2 text-sm text-slate-700 dark:text-slate-300 sm:hidden">
                <span>切换主题</span><ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      )}

      {(searchOpen || requestedPanels.search) && <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />}
      {(eventCalendarOpen || requestedPanels.calendar) && <EventCalendar open={eventCalendarOpen} onOpenChange={setEventCalendarOpen} />}
      {(recommendationOpen || requestedPanels.recommendation) && <DailyRecommendation open={recommendationOpen} onOpenChange={setRecommendationOpen} />}

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
