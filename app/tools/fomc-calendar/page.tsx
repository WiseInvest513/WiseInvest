"use client";

import Link from "next/link";
import { ArrowLeft, Calendar, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FOMC_MEETINGS_2026, type FOMCMeeting } from "@/lib/constants/fomc-2026";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

/**
 * FOMC Calendar Page
 * FOMC 会议日程页面
 */
export default function FOMCCalendarPage() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Categorize meetings
  const { upcoming, past, today } = useMemo(() => {
    const upcoming: FOMCMeeting[] = [];
    const past: FOMCMeeting[] = [];
    let todayMeeting: FOMCMeeting | null = null;

    FOMC_MEETINGS_2026.forEach((meeting) => {
      const meetingDate = new Date(meeting.date);
      meetingDate.setHours(0, 0, 0, 0);
      const endDate = new Date(meeting.endDate);
      endDate.setHours(23, 59, 59, 999);

      // Check if meeting is today or ongoing
      if (now >= meetingDate && now <= endDate) {
        todayMeeting = meeting;
      } else if (meetingDate > now) {
        upcoming.push(meeting);
      } else {
        past.push(meeting);
      }
    });

    // Sort upcoming by date (ascending)
    upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());
    // Sort past by date (descending)
    past.sort((a, b) => b.date.getTime() - a.date.getTime());

    return { upcoming, past, today: todayMeeting };
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const formatDateRange = (startDate: Date, endDate: Date) => {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    if (start === end) {
      return start;
    }
    return `${start} - ${end}`;
  };

  const getDaysUntil = (date: Date) => {
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const MeetingCard = ({ meeting, variant }: { meeting: FOMCMeeting; variant: "upcoming" | "past" | "today" }) => {
    const isUpcoming = variant === "upcoming";
    const isToday = variant === "today";
    const daysUntil = isUpcoming ? getDaysUntil(meeting.date) : null;

    return (
      <Card
        className={cn(
          "transition-all",
          isToday
            ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 shadow-md"
            : isUpcoming
            ? "hover:border-amber-400 dark:hover:border-amber-600"
            : "opacity-60"
        )}
      >
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">
                  {meeting.title}
                </h3>
                {meeting.hasSEP && (
                  <Badge variant="outline" className="text-xs border-amber-400 text-amber-700 dark:text-amber-400">
                    SEP
                  </Badge>
                )}
                {isToday && (
                  <Badge className="bg-amber-500 text-white text-xs">
                    进行中
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{formatDateRange(meeting.date, meeting.endDate)}</span>
              </div>
              {isUpcoming && daysUntil !== null && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    {daysUntil === 0
                      ? "今天"
                      : daysUntil === 1
                      ? "明天"
                      : `还有 ${daysUntil} 天`}
                  </span>
                </div>
              )}
            </div>
            {isUpcoming && (
              <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/tools"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回工具列表
          </Link>
        </div>

        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              <div>
                <CardTitle className="text-3xl font-serif font-bold">
                  2026 年美联储会议日程
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  查看美联储公开市场委员会（FOMC）的会议日程和重要日期
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="space-y-6">
          {/* Today's Meeting */}
          {today && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                当前会议
              </h3>
              <MeetingCard meeting={today} variant="today" />
            </div>
          )}

          {/* Upcoming Meetings */}
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                即将到来 ({upcoming.length})
              </h3>
              <div className="space-y-3">
                {upcoming.map((meeting, index) => (
                  <MeetingCard key={index} meeting={meeting} variant="upcoming" />
                ))}
              </div>
            </div>
          )}

          {/* Past Meetings */}
          {past.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                已结束 ({past.length})
              </h3>
              <div className="space-y-3">
                {past.map((meeting, index) => (
                  <MeetingCard key={index} meeting={meeting} variant="past" />
                ))}
              </div>
            </div>
          )}

          {/* Info Footer */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">
                <strong>SEP</strong> = Summary of Economic Projections (经济预测摘要)
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                数据来源：美联储官方日程（2026年暂定）
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
