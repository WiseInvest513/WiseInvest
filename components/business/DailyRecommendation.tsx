"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Gift, BookOpen, Scissors } from "lucide-react";
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
import { openSafeExternalUrl } from "@/lib/security/external-links";
import { dailyRecommendations, type RecommendationItem } from "@/lib/daily-recommendations";
import { suppressAutomaticRecommendation } from "@/lib/recommendation-visibility";

interface RecommendationLog {
  lastShownTime: number;
}

const STORAGE_KEY = "wise_invest_recommendation_log";
const DEFAULT_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

// 读取 localStorage 日志
function getRecommendationLog(): RecommendationLog {
  if (typeof window === "undefined") {
    return { lastShownTime: 0 };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { lastShownTime: 0 };

    const parsed = JSON.parse(stored);
    return {
      lastShownTime: parsed.lastShownTime || 0,
    };
  } catch (error) {
    console.warn("[DailyRecommendation] Failed to read log:", error);
    return { lastShownTime: 0 };
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

  // 12小时规则
  return timeSinceLastShown >= DEFAULT_INTERVAL;
}

interface DailyRecommendationProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DailyRecommendation({ open: controlledOpen, onOpenChange: controlledOnOpenChange }: DailyRecommendationProps = {}) {
  const pathname = usePathname();
  const suppressAutomatic = suppressAutomaticRecommendation(pathname);
  const [internalOpen, setInternalOpen] = useState(false);
  const [communityChannel, setCommunityChannel] = useState<"telegram" | "wechat">("wechat");
  const recommendations: RecommendationItem[] = useMemo(
    () => dailyRecommendations.slice(0, 3),
    []
  );

  // 使用受控或非受控模式
  const open = controlledOpen !== undefined ? controlledOpen : !suppressAutomatic && internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  useEffect(() => {
    // 如果是受控模式（手动触发），不自动显示
    if (controlledOpen !== undefined || suppressAutomatic) {
      return;
    }

    // 如果没有推荐内容，不自动显示（但手动点击仍可显示）
    if (recommendations.length === 0) return;

    // 检查是否应该显示（12小时规则）
    if (shouldShowModal()) {
      setInternalOpen(true);
      // 更新显示时间
      const log = getRecommendationLog();
      saveRecommendationLog({
        ...log,
        lastShownTime: Date.now(),
      });
    }
  }, [recommendations, controlledOpen, suppressAutomatic]);

  const handleClose = () => {
    setOpen(false);
    const log = getRecommendationLog();
    saveRecommendationLog({
      ...log,
      lastShownTime: Date.now(),
    });
  };

  const handleCardClick = (link: string) => {
    if (link.startsWith("/")) {
      window.open(link, "_blank", "noopener,noreferrer");
      return;
    }
    openSafeExternalUrl(link);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn(
          "w-[calc(100vw-32px)] max-w-[340px] max-h-[calc(100dvh-32px)] overflow-y-auto p-5 gap-4",
          "bg-white dark:bg-slate-800",
          "border border-slate-200 dark:border-slate-700 shadow-[0_24px_60px_rgba(0,0,0,0.30)]",
          "rounded-2xl",
          "animate-in fade-in-0 zoom-in-95 duration-300"
        )}
      >
        <DialogHeader className="space-y-1 text-left"><p className="text-[11px] font-semibold tracking-widest text-sky-600">WISEINVEST 社区</p>
          <DialogTitle className="text-[18px] font-semibold text-slate-900 dark:text-slate-50">
            今日精选
          </DialogTitle>
          <DialogDescription className="text-[13px] text-slate-500 dark:text-slate-400">
            为您精心挑选的优质内容，不容错过
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-0">
          {recommendations.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg mb-2">暂无推荐内容</p>
              <p className="text-gray-400 text-sm">
                请在 `lib/daily-recommendations.ts` 中维护每日精选内容
              </p>
            </div>
          ) : (
            recommendations.map((item, index) => {
            const config = getTypeConfig(item.type);
            const Icon = config.icon;

            return (
              <div
                key={index}
                onClick={() => handleCardClick(item.link)}
                className={cn(
                  "group relative flex flex-col items-start gap-3 p-3",
                  "bg-white dark:bg-slate-800 rounded-xl border cursor-pointer transition-colors",
                  "hover:border-slate-300",
                  "",
                  "",
                  item.featured ? "border-slate-200 dark:border-slate-700 hover:border-sky-300" : "border-slate-200 dark:border-slate-700 hover:border-sky-300",
                  config.hoverBorder
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
                    "hidden",
                    config.iconBg
                  )}
                >
                  <Icon className={cn("w-7 h-7 sm:w-8 sm:h-8", config.iconColor)} />
                </div>

                {/* Middle: Title + Description */}
                <div className="w-full min-w-0">
                  <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-50 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400">
                    {item.desc}
                  </p>
                  {item.title === "Wise Invest 官方社群" && (
                    <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-slate-50 dark:bg-slate-700 p-1" onClick={(event) => event.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setCommunityChannel("wechat")}
                        className={cn("rounded-lg px-2 py-2 text-[13px] font-semibold transition-colors", communityChannel === "wechat" ? "bg-[#07c160] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
                      >
                        微信群
                      </button>
                      <button
                        type="button"
                        onClick={() => setCommunityChannel("telegram")}
                        className={cn("rounded-lg px-2 py-2 text-[13px] font-semibold transition-colors", communityChannel === "telegram" ? "bg-[#0284c7] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
                      >
                        Telegram 群
                      </button>
                      {communityChannel === "telegram" ? (
                        <button type="button" onClick={() => openSafeExternalUrl("https://t.me/WiseInvest513Chat")} className="text-xs text-sky-600 hover:underline">
                          立即加入 →
                        </button>
                      ) : (
                        <div className="col-span-2 mt-3 flex w-full flex-col items-center gap-2">
                          <a
                            href="/草料图片.png"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className="block rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
                            title="点击查看微信群二维码大图"
                          >
                            <img src="/草料图片.png" alt="微信群二维码（点击查看大图）" className="h-auto w-full rounded-xl border border-emerald-100 object-contain" />
                          </a>
                          <span className="text-xs text-gray-500">打开微信扫码加入</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Tag Pill & Featured Badge */}
                <div className="flex flex-wrap gap-2 items-center">
                  {item.featured && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700">
                      ★ 推荐
                    </span>
                  )}
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-gray-200 text-gray-600 bg-gray-50">
                    {item.tag}
                  </span>
                </div>
              </div>
            );
          })
          )}
        </div>

        <DialogFooter className="flex justify-end pt-4 border-t border-gray-100">
          <Button
            onClick={handleClose}
            className={cn(
              "w-full sm:w-auto",
              "bg-gray-900 hover:bg-gray-800 text-white",
              "rounded-xl px-5 py-2.5",
              "font-medium transition-all duration-200",
              ""
            )}
          >
            知道了
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
