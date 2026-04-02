"use client";

import { Check, ArrowRight, BookOpen, Clock, Trophy, Lock } from "lucide-react";

// 灰色主调 + 亮色点睛
type Theme = {
  name: string;
  label: string;
  desc: string;
  // 主调灰（大部分 UI 元素）
  gray: string;
  grayLight: string;
  grayBorder: string;
  grayText: string;
  // 点睛色（completed / active / CTA）
  accent: string;
  accentLight: string;
  accentBorder: string;
  accentDark: string;
};

const themes: Theme[] = [
  {
    name: "gray-emerald",
    label: "深灰 × 翡翠绿",
    desc: "沉稳底色配财富绿，完成感很强",
    gray:        "#374151",
    grayLight:   "#F3F4F6",
    grayBorder:  "#D1D5DB",
    grayText:    "#6B7280",
    accent:      "#10B981",
    accentLight: "#ECFDF5",
    accentBorder:"#6EE7B7",
    accentDark:  "#059669",
  },
  {
    name: "gray-sky",
    label: "深灰 × 天空蓝",
    desc: "冷静克制，完成状态用蓝色传递信任感",
    gray:        "#374151",
    grayLight:   "#F3F4F6",
    grayBorder:  "#D1D5DB",
    grayText:    "#6B7280",
    accent:      "#0EA5E9",
    accentLight: "#F0F9FF",
    accentBorder:"#7DD3FC",
    accentDark:  "#0284C7",
  },
  {
    name: "gray-violet",
    label: "深灰 × 紫罗兰",
    desc: "最有高端 SaaS 感，Web3 平台很适合",
    gray:        "#374151",
    grayLight:   "#F3F4F6",
    grayBorder:  "#D1D5DB",
    grayText:    "#6B7280",
    accent:      "#8B5CF6",
    accentLight: "#F5F3FF",
    accentBorder:"#C4B5FD",
    accentDark:  "#7C3AED",
  },
  {
    name: "gray-amber",
    label: "深灰 × 琥珀金",
    desc: "保留暖色点睛但降纯度，奢品感最强",
    gray:        "#374151",
    grayLight:   "#F3F4F6",
    grayBorder:  "#D1D5DB",
    grayText:    "#6B7280",
    accent:      "#D97706",
    accentLight: "#FFFBEB",
    accentBorder:"#FCD34D",
    accentDark:  "#B45309",
  },
];

function PreviewCard({ t }: { t: Theme }) {
  return (
    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-7 bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-5 h-5 rounded-full" style={{ background: t.gray }} />
          <span className="text-slate-300 dark:text-slate-600">×</span>
          <div className="w-5 h-5 rounded-full" style={{ background: t.accent }} />
          <h2 className="font-bold text-slate-900 dark:text-slate-50 ml-1">{t.label}</h2>
        </div>
        <p className="text-sm text-slate-500 ml-[52px]">{t.desc}</p>
      </div>

      {/* 路线卡片 */}
      <div className="mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: t.grayText }}>路线卡片</p>
        <div className="relative rounded-xl border bg-white dark:bg-slate-900 overflow-hidden p-5 cursor-pointer group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
          style={{ borderColor: t.grayBorder }}>
          {/* SVG 水印 */}
          <div className="absolute -bottom-8 -right-8 w-36 h-36 opacity-[0.06] pointer-events-none">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke={t.gray} strokeWidth="1.5"/>
              <circle cx="60" cy="60" r="36" fill="none" stroke={t.gray} strokeWidth="1"/>
              <circle cx="60" cy="60" r="18" fill={t.gray}/>
            </svg>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xl">💰</span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: t.grayLight, color: t.gray }}>
              投资理财
            </span>
          </div>
          <h3 className="font-bold text-[15px] text-slate-900 dark:text-slate-50 mb-2">投资基础入门路线</h3>
          <p className="text-sm mb-5" style={{ color: t.grayText }}>从零开始，系统学习投资理财的核心概念与实操方法</p>
          <div className="flex items-center justify-between text-xs" style={{ color: t.grayText }}>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5"/>6 个步骤</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/>3小时</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: t.gray }}/>
          </div>
        </div>
      </div>

      {/* 进度条 */}
      <div className="mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: t.grayText }}>进度条</p>
        <div className="rounded-lg p-4 border" style={{ background: t.grayLight, borderColor: t.grayBorder }}>
          <div className="flex items-center justify-between mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <span>学习进度</span>
            <span>4 / 6 已完成</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: t.grayBorder }}>
            {/* 大部分是灰色，已完成部分用亮色 */}
            <div className="h-full rounded-full transition-all" style={{ width: "66%", background: t.accent }}/>
          </div>
        </div>
      </div>

      {/* Timeline 步骤 */}
      <div className="mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: t.grayText }}>时间线步骤</p>
        <div className="space-y-3">
          {/* 已完成 → 亮色 */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: t.accent }}>
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5}/>
            </div>
            <div className="flex-1 p-3 rounded-lg border text-sm font-medium" style={{ borderColor: t.accentBorder, background: t.accentLight, color: t.accentDark }}>
              了解投资基础概念 · 已完成
            </div>
          </div>
          {/* 进行中 → 灰色主调 */}
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: t.gray }}>
                2
              </div>
              <div className="absolute inset-0 rounded-full animate-ping opacity-15" style={{ background: t.gray }}/>
            </div>
            <div className="flex-1 p-3 rounded-lg border shadow-sm text-sm font-medium" style={{ borderColor: t.grayBorder, color: t.gray }}>
              选择合适的投资标的 · 进行中
            </div>
          </div>
          {/* 未解锁 → 更浅灰 */}
          <div className="flex items-center gap-3 opacity-40">
            <div className="w-3 h-3 rounded-full ml-2.5 flex-shrink-0" style={{ background: t.grayBorder }}/>
            <div className="flex-1 p-3 rounded-lg border text-sm" style={{ borderColor: t.grayBorder, color: t.grayText }}>
              <span className="flex items-center gap-2"><Lock className="w-3 h-3"/>制定投资策略 · 待解锁</span>
            </div>
          </div>
        </div>
      </div>

      {/* 按钮 */}
      <div className="mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: t.grayText }}>按钮</p>
        <div className="flex flex-wrap gap-3 items-center">
          {/* 主要操作 → 亮色 */}
          <button className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all" style={{ background: t.accent }}>
            标记为已完成
          </button>
          {/* 次要操作 → 灰色 */}
          <button className="px-4 py-2 rounded-lg text-sm font-semibold border transition-all" style={{ borderColor: t.grayBorder, color: t.gray }}>
            阅读文章
          </button>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: t.accentLight, color: t.accentDark }}>
            已完成
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: t.grayLight, color: t.gray }}>
            Web3 探索
          </span>
        </div>
      </div>

      {/* 完成庆祝 */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: t.grayText }}>完成卡片</p>
        <div className="rounded-xl border p-5 flex items-center gap-4" style={{ background: t.accentLight, borderColor: t.accentBorder }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: t.accent }}>
            <Trophy className="w-6 h-6 text-white"/>
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-50">恭喜！你已完成本路线</p>
            <p className="text-sm mt-0.5" style={{ color: t.accentDark }}>已掌握 投资基础入门路线 的核心知识</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ColorPreviewPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">主色调预览</h1>
          <p className="text-slate-500 dark:text-slate-400">
            设计思路：<span className="font-medium text-slate-700 dark:text-slate-300">灰色主调</span>（导航、卡片、普通状态）+
            <span className="font-medium text-slate-700 dark:text-slate-300"> 亮色点睛</span>（完成、确认、进度条、CTA 按钮）
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {themes.map((t) => (
            <PreviewCard key={t.name} t={t} />
          ))}
        </div>

        <div className="mt-10 text-center text-sm text-slate-400">
          选定组合后告诉我，全局替换 · 此页面仅供预览
        </div>
      </div>
    </div>
  );
}
