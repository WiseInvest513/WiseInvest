"use client";

import { useState, useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  tag: string;
  color: "red" | "orange" | "blue" | "green" | "purple";
}

// 生成当前月份的模拟事件数据 - 确保今天（1月17日）有事件
const generateMockEvents = (year: number, month: number): CalendarEvent[] => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  // 基础事件模板
  const baseEvents: Omit<CalendarEvent, "id" | "date">[] = [
    { title: "CPI 数据发布", tag: "高影响", color: "red" },
    { title: "BTC ETF 决策", tag: "加密货币", color: "orange" },
    { title: "美联储主席讲话", tag: "中等", color: "blue" },
    { title: "Q4 财报", tag: "股票", color: "green" },
    { title: "欧易空投", tag: "空投", color: "green" },
    { title: "Bitget 空投", tag: "空投", color: "green" },
    { title: "FOMC 会议", tag: "高影响", color: "red" },
    { title: "非农数据", tag: "经济", color: "blue" },
    { title: "GDP 发布", tag: "经济", color: "blue" },
    { title: "以太坊升级", tag: "加密货币", color: "orange" },
  ];

  const events: CalendarEvent[] = [];
  let eventId = 1;

  // 如果查看的是当前月份，使用特定的日期
  if (year === currentYear && month === currentMonth) {
    // 确保今天（17日）有事件
    events.push({
      id: `event-${eventId++}`,
      date: new Date(year, month, 17),
      title: "BTC ETF 决策",
      tag: "加密货币",
      color: "orange",
    });

    // 其他固定日期的事件
    events.push({
      id: `event-${eventId++}`,
      date: new Date(year, month, 15),
      title: "CPI 数据发布",
      tag: "高影响",
      color: "red",
    });

    events.push({
      id: `event-${eventId++}`,
      date: new Date(year, month, 24),
      title: "美联储主席讲话",
      tag: "中等",
      color: "blue",
    });

    events.push({
      id: `event-${eventId++}`,
      date: new Date(year, month, 28),
      title: "Q4 财报",
      tag: "股票",
      color: "green",
    });

    // 添加一些额外的随机事件使日历看起来更充实
    const additionalDates = [10, 12, 18, 20, 22, 25, 30];
    additionalDates.forEach((day) => {
      const randomEvent = baseEvents[Math.floor(Math.random() * baseEvents.length)];
      events.push({
        id: `event-${eventId++}`,
        date: new Date(year, month, day),
        title: randomEvent.title,
        tag: randomEvent.tag,
        color: randomEvent.color,
      });
    });
  } else {
    // 对于其他月份，随机生成一些事件
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const eventDates = [5, 8, 12, 15, 18, 22, 25, 28];
    
    eventDates.forEach((day) => {
      if (day <= daysInMonth) {
        const randomEvent = baseEvents[Math.floor(Math.random() * baseEvents.length)];
        events.push({
          id: `event-${eventId++}`,
          date: new Date(year, month, day),
          title: randomEvent.title,
          tag: randomEvent.tag,
          color: randomEvent.color,
        });
      }
    });
  }

  return events;
};

interface EventCalendarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventCalendar({ open, onOpenChange }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // 生成当前月份的模拟事件
  const events = useMemo(() => generateMockEvents(year, month), [year, month]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 获取月份的第一天和最后一天
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // 生成日历天数数组（包含上个月和下个月的日期）
  const days = useMemo(() => {
    const daysArray: Array<{ day: number; isCurrentMonth: boolean; date: Date }> = [];
    
    // 填充上个月的日期
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonthLastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
    
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      daysArray.push({
        day,
        isCurrentMonth: false,
        date: new Date(prevYear, prevMonth, day),
      });
    }
    
    // 填充当前月的日期
    for (let day = 1; day <= daysInMonth; day++) {
      daysArray.push({
        day,
        isCurrentMonth: true,
        date: new Date(year, month, day),
      });
    }
    
    // 填充下个月的日期（填满6行）
    const remainingDays = 42 - daysArray.length; // 6行 × 7列 = 42
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      daysArray.push({
        day,
        isCurrentMonth: false,
        date: new Date(nextYear, nextMonth, day),
      });
    }
    
    return daysArray;
  }, [startingDayOfWeek, daysInMonth, year, month]);

  // 获取某一天的事件
  const getEventsForDay = (date: Date): CalendarEvent[] => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === date.getTime();
    });
  };

  // 导航到上一个月
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // 导航到下一个月
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // 导航到今天
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    "一月", "二月", "三月", "四月", "五月", "六月",
    "七月", "八月", "九月", "十月", "十一月", "十二月"
  ];

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  const getEventBadgeStyle = (color: CalendarEvent["color"]) => {
    switch (color) {
      case "red":
        return "bg-red-50 text-red-600 border-red-200";
      case "orange":
        return "bg-orange-50 text-orange-600 border-orange-200";
      case "blue":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "green":
        return "bg-green-50 text-green-600 border-green-200";
      case "purple":
        return "bg-purple-50 text-purple-600 border-purple-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-yellow-600" />
            <DialogTitle className="text-2xl font-bold">重要事件日历</DialogTitle>
          </div>
          <DialogDescription className="text-slate-500">
            查看空投、活动等重要事件的时间安排
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 月份导航 - Professional Header */}
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousMonth}
              className="h-10 w-10 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </Button>
            <div className="flex items-center gap-6">
              <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                {year}年 {monthNames[month]}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="h-9 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 border-gray-200"
              >
                今天
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextMonth}
              className="h-10 w-10 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </Button>
          </div>

          {/* 日历网格 - Professional Notion/Apple Style */}
          <div className="border-[0.5px] border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
            {/* 星期标题 */}
            <div className="grid grid-cols-7 bg-gray-50/50 border-b-[0.5px] border-gray-200">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="p-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 日期网格 - Notion Style: 固定高度，左上对齐 */}
            <div className="grid grid-cols-7">
              {days.map((dayInfo, index) => {
                const { day, isCurrentMonth, date } = dayInfo;
                const dayEvents = getEventsForDay(date);
                const isToday = date.getTime() === today.getTime();

                return (
                  <div
                    key={index}
                    className={cn(
                      "h-24 min-h-[96px] border-[0.5px] border-gray-100 p-2 flex flex-col items-start justify-start",
                      !isCurrentMonth && "bg-gray-50/30",
                      isToday && "bg-orange-50/30"
                    )}
                  >
                    {/* 日期数字 - 严格左上角 */}
                    <div className="flex items-start justify-start mb-1.5">
                      {isToday ? (
                        <div className="w-6 h-6 rounded-md bg-orange-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                          {day}
                        </div>
                      ) : (
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            isCurrentMonth
                              ? "text-gray-900"
                              : "text-gray-400"
                          )}
                        >
                          {day}
                        </span>
                      )}
                    </div>

                    {/* 事件列表 - 紧凑的圆角条带 */}
                    <div className="flex-1 w-full space-y-0.5 overflow-hidden">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-sm mb-0.5 font-medium truncate w-full border-[0.5px]",
                            getEventBadgeStyle(event.color)
                          )}
                          title={`${event.title} - ${event.tag}`}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[10px] text-gray-500 px-1.5 py-0.5 font-medium">
                          +{dayEvents.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 事件列表（按时间排序） */}
          <div className="border-[0.5px] border-gray-200 rounded-xl p-5 bg-white shadow-sm">
            <h4 className="font-bold mb-4 text-lg text-gray-900">本月事件</h4>
            <div className="space-y-2">
              {events
                .filter((event) => {
                  const eventDate = new Date(event.date);
                  return (
                    eventDate.getFullYear() === year &&
                    eventDate.getMonth() === month
                  );
                })
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .map((event) => {
                  const eventDate = new Date(event.date);
                  return (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-sm font-semibold text-gray-600 min-w-[90px]">
                        {eventDate.getMonth() + 1}月{eventDate.getDate()}日
                      </div>
                      <div
                        className={cn(
                          "text-xs rounded-md px-2 py-1 border-[0.5px] font-medium",
                          getEventBadgeStyle(event.color)
                        )}
                      >
                        {event.tag}
                      </div>
                      <div className="flex-1 text-sm text-gray-900 font-medium">
                        {event.title}
                      </div>
                    </div>
                  );
                })}
              {events.filter(
                (event) =>
                  new Date(event.date).getFullYear() === year &&
                  new Date(event.date).getMonth() === month
              ).length === 0 && (
                <div className="text-sm text-gray-500 text-center py-8">
                  本月暂无事件
                </div>
              )}
            </div>
          </div>

          {/* 图例 */}
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-red-50 border-[0.5px] border-red-200"></div>
              <span>高影响</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-orange-50 border-[0.5px] border-orange-200"></div>
              <span>加密货币</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-blue-50 border-[0.5px] border-blue-200"></div>
              <span>经济数据</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-green-50 border-[0.5px] border-green-200"></div>
              <span>股票/空投</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
