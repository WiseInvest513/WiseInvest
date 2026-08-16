"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Database,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  addDaysToDateKey,
  calendarEvents,
  getBeijingTodayKey,
  getDateKeyWeekday,
  getEventMarketImpact,
  getEventThemes,
  shiftMonthKey,
  sortCalendarEvents,
  type CalendarEvent,
  type CalendarEventCategory,
  type CalendarEventTheme,
} from "@/lib/calendar-events";

type ScopeFilter = "week" | "month";
type CategoryFilter = "all" | CalendarEventCategory;
type ThemeFilter = "all" | CalendarEventTheme;
type ImpactFilter = "all" | "high";

const monthNames = [
  "一月",
  "二月",
  "三月",
  "四月",
  "五月",
  "六月",
  "七月",
  "八月",
  "九月",
  "十月",
  "十一月",
  "十二月",
];

const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

const categoryOptions: Array<{ value: CategoryFilter; label: string }> = [
  { value: "all", label: "全部" },
  { value: "美股财报", label: "财报" },
  { value: "经济数据", label: "经济数据" },
  { value: "宏观", label: "宏观" },
];

const themeOptions: Array<{ value: ThemeFilter; label: string }> = [
  { value: "all", label: "全部主题" },
  { value: "消费/零售", label: "消费 / 零售" },
  { value: "通胀", label: "通胀" },
  { value: "就业", label: "就业" },
  { value: "AI/半导体", label: "AI / 半导体" },
];

const getCategoryBadgeStyle = (category: CalendarEventCategory) => {
  switch (category) {
    case "美股财报":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "宏观":
      return "border-purple-200 bg-purple-50 text-purple-700";
    case "经济数据":
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
};

const getCategoryDotStyle = (category: CalendarEventCategory) => {
  switch (category) {
    case "美股财报":
      return "bg-emerald-500";
    case "宏观":
      return "bg-purple-500";
    case "经济数据":
      return "bg-blue-500";
  }
};

const getImpactBadgeStyle = (impact: CalendarEvent["impact"]) =>
  impact === "high"
    ? "border-red-200 bg-red-50 text-red-600"
    : impact === "medium"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-slate-200 bg-slate-50 text-slate-600";

const getImpactLabel = (impact: CalendarEvent["impact"]) =>
  impact === "high" ? "重大" : impact === "medium" ? "中等影响" : "低影响";

const formatDateLabel = (dateKey: string, includeYear = false) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return includeYear ? `${year}年${month}月${day}日` : `${month}月${day}日`;
};

const formatShortDate = (dateKey: string) => {
  const [, month, day] = dateKey.split("-").map(Number);
  return `${month}/${day}`;
};

const getFocusWeekRange = (todayKey: string) => {
  const weekday = getDateKeyWeekday(todayKey);
  const isSunday = weekday === 0;
  const start = isSunday
    ? addDaysToDateKey(todayKey, 1)
    : addDaysToDateKey(todayKey, 1 - weekday);

  return {
    start,
    end: addDaysToDateKey(start, 6),
    label: isSunday ? "下周" : "本周",
  };
};

const sortByPriority = (events: CalendarEvent[], chronological = true) =>
  [...events].sort((a, b) => {
    const dateOrder = a.date.localeCompare(b.date);
    const impactOrder =
      (a.impact === "high" ? 0 : a.impact === "medium" ? 1 : 2) -
      (b.impact === "high" ? 0 : b.impact === "medium" ? 1 : 2);

    return chronological
      ? dateOrder || impactOrder || a.title.localeCompare(b.title, "zh-CN")
      : impactOrder || dateOrder || a.title.localeCompare(b.title, "zh-CN");
  });

function EventInsightCard({
  event,
  todayKey,
  compact = false,
}: {
  event: CalendarEvent;
  todayKey: string;
  compact?: boolean;
}) {
  const themes = getEventThemes(event);
  const isPast = event.date < todayKey;

  return (
    <article
      className={cn(
        "rounded-2xl border bg-white shadow-sm",
        compact ? "p-3 sm:p-4" : "p-4 sm:p-5",
        event.impact === "high" ? "border-red-200/80" : "border-slate-200"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {!compact && (
          <span className="text-sm font-bold text-slate-800">
            {formatDateLabel(event.date)}
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
          <Clock3 className="h-3.5 w-3.5" />
          {event.time}
        </span>
        <span
          className={cn(
            "rounded-md border px-2 py-0.5 text-[11px] font-medium",
            getCategoryBadgeStyle(event.category)
          )}
        >
          {event.category === "美股财报" ? "财报" : event.category}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold",
            getImpactBadgeStyle(event.impact)
          )}
        >
          {event.impact === "high" && <AlertTriangle className="h-3 w-3" />}
          {getImpactLabel(event.impact)}
        </span>
        {isPast && (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            已发生
          </span>
        )}
      </div>

      <h5 className="mt-2.5 text-base font-bold leading-snug text-slate-950">
        {event.title}
      </h5>

      <div className={cn("mt-3 grid gap-2.5", compact && "md:grid-cols-2")}>
        <div className="rounded-xl bg-amber-50/80 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-amber-800">
            <Sparkles className="h-3.5 w-3.5" />
            重点关注
          </div>
          <p className="text-sm leading-relaxed text-slate-700">{event.description}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Activity className="h-3.5 w-3.5" />
            可能影响
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            {getEventMarketImpact(event)}
          </p>
        </div>
      </div>

      {themes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {themes.map((theme) => (
            <span
              key={theme}
              className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500"
            >
              #{theme}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

interface EventCalendarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventCalendar({ open, onOpenChange }: EventCalendarProps) {
  const [todayKey, setTodayKey] = useState(() => getBeijingTodayKey());
  const todayMonthKey = todayKey.slice(0, 7);
  const focusWeekRange = useMemo(() => getFocusWeekRange(todayKey), [todayKey]);
  const monthEnd = useMemo(
    () => addDaysToDateKey(`${shiftMonthKey(todayMonthKey, 1)}-01`, -1),
    [todayMonthKey]
  );
  const todayEvents = useMemo(
    () => sortCalendarEvents(calendarEvents.filter((event) => event.date === todayKey)),
    [todayKey]
  );
  const latestEventDate = useMemo(
    () =>
      calendarEvents.reduce(
        (latest, event) => (event.date > latest ? event.date : latest),
        ""
      ),
    []
  );

  const [currentMonthKey, setCurrentMonthKey] = useState(todayMonthKey);
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("week");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [themeFilter, setThemeFilter] = useState<ThemeFilter>("all");
  const [impactFilter, setImpactFilter] = useState<ImpactFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [todayReminderOpen, setTodayReminderOpen] = useState(false);
  const selectedDayRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (open) {
      const currentTodayKey = getBeijingTodayKey();
      setTodayKey(currentTodayKey);
      setCurrentMonthKey(currentTodayKey.slice(0, 7));
      setScopeFilter("week");
      setCategoryFilter("all");
      setThemeFilter("all");
      setImpactFilter("all");
      setSearchQuery("");
      setSelectedDate(null);
      setShowAllInsights(false);
    } else {
      setTodayReminderOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || todayEvents.length === 0) return;

    const dismissedKey = window.sessionStorage.getItem(
      "wise-invest-calendar-reminder-dismissed"
    );
    setTodayReminderOpen(dismissedKey !== todayKey);
  }, [open, todayEvents.length, todayKey]);

  const [year, monthNumber] = currentMonthKey.split("-").map(Number);
  const monthIndex = monthNumber - 1;
  const displayedMonthPrefix = `${currentMonthKey}-`;

  const matchesActiveFilters = (event: CalendarEvent) => {
    const query = searchQuery.trim().toLowerCase();

    if (categoryFilter !== "all" && event.category !== categoryFilter) return false;
    if (themeFilter !== "all" && !getEventThemes(event).includes(themeFilter)) return false;
    if (impactFilter === "high" && event.impact !== "high") return false;
    if (
      query &&
      !`${event.title} ${event.description} ${event.category} ${event.time}`
        .toLowerCase()
        .includes(query)
    ) {
      return false;
    }
    return true;
  };

  const filteredEventPool = useMemo(
    () => sortCalendarEvents(calendarEvents.filter(matchesActiveFilters)),
    // Filter state fully determines this derived pool.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categoryFilter, themeFilter, impactFilter, searchQuery]
  );

  const displayedMonthEvents = useMemo(
    () => calendarEvents.filter((event) => event.date.startsWith(displayedMonthPrefix)),
    [displayedMonthPrefix]
  );
  const displayedFilteredMonthEvents = useMemo(
    () => filteredEventPool.filter((event) => event.date.startsWith(displayedMonthPrefix)),
    [filteredEventPool, displayedMonthPrefix]
  );

  const focusWeekEvents = useMemo(
    () =>
      sortCalendarEvents(
        calendarEvents.filter(
          (event) =>
            event.date >= focusWeekRange.start && event.date <= focusWeekRange.end
        )
      ),
    [focusWeekRange]
  );
  const currentMonthEvents = useMemo(
    () =>
      sortCalendarEvents(
        calendarEvents.filter(
          (event) => event.date >= `${todayMonthKey}-01` && event.date <= monthEnd
        )
      ),
    [monthEnd, todayMonthKey]
  );

  const scopeEvents = scopeFilter === "week" ? focusWeekEvents : currentMonthEvents;
  const filteredScopeEvents = useMemo(() => {
    const visibleIds = new Set(filteredEventPool.map((event) => event.id));
    return scopeEvents.filter((event) => visibleIds.has(event.id));
  }, [filteredEventPool, scopeEvents]);

  const categoryCounts = useMemo(
    () =>
      Object.fromEntries(
        categoryOptions.map((option) => [
          option.value,
          option.value === "all"
            ? scopeEvents.length
            : scopeEvents.filter((event) => event.category === option.value).length,
        ])
      ) as Record<CategoryFilter, number>,
    [scopeEvents]
  );

  const themeCounts = useMemo(
    () =>
      Object.fromEntries(
        themeOptions.map((option) => [
          option.value,
          option.value === "all"
            ? scopeEvents.length
            : scopeEvents.filter((event) =>
                getEventThemes(event).includes(option.value as CalendarEventTheme)
              ).length,
        ])
      ) as Record<ThemeFilter, number>,
    [scopeEvents]
  );

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    filteredEventPool.forEach((event) => {
      const events = map.get(event.date) ?? [];
      events.push(event);
      map.set(event.date, events);
    });
    return map;
  }, [filteredEventPool]);

  const calendarDays = useMemo(() => {
    const firstDayKey = `${currentMonthKey}-01`;
    const firstWeekday = getDateKeyWeekday(firstDayKey);
    const gridStart = addDaysToDateKey(firstDayKey, -firstWeekday);

    return Array.from({ length: 42 }, (_, index) => {
      const dateKey = addDaysToDateKey(gridStart, index);
      return {
        dateKey,
        day: Number(dateKey.slice(-2)),
        isCurrentMonth: dateKey.startsWith(displayedMonthPrefix),
      };
    });
  }, [currentMonthKey, displayedMonthPrefix]);

  const selectedRawDayEvents = useMemo(
    () =>
      selectedDate
        ? sortCalendarEvents(calendarEvents.filter((event) => event.date === selectedDate))
        : [],
    [selectedDate]
  );
  const selectedDayEvents = useMemo(
    () =>
      selectedDate
        ? filteredEventPool.filter((event) => event.date === selectedDate)
        : [],
    [filteredEventPool, selectedDate]
  );

  const orderedFocusEvents = useMemo(
    () => sortByPriority(filteredScopeEvents, true),
    [filteredScopeEvents]
  );
  const visibleFocusEvents = showAllInsights
    ? orderedFocusEvents
    : orderedFocusEvents.slice(0, 8);

  const hasActiveFilters =
    categoryFilter !== "all" ||
    themeFilter !== "all" ||
    impactFilter !== "all" ||
    searchQuery.trim().length > 0;
  const dataIsStale = latestEventDate < todayKey;
  const focusRangeNotCovered =
    scopeFilter === "week" && latestEventDate < focusWeekRange.start;
  const scopeTitle =
    scopeFilter === "week" ? `${focusWeekRange.label}关注清单` : "本月关注清单";

  const resetFilters = () => {
    setCategoryFilter("all");
    setThemeFilter("all");
    setImpactFilter("all");
    setSearchQuery("");
    setShowAllInsights(false);
  };

  const dismissTodayReminder = () => {
    window.sessionStorage.setItem(
      "wise-invest-calendar-reminder-dismissed",
      todayKey
    );
    setTodayReminderOpen(false);
  };

  const openCalendarDate = (dateKey: string) => {
    setSelectedDate(dateKey);
    if (dateKey.slice(0, 7) !== currentMonthKey) {
      setCurrentMonthKey(dateKey.slice(0, 7));
    }
    window.setTimeout(() => {
      selectedDayRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 0);
  };

  const goToToday = () => {
    setCurrentMonthKey(todayMonthKey);
    openCalendarDate(todayKey);
  };

  const showTodayDetails = () => {
    dismissTodayReminder();
    setCategoryFilter("all");
    setThemeFilter("all");
    setImpactFilter("all");
    setSearchQuery("");
    setCurrentMonthKey(todayMonthKey);
    setSelectedDate(todayKey);
    window.setTimeout(() => {
      selectedDayRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[96dvh] w-[calc(100%-0.5rem)] max-w-6xl overflow-y-auto bg-white p-3 text-slate-900 [&>button]:z-50 [&>button]:bg-white [&>button]:text-slate-500 [&>button]:opacity-100 [&>button]:hover:bg-slate-100 sm:w-[calc(100%-1rem)] sm:p-6">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <Calendar className="h-5 w-5 text-amber-600" />
            <DialogTitle className="text-xl font-bold text-slate-950 sm:text-2xl">市场关注日历</DialogTitle>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                dataIsStale
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              )}
            >
              事件覆盖至 {formatDateLabel(latestEventDate)}
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
              {calendarEvents.length} 条
            </span>
          </div>
          <DialogDescription className="text-slate-500">
            先从月历掌握时间，再点击日期查看重点；下方可按财报、主题与影响程度筛选
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2 sm:py-3">
          <section
            aria-labelledby="month-calendar-heading"
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex flex-col gap-3 border-b border-slate-100 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <div className="flex items-center justify-between gap-2 sm:contents">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setCurrentMonthKey((value) => shiftMonthKey(value, -1));
                    setSelectedDate(null);
                  }}
                  className="h-11 w-11 shrink-0 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                  aria-label="上一个月"
                >
                  <ChevronLeft className="h-5 w-5 text-slate-700" />
                </Button>

                <div className="text-center">
                  <h3
                    id="month-calendar-heading"
                    className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl"
                  >
                    {year}年 {monthNames[monthIndex]}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
                    筛选后 {displayedFilteredMonthEvents.length} / {displayedMonthEvents.length} 项 · 点击日期查看详情
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setCurrentMonthKey((value) => shiftMonthKey(value, 1));
                    setSelectedDate(null);
                  }}
                  className="h-11 w-11 shrink-0 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                  aria-label="下一个月"
                >
                  <ChevronRight className="h-5 w-5 text-slate-700" />
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> 财报
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500" /> 经济数据
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-purple-500" /> 宏观
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="ml-1 h-8 rounded-lg border-slate-200 bg-white px-3 text-xs text-slate-700 hover:bg-slate-50"
                >
                  今天
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-[11px] font-bold text-slate-500 sm:py-2.5 sm:text-xs"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map(({ dateKey, day, isCurrentMonth }) => {
                const dayEvents = eventsByDate.get(dateKey) ?? [];
                const isToday = dateKey === todayKey;
                const isSelected = dateKey === selectedDate;
                const isFocusWeek =
                  scopeFilter === "week" &&
                  dateKey >= focusWeekRange.start &&
                  dateKey <= focusWeekRange.end;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => openCalendarDate(dateKey)}
                    aria-pressed={isSelected}
                    aria-label={`${formatDateLabel(dateKey, true)}，${dayEvents.length} 项事件${isToday ? "，今天" : ""}`}
                    className={cn(
                      "relative min-h-[72px] border-[0.5px] border-slate-100 p-1.5 text-left transition hover:z-10 hover:bg-amber-50/60 focus:z-20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-400 sm:min-h-[112px] sm:p-2",
                      !isCurrentMonth && "bg-slate-50/50 text-slate-400",
                      isFocusWeek && "bg-amber-50/35",
                      isSelected && "z-10 bg-amber-50 ring-2 ring-inset ring-amber-400"
                    )}
                  >
                    <span
                      aria-current={isToday ? "date" : undefined}
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold sm:h-7 sm:w-7 sm:text-sm",
                        isToday
                          ? "bg-orange-500 text-white shadow-sm"
                          : isSelected
                            ? "bg-slate-900 text-white"
                            : isCurrentMonth
                              ? "text-slate-900"
                              : "text-slate-400"
                      )}
                    >
                      {day}
                    </span>

                    <div className="mt-2 flex flex-wrap gap-1 sm:hidden">
                      {dayEvents.slice(0, 3).map((event) => (
                        <span
                          key={event.id}
                          className={cn(
                            "h-2 w-2 rounded-full",
                            getCategoryDotStyle(event.category),
                            event.impact === "high" && "ring-2 ring-red-200"
                          )}
                        />
                      ))}
                      {dayEvents.length > 0 && (
                        <span className="ml-auto text-[10px] font-bold text-slate-500">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 hidden space-y-1 overflow-hidden sm:block">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            "flex items-center gap-1 rounded border px-1.5 py-1 text-[10px] font-medium",
                            getCategoryBadgeStyle(event.category),
                            event.impact === "high" && "font-bold"
                          )}
                        >
                          {event.impact === "high" && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                          )}
                          <span className="shrink-0 opacity-60">
                            {event.time === "全天" ? "" : event.time}
                          </span>
                          <span className="truncate">{event.title}</span>
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="px-1 text-[10px] font-semibold text-slate-500">
                          +{dayEvents.length - 2} 项
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {selectedDate && (
            <section
              ref={selectedDayRef}
              aria-labelledby="selected-day-heading"
              className="rounded-2xl border border-amber-200 bg-amber-50/40 p-3 sm:p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 id="selected-day-heading" className="text-lg font-black text-slate-950">
                      {formatDateLabel(selectedDate, true)} · 星期{weekDays[getDateKeyWeekday(selectedDate)]}
                    </h4>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500 shadow-sm">
                      {selectedDayEvents.length} 项
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    当天重点会在这里展开，月历仍保留在上方作为总览
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-800"
                  aria-label="收起当天详情"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {selectedDayEvents.length > 0 ? (
                <div className="mt-3 grid gap-3">
                  {selectedDayEvents.map((event) => (
                    <EventInsightCard
                      key={event.id}
                      event={event}
                      todayKey={todayKey}
                      compact
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-dashed border-amber-200 bg-white/80 px-4 py-7 text-center">
                  <Database className="mx-auto h-6 w-6 text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {selectedRawDayEvents.length > 0
                      ? "当天事件已被当前筛选隐藏"
                      : "当天暂无已录入事件"}
                  </p>
                  {selectedRawDayEvents.length > 0 && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-2 text-xs font-semibold text-amber-700 hover:text-amber-800"
                    >
                      清除筛选，查看当天 {selectedRawDayEvents.length} 项事件
                    </button>
                  )}
                </div>
              )}
            </section>
          )}

          <section
            aria-labelledby="calendar-filter-heading"
            className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h4 id="calendar-filter-heading" className="font-bold text-slate-950">
                    筛选关注内容
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">
                    时间范围控制下方清单；分类、主题与重大筛选也会同步更新上方月历
                  </p>
                </div>
                <label className="relative block w-full lg:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <span className="sr-only">搜索日历事件</span>
                  <input
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setShowAllInsights(false);
                    }}
                    placeholder="搜索公司、指标或关键词"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-300 focus:bg-white focus:ring-2 focus:ring-amber-100"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-bold text-slate-500">查看范围</span>
                <button
                  type="button"
                  aria-pressed={scopeFilter === "week"}
                  onClick={() => {
                    setScopeFilter("week");
                    setShowAllInsights(false);
                  }}
                  className={cn(
                    "min-h-11 rounded-xl border px-3 py-1.5 text-left transition",
                    scopeFilter === "week"
                      ? "border-amber-300 bg-amber-50 text-amber-900"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <span className="block text-xs font-bold">
                    {focusWeekRange.label} <span className="opacity-60">{focusWeekEvents.length}</span>
                  </span>
                  <span className="block text-[10px] opacity-60">
                    {formatShortDate(focusWeekRange.start)} — {formatShortDate(focusWeekRange.end)}
                  </span>
                </button>
                <button
                  type="button"
                  aria-pressed={scopeFilter === "month"}
                  onClick={() => {
                    setScopeFilter("month");
                    setShowAllInsights(false);
                  }}
                  className={cn(
                    "min-h-11 rounded-xl border px-3 py-1.5 text-left transition",
                    scopeFilter === "month"
                      ? "border-amber-300 bg-amber-50 text-amber-900"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <span className="block text-xs font-bold">
                    本月（{Number(todayMonthKey.slice(5))}月）{" "}
                    <span className="opacity-60">{currentMonthEvents.length}</span>
                  </span>
                  <span className="block text-[10px] opacity-60">
                    {formatShortDate(`${todayMonthKey}-01`)} — {formatShortDate(monthEnd)}
                  </span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-bold text-slate-500">分类</span>
                {categoryOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={categoryFilter === option.value}
                    onClick={() => {
                      setCategoryFilter(option.value);
                      setShowAllInsights(false);
                    }}
                    className={cn(
                      "min-h-9 rounded-full border px-3 text-xs font-semibold transition",
                      categoryFilter === option.value
                        ? "border-slate-800 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {option.label}
                    <span className="ml-1 opacity-60">{categoryCounts[option.value]}</span>
                  </button>
                ))}
                <button
                  type="button"
                  aria-pressed={impactFilter === "high"}
                  onClick={() => {
                    setImpactFilter((value) => (value === "high" ? "all" : "high"));
                    setShowAllInsights(false);
                  }}
                  className={cn(
                    "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition",
                    impactFilter === "high"
                      ? "border-red-300 bg-red-50 text-red-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:bg-red-50/50"
                  )}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  只看重大
                  <span className="opacity-60">
                    {scopeEvents.filter((event) => event.impact === "high").length}
                  </span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-bold text-slate-500">主题</span>
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={themeFilter === option.value}
                    disabled={option.value !== "all" && themeCounts[option.value] === 0}
                    onClick={() => {
                      setThemeFilter(option.value);
                      setShowAllInsights(false);
                    }}
                    className={cn(
                      "min-h-9 rounded-full border px-3 text-xs font-semibold transition",
                      themeFilter === option.value
                        ? "border-amber-300 bg-amber-50 text-amber-800"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                      option.value !== "all" &&
                        themeCounts[option.value] === 0 &&
                        "cursor-not-allowed opacity-40"
                    )}
                  >
                    {option.label}
                    <span className="ml-1 opacity-60">{themeCounts[option.value]}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-500" aria-live="polite">
                  {scopeFilter === "week" ? focusWeekRange.label : "本月"}显示
                  <strong className="mx-1 text-slate-800">{filteredScopeEvents.length}</strong>/ {scopeEvents.length} 项
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    清除筛选
                  </button>
                )}
              </div>
            </div>
          </section>

          <section aria-labelledby="calendar-insights-heading">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h4 id="calendar-insights-heading" className="text-lg font-bold text-slate-950">
                  {scopeTitle}
                </h4>
                <p className="mt-1 text-xs text-slate-500">
                  {scopeFilter === "week"
                    ? `${formatDateLabel(focusWeekRange.start)}—${formatDateLabel(focusWeekRange.end)}，按日期查看值得关注的事项`
                    : "按日期排列本月事件，筛选结果会同步更新"}
                </p>
              </div>
              {orderedFocusEvents.length > 0 && (
                <span className="text-xs font-medium text-slate-400">
                  重大 {orderedFocusEvents.filter((event) => event.impact === "high").length} 项
                </span>
              )}
            </div>

            {visibleFocusEvents.length > 0 ? (
              <>
                <div className="grid gap-3 lg:grid-cols-2">
                  {visibleFocusEvents.map((event) => (
                    <EventInsightCard key={event.id} event={event} todayKey={todayKey} />
                  ))}
                </div>
                {orderedFocusEvents.length > 8 && (
                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setShowAllInsights((value) => !value)}
                      className="rounded-full"
                    >
                      {showAllInsights
                        ? "收起部分事件"
                        : `查看全部 ${orderedFocusEvents.length} 项`}
                    </Button>
                  </div>
                )}
                <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400">
                  影响解读仅说明常见传导路径，不代表公布后的确定走势；实际反应取决于市场预期、数据修正和当时定价。
                </p>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-10 text-center">
                <Database className="mx-auto h-8 w-8 text-slate-300" />
                <h5 className="mt-3 font-semibold text-slate-800">
                  {focusRangeNotCovered
                    ? "未来事件数据尚未更新"
                    : scopeEvents.length === 0
                      ? "当前范围暂无已录入事件"
                      : "当前筛选暂无结果"}
                </h5>
                <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-slate-500">
                  {focusRangeNotCovered
                    ? `当前事件覆盖至 ${formatDateLabel(latestEventDate, true)}，这不代表之后没有重要事件。`
                    : scopeEvents.length === 0
                      ? "可以切换到本月，或在上方月历选择其他日期查看。"
                      : "可以减少筛选条件或清除筛选，查看当前时间范围内的其他事件。"}
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  {scopeFilter === "week" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setScopeFilter("month")}
                      className="rounded-full"
                    >
                      查看本月
                    </Button>
                  )}
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetFilters}
                      className="rounded-full"
                    >
                      清除筛选
                    </Button>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        {todayReminderOpen && todayEvents.length > 0 && (
          <div
            className="pointer-events-none absolute inset-x-3 top-20 z-40 flex justify-center sm:inset-x-8 sm:top-24"
          >
            <aside
              aria-labelledby="today-reminder-title"
              aria-live="assertive"
              className="pointer-events-auto relative w-full max-w-lg rounded-2xl border border-amber-200 bg-white p-4 shadow-2xl ring-1 ring-amber-100 sm:p-5"
            >
              <button
                type="button"
                onClick={dismissTodayReminder}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                aria-label="关闭今日提醒"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="pr-10">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  今日重点提醒
                </span>
                <h3 id="today-reminder-title" className="mt-3 text-xl font-black text-slate-950">
                  今天有 {todayEvents.length} 项值得关注
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  其中 {todayEvents.filter((event) => event.impact === "high").length} 项重大事件，请留意公布时间与预期差。
                </p>
              </div>

              <div className="mt-4 space-y-2">
                {sortByPriority(todayEvents, false)
                  .slice(0, 3)
                  .map((event) => (
                    <div key={event.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-slate-700">{event.time}</span>
                        <span className={cn("rounded-md border px-1.5 py-0.5", getImpactBadgeStyle(event.impact))}>
                          {getImpactLabel(event.impact)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-bold text-slate-950">{event.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                        {event.description}
                      </p>
                    </div>
                  ))}
              </div>

              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="ghost" onClick={dismissTodayReminder}>
                  知道了
                </Button>
                <Button onClick={showTodayDetails} className="bg-amber-500 text-white hover:bg-amber-600">
                  查看今日详情
                </Button>
              </div>
            </aside>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
