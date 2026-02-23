"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Lock, Clock, ExternalLink, ChevronDown, ChevronUp, Trophy, ArrowRight, Sparkles, RotateCcw } from "lucide-react";
import { roadmaps, type RoadmapStep } from "@/lib/roadmaps-data";
import { cn } from "@/lib/utils";

type StepStatus = "locked" | "active" | "completed";

export default function RoadmapDetailPage() {
  const params = useParams();
  const roadmapId = params.id as string;
  const roadmap = roadmaps.find((r) => r.id === roadmapId);

  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Load progress from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(`roadmap-progress-${roadmapId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCompletedSteps(new Set(parsed));
      } catch (e) {
        console.error("Failed to load roadmap progress", e);
      }
    }
  }, [roadmapId]);

  // Save progress to localStorage
  useEffect(() => {
    if (typeof window === "undefined" || completedSteps.size === 0) return;
    localStorage.setItem(
      `roadmap-progress-${roadmapId}`,
      JSON.stringify(Array.from(completedSteps))
    );
  }, [completedSteps, roadmapId]);

  // Check if all steps are completed and trigger celebration
  const isFullyCompleted = roadmap ? completedSteps.size === roadmap.steps.length : false;
  
  useEffect(() => {
    if (isFullyCompleted) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setShowCelebration(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isFullyCompleted]);

  if (!roadmap) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">路线图未找到</h1>
          <Link
            href="/roadmap"
            className="text-yellow-600 dark:text-yellow-500 hover:underline"
          >
            返回路线图列表
          </Link>
        </div>
      </div>
    );
  }

  const getStepStatus = (step: RoadmapStep, index: number): StepStatus => {
    if (index === 0) {
      return completedSteps.has(step.id) ? "completed" : "active";
    }

    if (step.prerequisites && step.prerequisites.length > 0) {
      const allPrereqsCompleted = step.prerequisites.every((prereqId) =>
        completedSteps.has(prereqId)
      );
      if (!allPrereqsCompleted) {
        return "locked";
      }
    }

    const previousStep = roadmap.steps[index - 1];
    if (!completedSteps.has(previousStep.id)) {
      return "locked";
    }

    if (completedSteps.has(step.id)) {
      return "completed";
    }

    const allPreviousCompleted = roadmap.steps
      .slice(0, index)
      .every((s) => completedSteps.has(s.id));
    return allPreviousCompleted ? "active" : "locked";
  };

  const handleMarkComplete = (stepId: string) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.add(stepId);
      return next;
    });
  };

  const handleToggleExpand = (stepId: string) => {
    setExpandedStep((prev) => (prev === stepId ? null : stepId));
  };

  const handleResetProgress = () => {
    if (typeof window === "undefined") return;
    // Clear localStorage
    localStorage.removeItem(`roadmap-progress-${roadmapId}`);
    // Reset state
    setCompletedSteps(new Set());
    setShowCelebration(false);
    setShowResetConfirm(false);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      investment: "投资理财",
      us_stocks: "美股市场",
      web3: "Web3 探索",
      index_investing: "指数投资",
      overseas_earning: "出海赚钱",
      ai_zone: "AI 学习专区",
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      investment: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      us_stocks: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      web3: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      index_investing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      overseas_earning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      ai_zone: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    };
    return colors[category] || "bg-slate-100 text-slate-700";
  };

  const progressPercentage =
    (completedSteps.size / roadmap.steps.length) * 100;

  // Calculate which steps are completed for the active line
  const getActiveLineHeight = (stepIndex: number) => {
    const completedCount = roadmap.steps.slice(0, stepIndex + 1).filter(
      (_, idx) => completedSteps.has(roadmap.steps[idx].id)
    ).length;
    return (completedCount / roadmap.steps.length) * 100;
  };

  // 计算上一篇和下一篇路线图（循环结构）
  const currentIndex = roadmaps.findIndex((r) => r.id === roadmapId);
  const prevIndex = currentIndex > 0 ? currentIndex - 1 : roadmaps.length - 1; // 如果是第一个，则循环到最后一个
  const nextIndex = currentIndex < roadmaps.length - 1 ? currentIndex + 1 : 0; // 如果是最后一个，则循环到第一个
  
  const prevRoadmap = roadmaps[prevIndex];
  const nextRoadmap = roadmaps[nextIndex];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Back Button */}
        <Link
          href="/roadmap"
          className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回路线图列表
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-start gap-4 mb-6">
            <div className="text-5xl">{roadmap.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-slate-50">
                  {roadmap.title}
                </h1>
                <span
                  className={`text-xs font-medium px-3 py-1 rounded-full ${getCategoryColor(
                    roadmap.category
                  )}`}
                >
                  {getCategoryLabel(roadmap.category)}
                </span>
              </div>
              <p className="text-base text-slate-600 dark:text-slate-400 mb-4">
                {roadmap.description}
              </p>
              {roadmap.estimatedTotalTime && (
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500">
                  <Clock className="w-4 h-4" />
                  <span>预计总时长：{roadmap.estimatedTotalTime}</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                学习进度
              </span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {completedSteps.size} / {roadmap.steps.length} 已完成
                </span>
                {completedSteps.size > 0 && (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="清除学习记忆"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>清除进度</span>
                  </button>
                )}
              </div>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Reset Confirmation Dialog */}
          {showResetConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl p-6 max-w-md mx-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">
                  确认清除学习进度？
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  此操作将清除所有已完成的步骤记录，你将可以重新开始学习。此操作不可撤销。
                </p>
                <div className="flex items-center gap-3 justify-end">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleResetProgress}
                    className="px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
                  >
                    确认清除
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Metro Timeline */}
        <div className="relative">
          {/* Main Vertical Line */}
          <div className="absolute left-10 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800" />
          
          {/* Active Progress Line */}
          <div
            className="absolute left-10 top-0 w-px bg-yellow-500 transition-all duration-700 ease-out"
            style={{ height: `${progressPercentage}%` }}
          />

          {/* Steps */}
          <div className="space-y-12">
            {roadmap.steps.map((step, index) => {
              const status = getStepStatus(step, index);
              const isExpanded = expandedStep === step.id;
              const isCompleted = status === "completed";
              const isActive = status === "active";
              const isLocked = status === "locked";
              const stepNumber = String(index + 1).padStart(2, "0");

              return (
                <div key={step.id} className="relative">
                  {/* Connector - L-shaped curve */}
                  <div className="absolute left-10 top-6 w-8 h-px">
                    <div
                      className={cn(
                        "absolute left-0 top-0 h-px w-6 transition-all duration-300",
                        isCompleted && "bg-green-500",
                        isActive && "bg-yellow-500",
                        isLocked && "bg-slate-300 dark:bg-slate-700"
                      )}
                    />
                    <div
                      className={cn(
                        "absolute left-6 top-0 w-2 h-6 rounded-bl-xl transition-all duration-300",
                        isCompleted && "bg-green-500 border-l-0 border-b-0",
                        isActive && "bg-yellow-500 border-l-0 border-b-0",
                        isLocked && "bg-slate-300 dark:bg-slate-700 border-l-0 border-b-0"
                      )}
                    />
                  </div>

                  {/* Status Node on Timeline */}
                  <div className="absolute left-10 top-6 -translate-x-1/2 -translate-y-1/2 z-10">
                    {isCompleted ? (
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/50">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    ) : isActive ? (
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/50 ring-4 ring-yellow-100 dark:ring-yellow-900/30">
                          <span className="text-xs font-bold text-white">{index + 1}</span>
                        </div>
                        <div className="absolute inset-0 rounded-full bg-yellow-500 animate-ping opacity-20" />
                      </div>
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                    )}
                  </div>

                  {/* Card */}
                  <div className="ml-16">
                    <div
                      className={cn(
                        "relative bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-200",
                        isActive && "border-yellow-300 dark:border-yellow-800 shadow-md",
                        isCompleted && "border-green-200 dark:border-green-900",
                        isLocked && "opacity-60 cursor-not-allowed",
                        !isLocked && "hover:shadow-md cursor-pointer"
                      )}
                      onClick={() => !isLocked && handleToggleExpand(step.id)}
                    >
                      {/* Background Number */}
                      <div className="absolute right-6 top-6 text-6xl font-black text-slate-100 dark:text-slate-800 select-none pointer-events-none">
                        {stepNumber}
                      </div>

                      <div className="relative p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 pr-8">
                            <h3
                              className={cn(
                                "font-bold text-xl mb-2",
                                isActive && "text-yellow-600 dark:text-yellow-500",
                                isCompleted && "text-green-600 dark:text-green-500",
                                isLocked && "text-slate-400"
                              )}
                            >
                              {step.title}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                              {step.description}
                            </p>
                            {step.estimatedTime && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-500">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{step.estimatedTime}</span>
                              </div>
                            )}
                          </div>
                          {!isLocked && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleExpand(step.id);
                              }}
                              className="ml-4 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-slate-400" />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && !isLocked && (
                          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                            {step.articleLink && (
                              <Link
                                href={step.articleLink}
                                target={step.articleLink.startsWith("http") ? "_blank" : undefined}
                                className="inline-flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-400 font-medium transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-4 h-4" />
                                阅读相关文章
                              </Link>
                            )}
                            {!isCompleted && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkComplete(step.id);
                                }}
                                className="w-full px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors"
                              >
                                标记为已完成
                              </button>
                            )}
                            {isCompleted && (
                              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500 font-medium">
                                <Check className="w-4 h-4" />
                                <span>已完成</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation: Previous and Next Roadmaps - Always visible */}
          <div className="mt-16 ml-16">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
                继续学习
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                探索更多路线图，继续你的学习之旅
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Previous Roadmap */}
              <Link
                href={`/roadmap/${prevRoadmap.id}`}
                className="group bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-yellow-300 dark:hover:border-yellow-700 transition-all duration-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4 text-sm text-slate-500 dark:text-slate-400">
                    <ArrowLeft className="w-4 h-4" />
                    <span>上一篇</span>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{prevRoadmap.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-slate-900 dark:text-slate-50 group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors mb-2">
                        {prevRoadmap.title}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                        {prevRoadmap.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-xs font-medium px-2.5 py-1 rounded-full",
                            getCategoryColor(prevRoadmap.category)
                          )}
                        >
                          {getCategoryLabel(prevRoadmap.category)}
                        </span>
                        {prevRoadmap.estimatedTotalTime && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {prevRoadmap.estimatedTotalTime}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Next Roadmap */}
              <Link
                href={`/roadmap/${nextRoadmap.id}`}
                className="group bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-yellow-300 dark:hover:border-yellow-700 transition-all duration-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-end gap-2 mb-4 text-sm text-slate-500 dark:text-slate-400">
                    <span>下一篇</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{nextRoadmap.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-slate-900 dark:text-slate-50 group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors mb-2">
                        {nextRoadmap.title}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                        {nextRoadmap.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-xs font-medium px-2.5 py-1 rounded-full",
                            getCategoryColor(nextRoadmap.category)
                          )}
                        >
                          {getCategoryLabel(nextRoadmap.category)}
                        </span>
                        {nextRoadmap.estimatedTotalTime && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {nextRoadmap.estimatedTotalTime}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Completion Celebration Section */}
          {isFullyCompleted && (
            <div
              className={cn(
                "mt-16 transition-all duration-500 ease-out",
                showCelebration
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              )}
            >
              {/* Victory Card */}
              <div className="relative ml-16 mb-12">
                <div className="bg-gradient-to-br from-yellow-50 via-yellow-100/50 to-yellow-50 dark:from-yellow-900/20 dark:via-yellow-800/10 dark:to-yellow-900/20 rounded-xl border-2 border-yellow-400 dark:border-yellow-600 shadow-2xl overflow-hidden">
                  {/* Decorative Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-400 rounded-full blur-3xl" />
                  </div>

                  <div className="relative p-8 md:p-12">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
                      {/* Trophy Icon */}
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/50">
                          <Trophy className="w-12 h-12 text-white" />
                        </div>
                      </div>

                      {/* Text Content */}
                      <div className="flex-1">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">
                          恭喜！你已完成本路线
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 mb-1">
                          Mission Accomplished!
                        </p>
                        <p className="text-base text-slate-700 dark:text-slate-300">
                          你已经掌握了 <span className="font-semibold text-yellow-600 dark:text-yellow-500">{roadmap.title}</span> 的核心知识。准备好迎接下一个挑战了吗？
                        </p>
                      </div>

                      {/* Sparkles Decoration */}
                      <div className="hidden md:block">
                        <Sparkles className="w-12 h-12 text-yellow-500 animate-pulse" />
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link
                        href="/roadmap"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
                      >
                        <ArrowLeft className="w-5 h-5" />
                        返回路线图列表
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
