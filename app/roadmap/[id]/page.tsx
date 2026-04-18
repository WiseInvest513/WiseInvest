"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Trophy,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { roadmaps, type RoadmapStep } from "@/lib/roadmaps-data";
import { cn } from "@/lib/utils";

type StepStatus = "locked" | "active" | "completed";
type StageStatus = "locked" | "active" | "completed";

// Compact step card for horizontal timeline
function StepCard({
  step,
  status,
  isExpanded,
  onToggle,
  onComplete,
}: {
  step: RoadmapStep;
  status: StepStatus;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onComplete: (id: string) => void;
}) {
  const isCompleted = status === "completed";
  const isActive = status === "active";
  const isLocked = status === "locked";

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-all duration-200",
        isCompleted &&
          "border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-900/40",
        isActive &&
          "border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-900 shadow-md cursor-pointer hover:shadow-lg hover:-translate-y-0.5",
        isLocked &&
          "border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900 opacity-50 cursor-not-allowed",
        !isLocked &&
          !isActive &&
          isCompleted &&
          "bg-white dark:bg-slate-900 cursor-pointer hover:shadow-md hover:-translate-y-0.5"
      )}
      onClick={() => !isLocked && onToggle(step.id)}
    >
      {/* Card header */}
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              "text-sm font-bold leading-tight mb-1 line-clamp-2",
              isCompleted && "text-amber-700 dark:text-amber-500",
              isActive && "text-slate-900 dark:text-slate-50",
              isLocked && "text-slate-400"
            )}
          >
            {step.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {step.description}
          </p>
        </div>
        <div className="flex-shrink-0 mt-0.5">
          {isCompleted ? (
            <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          ) : isLocked ? (
            <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700" />
          ) : isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {/* Time */}
      {step.estimatedTime && (
        <div className="flex items-center gap-1 mt-1.5">
          <Clock className="w-3 h-3 text-slate-400" />
          <span className="text-xs text-slate-400">{step.estimatedTime}</span>
        </div>
      )}

      {/* Expanded content */}
      {isExpanded && !isLocked && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {step.articleLink && (
            <Link
              href={step.articleLink}
              target={step.articleLink.startsWith("http") ? "_blank" : undefined}
              className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-500 hover:text-amber-800 font-medium transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              阅读相关文章
            </Link>
          )}
          {!isCompleted && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onComplete(step.id);
              }}
              className="w-full px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-md transition-colors"
            >
              标记为已完成
            </button>
          )}
          {isCompleted && (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-500 font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>已完成</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RoadmapDetailPage() {
  const params = useParams();
  const roadmapId = params.id as string;
  const roadmap = roadmaps.find((r) => r.id === roadmapId);

  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(`roadmap-progress-${roadmapId}`);
    if (saved) {
      try {
        setCompletedSteps(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error("Failed to load roadmap progress", e);
      }
    }
  }, [roadmapId]);

  useEffect(() => {
    if (typeof window === "undefined" || completedSteps.size === 0) return;
    localStorage.setItem(
      `roadmap-progress-${roadmapId}`,
      JSON.stringify(Array.from(completedSteps))
    );
  }, [completedSteps, roadmapId]);

  const isFullyCompleted = roadmap
    ? completedSteps.size === roadmap.steps.length
    : false;

  useEffect(() => {
    if (isFullyCompleted) {
      const timer = setTimeout(() => setShowCelebration(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isFullyCompleted]);

  if (!roadmap) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            路线图未找到
          </h1>
          <Link
            href="/roadmap?view=cards"
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

    if (step.prerequisites?.length) {
      const allPrereqsCompleted = step.prerequisites.every((id) =>
        completedSteps.has(id)
      );
      if (!allPrereqsCompleted) return "locked";
    }

    const previousStep = roadmap.steps[index - 1];
    if (!completedSteps.has(previousStep.id)) return "locked";
    if (completedSteps.has(step.id)) return "completed";

    const allPreviousCompleted = roadmap.steps
      .slice(0, index)
      .every((s) => completedSteps.has(s.id));
    return allPreviousCompleted ? "active" : "locked";
  };

  const handleMarkComplete = (stepId: string) => {
    setCompletedSteps((prev) => new Set([...prev, stepId]));
  };

  const handleToggleExpand = (stepId: string) => {
    setExpandedStep((prev) => (prev === stepId ? null : stepId));
  };

  const handleResetProgress = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(`roadmap-progress-${roadmapId}`);
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
      investment:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      us_stocks:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      web3: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      index_investing:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      overseas_earning:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      ai_zone:
        "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    };
    return colors[category] || "bg-slate-100 text-slate-700";
  };

  const progressPercentage =
    (completedSteps.size / roadmap.steps.length) * 100;

  // Group steps into horizontal stages
  // Steps with the same `stage` number appear in the same column.
  // Steps without a `stage` field each get their own column (auto-indexed).
  const stages = useMemo(() => {
    const stageMap = new Map<number, RoadmapStep[]>();
    roadmap.steps.forEach((step, index) => {
      const stageNum = step.stage !== undefined ? step.stage : index + 1000; // offset to avoid collision with explicit stages
      if (!stageMap.has(stageNum)) stageMap.set(stageNum, []);
      stageMap.get(stageNum)!.push(step);
    });
    return Array.from(stageMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([, steps]) => ({ steps }));
  }, [roadmap.steps]);

  const getStageStatus = (stageSteps: RoadmapStep[]): StageStatus => {
    const statuses = stageSteps.map((step) => {
      const idx = roadmap.steps.findIndex((s) => s.id === step.id);
      return getStepStatus(step, idx);
    });
    if (statuses.every((s) => s === "completed")) return "completed";
    if (statuses.some((s) => s === "active" || s === "completed"))
      return "active";
    return "locked";
  };

  // Navigation
  const currentIndex = roadmaps.findIndex((r) => r.id === roadmapId);
  const prevRoadmap =
    roadmaps[currentIndex > 0 ? currentIndex - 1 : roadmaps.length - 1];
  const nextRoadmap =
    roadmaps[currentIndex < roadmaps.length - 1 ? currentIndex + 1 : 0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative dot-grid dot-grid-subtle">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Back */}
        <Link
          href="/roadmap?view=cards"
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
                  className={`text-xs font-medium px-3 py-1 rounded-full ${getCategoryColor(roadmap.category)}`}
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
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>清除进度</span>
                  </button>
                )}
              </div>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full progress-shimmer transition-all duration-500 ease-out rounded-full"
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

        {/* ── Horizontal Timeline ── */}
        <div className="overflow-x-auto pb-8 -mx-6 px-6">
          <div className="flex items-start min-w-max">
            {stages.map((stage, stageIdx) => {
              const stageStatus = getStageStatus(stage.steps);
              const isStageCompleted = stageStatus === "completed";
              const isStageActive = stageStatus === "active";

              return (
                <div key={stageIdx} className="flex items-start flex-shrink-0">
                  {/* Stage column */}
                  <div
                    className="flex flex-col items-center"
                    style={{ width: 220 }}
                  >
                    {/* Timeline node — fixed 40px height for alignment */}
                    <div className="flex items-center justify-center w-full h-10 mb-4">
                      {isStageCompleted ? (
                        <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center shadow-sm animate-check-pop z-10">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      ) : isStageActive ? (
                        <div className="relative z-10">
                          <div className="w-10 h-10 rounded-full bg-gray-700 dark:bg-gray-500 flex items-center justify-center shadow-sm ring-4 ring-gray-100 dark:ring-gray-800">
                            <span className="text-sm font-bold text-white">
                              {stageIdx + 1}
                            </span>
                          </div>
                          <div className="absolute inset-0 rounded-full bg-gray-500 animate-breathe" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 z-10 flex items-center justify-center">
                          <span className="text-xs text-slate-400">
                            {stageIdx + 1}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Step cards */}
                    <div className="w-full space-y-2 px-2">
                      {stage.steps.map((step) => {
                        const stepIdx = roadmap.steps.findIndex(
                          (s) => s.id === step.id
                        );
                        const stepStatus = getStepStatus(step, stepIdx);
                        return (
                          <StepCard
                            key={step.id}
                            step={step}
                            status={stepStatus}
                            isExpanded={expandedStep === step.id}
                            onToggle={handleToggleExpand}
                            onComplete={handleMarkComplete}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Connector line to next stage */}
                  {stageIdx < stages.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 w-10 flex-shrink-0 mt-5 transition-colors duration-500",
                        isStageCompleted
                          ? "bg-amber-500"
                          : "bg-slate-200 dark:bg-slate-800"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Continue Learning Navigation */}
        <div className="mt-16">
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
              className="group bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4 text-sm text-slate-500 dark:text-slate-400">
                  <ArrowLeft className="w-4 h-4" />
                  <span>上一篇</span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{prevRoadmap.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-slate-900 dark:text-slate-50 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors mb-2">
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
              className="group bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-end gap-2 mb-4 text-sm text-slate-500 dark:text-slate-400">
                  <span>下一篇</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{nextRoadmap.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-slate-900 dark:text-slate-50 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors mb-2">
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

        {/* Completion Celebration */}
        {isFullyCompleted && (
          <div
            className={cn(
              "mt-16 transition-all duration-500 ease-out",
              showCelebration
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            )}
          >
            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/50 overflow-hidden">
              <div className="p-8 md:p-10">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-amber-600 flex items-center justify-center animate-check-pop">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
                      恭喜！你已完成本路线
                    </h2>
                    <p className="text-base text-slate-600 dark:text-slate-400">
                      已掌握{" "}
                      <span className="font-semibold text-amber-700 dark:text-amber-500">
                        {roadmap.title}
                      </span>{" "}
                      的核心知识，准备好迎接下一个挑战了吗？
                    </p>
                  </div>
                </div>
                <Link
                  href="/roadmap?view=cards"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  返回路线图列表
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
