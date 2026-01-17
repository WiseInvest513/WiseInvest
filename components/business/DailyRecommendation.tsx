"use client";

import { useState, useEffect, useMemo } from "react";
import { Gift, BookOpen, Scissors, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RecommendationItem {
  type: "welfare" | "article" | "wool";
  title: string;
  desc: string;
  link: string;
  tag: string;
}

interface RecommendationLog {
  lastShownTime: number;
  suppress24h: boolean;
}

const STORAGE_KEY = "wise_invest_recommendation_log";
const DEFAULT_INTERVAL = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
const SUPPRESS_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// 硬编码的推荐数据（临时用于测试）
const HARDCODED_RECOMMENDATIONS: RecommendationItem[] = [
  {
    type: "welfare",
    title: "Wise Invest 专属会员福利",
    desc: "加入社群，获取每日独家研报与宏观策略。",
    link: "https://x.com/WiseInvest513",
    tag: "长期福利",
  },
  {
    type: "article",
    title: "2026 宏观经济展望：降息周期的资产配置",
    desc: "深度解析美联储最新动向，万字长文。",
    link: "https://x.com/WiseInvest513",
    tag: "深度好文",
  },
  {
    type: "wool",
    title: "某交易所新户注册送 50U",
    desc: "限时活动，截止到本月底，手慢无。",
    link: "https://x.com/WiseInvest513",
    tag: "限时羊毛",
  },
];

// 安全解析 JSON 环境变量
function parseRecommendations(): RecommendationItem[] | null {
  // 临时：优先使用硬编码数据
  if (HARDCODED_RECOMMENDATIONS.length > 0) {
    return HARDCODED_RECOMMENDATIONS;
  }

  if (typeof window === "undefined") return null;

  try {
    const jsonString = process.env.NEXT_PUBLIC_RECOMMENDATIONS_JSON;
    if (!jsonString) return null;

    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    // 验证数据结构
    const validItems = parsed.filter(
      (item): item is RecommendationItem =>
        item &&
        typeof item === "object" &&
        ["welfare", "article", "wool"].includes(item.type) &&
        typeof item.title === "string" &&
        typeof item.desc === "string" &&
        typeof item.link === "string" &&
        typeof item.tag === "string"
    );

    return validItems.length > 0 ? validItems.slice(0, 3) : null; // 最多3个
  } catch (error) {
    console.warn("[DailyRecommendation] Failed to parse recommendations:", error);
    return null;
  }
}

// 读取 localStorage 日志
function getRecommendationLog(): RecommendationLog {
  if (typeof window === "undefined") {
    return { lastShownTime: 0, suppress24h: false };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { lastShownTime: 0, suppress24h: false };

    const parsed = JSON.parse(stored);
    return {
      lastShownTime: parsed.lastShownTime || 0,
      suppress24h: parsed.suppress24h || false,
    };
  } catch (error) {
    console.warn("[DailyRecommendation] Failed to read log:", error);
    return { lastShownTime: 0, suppress24h: false };
  }
}

// 保存到 localStorage
function saveRecommendationLog(log: RecommendationLog): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch (error) {
    console.warn("[DailyRecommendation] Failed to save log:", error);
  }
}

// 判断是否应该显示弹窗
function shouldShowModal(): boolean {
  const log = getRecommendationLog();
  const now = Date.now();
  const timeSinceLastShown = now - log.lastShownTime;

  // 如果设置了24小时不再提醒
  if (log.suppress24h) {
    return timeSinceLastShown >= SUPPRESS_INTERVAL;
  }

  // 默认3小时规则
  return timeSinceLastShown >= DEFAULT_INTERVAL;
}

export function DailyRecommendation() {
  const [open, setOpen] = useState(false);
  const [suppress24h, setSuppress24h] = useState(false);

  const recommendations = useMemo(() => parseRecommendations(), []);

  useEffect(() => {
    // 如果没有推荐内容，不显示
    if (!recommendations || recommendations.length === 0) return;

    // 检查是否应该显示
    if (shouldShowModal()) {
      setOpen(true);
      // 更新显示时间
      const log = getRecommendationLog();
      saveRecommendationLog({
        ...log,
        lastShownTime: Date.now(),
      });
    }
  }, [recommendations]);

  const handleClose = () => {
    setOpen(false);
    const log = getRecommendationLog();
    saveRecommendationLog({
      ...log,
      lastShownTime: Date.now(),
      suppress24h: suppress24h,
    });
  };

  const handleCardClick = (link: string) => {
    window.open(link, "_blank", "noopener,noreferrer");
  };

  const getTypeConfig = (type: RecommendationItem["type"]) => {
    switch (type) {
      case "welfare":
        return {
          iconBg: "bg-amber-50",
          iconColor: "text-amber-600",
          hoverBorder: "hover:border-amber-200",
          hoverGlow: "hover:shadow-amber-100/50",
          icon: Gift,
        };
      case "article":
        return {
          iconBg: "bg-indigo-50",
          iconColor: "text-indigo-600",
          hoverBorder: "hover:border-indigo-200",
          hoverGlow: "hover:shadow-indigo-100/50",
          icon: BookOpen,
        };
      case "wool":
        return {
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-600",
          hoverBorder: "hover:border-emerald-200",
          hoverGlow: "hover:shadow-emerald-100/50",
          icon: Scissors,
        };
    }
  };

  // 如果没有推荐内容，不渲染
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn(
          "max-w-2xl sm:max-w-3xl max-h-[90vh] overflow-y-auto",
          "bg-white/90 backdrop-blur-xl",
          "border border-gray-100 shadow-2xl",
          "rounded-2xl",
          "animate-in fade-in-0 zoom-in-95 duration-300"
        )}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 tracking-tight">
            今日精选
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 font-sans">
            为您精心挑选的优质内容，不容错过
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-6">
          {recommendations.map((item, index) => {
            const config = getTypeConfig(item.type);
            const Icon = config.icon;

            return (
              <div
                key={index}
                onClick={() => handleCardClick(item.link)}
                className={cn(
                  "group relative flex items-center gap-4 p-4 sm:p-5",
                  "bg-white rounded-xl border border-gray-100",
                  "cursor-pointer transition-all duration-300",
                  "hover:scale-[1.02] hover:shadow-lg hover:border-gray-200",
                  config.hoverBorder,
                  "active:scale-[0.98]",
                  "animate-in fade-in-0 slide-in-from-bottom-2"
                )}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animationDuration: "400ms",
                  animationFillMode: "both",
                }}
              >
                {/* Left: Icon Container */}
                <div
                  className={cn(
                    "flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center",
                    config.iconBg
                  )}
                >
                  <Icon className={cn("w-7 h-7 sm:w-8 sm:h-8", config.iconColor)} />
                </div>

                {/* Middle: Title + Description */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-1">
                    {item.desc}
                  </p>
                </div>

                {/* Right: Tag Pill */}
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-gray-200 text-gray-600 bg-gray-50">
                    {item.tag}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex justify-end pt-4 border-t border-gray-100">
          <Button
            onClick={handleClose}
            className={cn(
              "w-full sm:w-auto",
              "bg-gray-900 hover:bg-gray-800 text-white",
              "rounded-full px-8 py-2.5",
              "font-medium transition-all duration-200",
              "hover:scale-105 active:scale-95"
            )}
          >
            知道了
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
