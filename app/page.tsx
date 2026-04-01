"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
// import { toast } from "sonner"; // 周刊订阅功能暂时隐藏
import { CardDescription, CardTitle } from "@/components/ui/card";
import { ToolsSection } from "@/components/sections/ToolsSection";
import { CEXSection } from "@/components/sections/CEXSection";
import { TweetsSection } from "@/components/sections/TweetsSection";
import { AnthologySection } from "@/components/sections/AnthologySection";
// import { NewsletterToast } from "@/components/newsletter-toast"; // 周刊订阅功能暂时隐藏
import { MessageSquare, Wrench, Map, BookOpen, Gift, Navigation, Sparkles, ArrowUpRight, CheckCircle2, ShieldAlert, Radar } from "lucide-react";
import { ResourceIcon } from "@/components/ui/resource-icon";
import { SectionWrapper, StaggerContainer, StaggerItem, TitleAnimation, FadeInSection } from "@/components/motion/SectionWrapper";
import { InteractiveCard, IconContainer } from "@/components/motion/InteractiveCard";
import { ParallaxBackground } from "@/components/motion/ParallaxBackground";
import { getSafeExternalUrl } from "@/lib/security/external-links";

// ─────────────────────────────────────────────────────────────────────────────
// Section A: Hero Section — Stripe-style dark centered layout
// ─────────────────────────────────────────────────────────────────────────────
function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <section
        ref={sectionRef}
        id="hero"
        className="relative flex flex-col overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 100%)",
          opacity: isVisible ? 1 : 0,
          transition: "opacity 0.8s ease-out",
        }}
      >
        {/* Mesh gradient overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `
              radial-gradient(at 20% 30%, rgba(217,119,6,0.12) 0px, transparent 50%),
              radial-gradient(at 80% 70%, rgba(245,158,11,0.08) 0px, transparent 50%),
              radial-gradient(at 50% 50%, rgba(251,191,36,0.05) 0px, transparent 50%)
            `,
          }}
        />

        {/* 噪点纹理 — 增加深色区域质感 */}
        <NoiseTexture opacity={0.04} />

        {/* SVG Waves — white low-opacity for dark bg */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[9] overflow-hidden" style={{ height: "52%" }}>
          {/* Layer 1 */}
          <div className="hero-wave-layer" style={{ animation: "waveScroll 28s linear infinite", height: "100%" }}>
            <svg viewBox="0 0 2880 400" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }}>
              <defs>
                <linearGradient id="wg1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.06)" />
                </linearGradient>
              </defs>
              <path d="
                M 0 220 C 120 220 240 140 360 140 C 480 140 600 220 720 220
                C 840 220 960 300 1080 300 C 1200 300 1320 220 1440 220
                C 1560 220 1680 140 1800 140 C 1920 140 2040 220 2160 220
                C 2280 220 2400 300 2520 300 C 2640 300 2760 220 2880 220
                L 2880 400 L 0 400 Z
              " fill="url(#wg1)" />
            </svg>
          </div>

          {/* Layer 2 */}
          <div className="hero-wave-layer" style={{ animation: "waveScroll 17s linear infinite reverse", height: "84%" }}>
            <svg viewBox="0 0 2880 340" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }}>
              <defs>
                <linearGradient id="wg2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
                </linearGradient>
              </defs>
              <path d="
                M 0 190 C 60 190 120 130 180 130 C 240 130 300 190 360 190
                C 420 190 480 250 540 250 C 600 250 660 190 720 190
                C 780 190 840 130 900 130 C 960 130 1020 190 1080 190
                C 1140 190 1200 250 1260 250 C 1320 250 1380 190 1440 190
                C 1500 190 1560 130 1620 130 C 1680 130 1740 190 1800 190
                C 1860 190 1920 250 1980 250 C 2040 250 2100 190 2160 190
                C 2220 190 2280 130 2340 130 C 2400 130 2460 190 2520 190
                C 2580 190 2640 250 2700 250 C 2760 250 2820 190 2880 190
                L 2880 340 L 0 340 Z
              " fill="url(#wg2)" />
            </svg>
          </div>

          {/* Layer 3 */}
          <div className="hero-wave-layer" style={{ animation: "waveScroll 11s linear infinite", height: "68%" }}>
            <svg viewBox="0 0 2880 270" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }}>
              <defs>
                <linearGradient id="wg3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                  <stop offset="28%" stopColor="rgba(255,255,255,0.04)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.10)" />
                </linearGradient>
              </defs>
              <path d="
                M 0 140 C 50 140 95 92 120 92 C 145 92 190 140 240 140
                C 290 140 335 188 360 188 C 385 188 430 140 480 140
                C 530 140 575 92 600 92 C 625 92 670 140 720 140
                C 770 140 815 188 840 188 C 865 188 910 140 960 140
                C 1010 140 1055 92 1080 92 C 1105 92 1150 140 1200 140
                C 1250 140 1295 188 1320 188 C 1345 188 1390 140 1440 140
                C 1490 140 1535 92 1560 92 C 1585 92 1630 140 1680 140
                C 1730 140 1775 188 1800 188 C 1825 188 1870 140 1920 140
                C 1970 140 2015 92 2040 92 C 2065 92 2110 140 2160 140
                C 2210 140 2255 188 2280 188 C 2305 188 2350 140 2400 140
                C 2450 140 2495 92 2520 92 C 2545 92 2590 140 2640 140
                C 2690 140 2735 188 2760 188 C 2785 188 2830 140 2880 140
                L 2880 270 L 0 270 Z
              " fill="url(#wg3)" />
              {/* 浪尖线 */}
              <path d="
                M 0 140 C 50 140 95 92 120 92 C 145 92 190 140 240 140
                C 290 140 335 188 360 188 C 385 188 430 140 480 140
                C 530 140 575 92 600 92 C 625 92 670 140 720 140
                C 770 140 815 188 840 188 C 865 188 910 140 960 140
                C 1010 140 1055 92 1080 92 C 1105 92 1150 140 1200 140
                C 1250 140 1295 188 1320 188 C 1345 188 1390 140 1440 140
                C 1490 140 1535 92 1560 92 C 1585 92 1630 140 1680 140
                C 1730 140 1775 188 1800 188 C 1825 188 1870 140 1920 140
                C 1970 140 2015 92 2040 92 C 2065 92 2110 140 2160 140
                C 2210 140 2255 188 2280 188 C 2305 188 2350 140 2400 140
                C 2450 140 2495 92 2520 92 C 2545 92 2590 140 2640 140
                C 2690 140 2735 188 2760 188 C 2785 188 2830 140 2880 140
              " fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Parallax */}
        <ParallaxBackground sectionRef={sectionRef} parallaxSpeed={0.2} />

        {/* ── Main content ── */}
        <div className="container mx-auto px-4 pt-20 pb-12 md:pt-28 md:pb-16 relative z-10 flex flex-col items-center text-center">
          {/* Badge */}
          <div
            className="mb-6 inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(-16px)",
              transition: "all 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s",
            }}
          >
            独立投资内容平台
          </div>

          {/* Headline */}
          <h1
            className="font-serif text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[0.9]"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "scale(1)" : "scale(0.95)",
              transition: "all 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.3s",
            }}
          >
            <span className="block text-white">Wise</span>
            <span className="block mt-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 bg-clip-text text-transparent">
              Invest
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="mt-6 max-w-xl text-base md:text-lg text-slate-400 leading-relaxed"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.45s",
            }}
          >
            做最懂小白的博主，投资最好是十年前，其次是现在。
          </p>

          {/* CTA Buttons */}
          <div
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.55s",
            }}
          >
            <Link
              href="/practice/dca-investment"
              className="inline-flex items-center justify-center rounded-full bg-amber-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all duration-300 hover:bg-amber-400 hover:shadow-amber-400/30"
            >
              查看实盘数据
            </Link>
            <Link
              href="/roadmap"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
            >
              开始学习路径
            </Link>
          </div>

          {/* Scroll arrow */}
          <div className="mt-10 animate-bounce text-white/30 text-2xl select-none" aria-hidden>↓</div>
        </div>

        {/* ── StatsStrip 嵌入 Hero 底部 ── */}
        <div className="relative z-10 border-t border-white/10 mt-4">
          <div className="container mx-auto px-4 py-6 md:py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center max-w-4xl mx-auto">
              {[
                { number: "7", label: "大核心功能" },
                { number: "52+", label: "周/年持续更新" },
                { number: "100+", label: "精选推文" },
                { number: "∞", label: "长期主义" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center gap-1">
                  <span className="font-serif text-4xl font-bold text-amber-400">{stat.number}</span>
                  <span className="text-sm text-slate-400">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* wave animation & .hero-wave-layer defined in globals.css */}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 深色区域噪点纹理（2-4% opacity 增加质感）
// ─────────────────────────────────────────────────────────────────────────────
function NoiseTexture({ opacity = 0.035 }: { opacity?: number }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none select-none"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "256px 256px",
        opacity,
        zIndex: 2,
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG 曲线过渡：Hero(#0f172a) → MarqueeStrip(slate-50)
// ─────────────────────────────────────────────────────────────────────────────
function CurveDivider() {
  return (
    <div style={{ background: "#f8fafc", lineHeight: 0, display: "block" }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 70"
        preserveAspectRatio="none"
        style={{ display: "block", width: "100%", height: "70px" }}
      >
        {/* 深色区域，底边向下弯曲，中心最深 */}
        <path d="M0,0 L0,28 C480,70 960,70 1440,28 L1440,0 Z" fill="#0f172a" />
        {/* 琥珀色描边，沿曲线走 */}
        <path
          d="M0,28 C480,70 960,70 1440,28"
          fill="none"
          stroke="rgba(245,158,11,0.3)"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MarqueeStrip — 投资平台品牌跑马灯
// ─────────────────────────────────────────────────────────────────────────────
const marqueeItems = [
  { emoji: "📊", name: "TradingView" },
  { emoji: "💹", name: "Investing.com" },
  { emoji: "🪙", name: "CoinMarketCap" },
  { emoji: "📈", name: "Seeking Alpha" },
  { emoji: "🏦", name: "Interactive Brokers" },
  { emoji: "⚡", name: "Binance" },
  { emoji: "🦊", name: "OKX" },
  { emoji: "💰", name: "Wise" },
  { emoji: "🔍", name: "Morningstar" },
  { emoji: "🌐", name: "Bloomberg" },
];

function MarqueeStrip() {
  const allItems = [...marqueeItems, ...marqueeItems];
  return (
    <section className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-5 overflow-hidden relative">
      {/* Left fade */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-slate-50/80 dark:from-slate-900/50 to-transparent" />
      {/* Right fade */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-slate-50/80 dark:from-slate-900/50 to-transparent" />

      <div className="marquee-track">
        {allItems.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-6 text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap select-none"
          >
            <span className="text-base">{item.emoji}</span>
            <span>{item.name}</span>
            <span className="ml-4 text-slate-300 dark:text-slate-700">·</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WeeklyActionSection — 手风琴式左右两栏
// ─────────────────────────────────────────────────────────────────────────────
const weeklyActionItems = [
  {
    title: "本周该做什么",
    icon: CheckCircle2,
    summary: "按计划定投，不猜顶底，不追涨杀跌。",
    ctaLabel: "去看定投记录",
    ctaHref: "/practice/dca-investment",
    iconClass: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  {
    title: "本周风险提醒",
    icon: ShieldAlert,
    summary: "优先现金流安全与仓位纪律，避免高杠杆与情绪化交易。",
    ctaLabel: "查看工具箱",
    ctaHref: "/tools",
    iconClass: "text-rose-600 dark:text-rose-400",
    iconBg: "bg-rose-100 dark:bg-rose-900/30",
  },
  {
    title: "本周机会观察",
    icon: Radar,
    summary: "关注美股 ETF 与优质加密资产的中长期配置窗口。",
    ctaLabel: "阅读最新推文",
    ctaHref: "/tweets",
    iconClass: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
  },
];

function WeeklyActionSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const active = weeklyActionItems[activeIndex];
  const ActiveIcon = active.icon;

  return (
    <section ref={sectionRef} className="container mx-auto px-4 py-5 md:py-8 relative isolate">
      <ParallaxBackground sectionRef={sectionRef} parallaxSpeed={0.14} />
      <div className="relative z-10 max-w-6xl mx-auto rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white/85 dark:bg-slate-900/70 backdrop-blur-md shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 md:px-6 pt-4 md:pt-6 pb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            本周行动面板
          </h2>
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-300">
            每周更新
          </span>
        </div>

        {/* Body: tab list + content panel */}
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
          {/* Left: Tab List */}
          <div className="flex flex-row md:flex-col border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
            {weeklyActionItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = idx === activeIndex;
              return (
                <button
                  key={item.title}
                  onClick={() => setActiveIndex(idx)}
                  className={`flex flex-1 md:flex-none items-center gap-3 px-4 md:px-5 py-3 md:py-4 text-left transition-all duration-200
                    border-l-2 md:border-l-2
                    ${isActive
                      ? "border-l-amber-500 bg-amber-50/60 dark:bg-amber-900/10"
                      : "border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                >
                  <div className={`shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200
                    ${isActive ? item.iconBg : "bg-slate-100 dark:bg-slate-800"}`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? item.iconClass : "text-slate-500 dark:text-slate-400"}`} />
                  </div>
                  <span className={`text-sm font-medium hidden md:block ${isActive ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>
                    {item.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Content Panel */}
          <div key={activeIndex} className="content-fade-in p-5 md:p-8 flex flex-col gap-4">
            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${active.iconBg}`}>
              <ActiveIcon className={`h-6 w-6 ${active.iconClass}`} />
            </div>
            <h3 className="font-serif text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              {active.title}
            </h3>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {active.summary}
            </p>
            <div className="pt-2">
              <Link
                href={active.ctaHref}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 dark:bg-white px-5 py-2.5 text-sm font-semibold text-white dark:text-slate-900 transition-all duration-200 hover:opacity-80"
              >
                {active.ctaLabel}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FeaturesSection — Bento Grid + 卡片升级
// ─────────────────────────────────────────────────────────────────────────────
const features = [
  {
    name: "推文",
    href: "/tweets",
    icon: MessageSquare,
    description: "分享投资见解、市场分析和实用技巧",
  },
  {
    name: "工具",
    href: "/tools",
    icon: Wrench,
    description: "专业的投资计算器和实用工具集合",
  },
  {
    name: "学习路线",
    href: "/roadmap",
    icon: Map,
    description: "系统化的投资学习路径和知识体系",
  },
  {
    name: "福利",
    href: "/perks",
    icon: Gift,
    description: "社区福利和会员专属权益",
  },
  {
    name: "文集",
    href: "/anthology",
    icon: BookOpen,
    description: "深度文章和投资知识库",
  },
  {
    name: "常用导航",
    href: "/resources",
    icon: Navigation,
    description: "精选的投资资源和导航链接",
  },
  {
    name: "实践",
    href: "/practice",
    icon: Sparkles,
    description: "社会性实践实验室",
  },
];

function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  const bentoLayout = [
    { ...features[0], span: "col-span-2 md:col-span-3", rowSpan: "row-span-1", isPrimary: false, hasBg: true, delay: 0 },
    { ...features[1], span: "col-span-2 md:col-span-1", rowSpan: "row-span-1", isPrimary: false, hasBg: false, delay: 100 },
    { ...features[2], span: "col-span-2 md:col-span-1", rowSpan: "row-span-1", isPrimary: false, hasBg: false, delay: 200 },
    { ...features[3], span: "col-span-2 md:col-span-2", rowSpan: "row-span-2", isPrimary: true, hasBg: true, delay: 300 },
    { ...features[4], span: "col-span-2 md:col-span-1", rowSpan: "row-span-1", isPrimary: false, hasBg: false, delay: 400 },
    { ...features[5], span: "col-span-2 md:col-span-1", rowSpan: "row-span-1", isPrimary: false, hasBg: false, delay: 500 },
    { ...features[6], span: "col-span-2 md:col-span-1", rowSpan: "row-span-1", isPrimary: false, hasBg: false, delay: 600 },
  ];

  return (
    <SectionWrapper parallaxSpeed={0.3}>
      <section id="features" ref={sectionRef} className="container mx-auto px-4 py-16 md:py-20 relative">
        <ParallaxBackground sectionRef={sectionRef} parallaxSpeed={0.25} />

        <div className="text-center mb-12 relative z-10">
          <TitleAnimation className="font-serif text-4xl md:text-5xl font-bold mb-4 text-white tracking-tight">
            <span className="relative inline-block">
              平台功能
              <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-70" />
            </span>
          </TitleAnimation>
          <p className="text-base md:text-lg text-slate-400 text-center max-w-2xl mx-auto font-light tracking-wide">
            探索 Wise Invest 提供的七大核心功能，助力您的投资之旅
          </p>
        </div>

        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6 max-w-7xl mx-auto auto-rows-fr relative z-10" staggerDelay={0.1}>
          {bentoLayout.map((feature, index) => {
            const Icon = feature.icon;
            const isPrimary = feature.isPrimary;
            const hasBg = feature.hasBg;

            return (
              <StaggerItem key={feature.name} className={`${feature.span} ${feature.rowSpan}`} index={index}>
                <InteractiveCard href={feature.href} className="h-full">
                  <div className={`group relative h-full ${isPrimary ? "min-h-[200px] md:min-h-[400px]" : "min-h-[180px] md:min-h-[190px]"}`}>
                    {/* Ambient glow */}
                    <div className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 via-yellow-500/15 to-amber-400/20 rounded-2xl blur-xl" />
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-yellow-600/8 to-amber-500/10 rounded-2xl blur-2xl" />
                    </div>

                    {/* Card body */}
                    <div
                      className={`h-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl rounded-2xl p-5 md:p-6 relative overflow-hidden
                        border border-slate-200/80 dark:border-slate-700/50
                        transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-2xl
                        ${isPrimary ? "md:p-8" : ""}
                        ${hasBg ? "bg-gradient-to-br from-slate-50/60 to-transparent dark:from-slate-800/20" : ""}`}
                      style={{
                        boxShadow: `0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.1)`,
                      }}
                    >
                      {/* Decorative top bar for hasBg && !isPrimary (推文 card) */}
                      {hasBg && !isPrimary && (
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400/60 via-yellow-400 to-amber-400/60 rounded-t-2xl" />
                      )}

                      {/* Sweep light */}
                      <div className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-0 blur-md transition-all duration-1000 ease-out group-hover:left-[120%] group-hover:opacity-100 dark:via-white/15" />

                      {/* Orbs */}
                      <div className="pointer-events-none absolute -top-8 right-10 h-20 w-20 rounded-full bg-amber-300/20 blur-2xl transition-all duration-700 group-hover:-translate-y-1 group-hover:translate-x-2 group-hover:bg-amber-300/30" />
                      <div className="pointer-events-none absolute bottom-8 left-8 h-16 w-16 rounded-full bg-yellow-300/15 blur-2xl transition-all duration-700 group-hover:translate-x-2 group-hover:-translate-y-2 group-hover:bg-yellow-300/25" />

                      {/* Light refraction */}
                      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                        style={{
                          background: `linear-gradient(135deg, rgba(251,191,36,0.15) 0%, transparent 25%, rgba(234,179,8,0.1) 50%, transparent 75%, rgba(251,191,36,0.15) 100%)`,
                          filter: "blur(20px)",
                          transform: "rotate(45deg) scale(1.5)",
                        }}
                      />

                      {/* Gradient border */}
                      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                        style={{
                          background: "linear-gradient(135deg, rgba(251,191,36,0.4), rgba(234,179,8,0.3), rgba(251,191,36,0.4))",
                          padding: "1.5px",
                          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                          WebkitMaskComposite: "xor",
                          maskComposite: "exclude",
                          filter: "drop-shadow(0 0 8px rgba(251,191,36,0.3))",
                        }}
                      />

                      {/* Inner glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-500/0 to-slate-500/0 group-hover:from-slate-100/40 group-hover:to-slate-50/20 dark:group-hover:from-slate-700/20 dark:group-hover:to-slate-800/10 rounded-2xl transition-all duration-500 pointer-events-none" />

                      {/* Watermark icon */}
                      <div className="absolute -bottom-12 -right-12 w-44 h-44 opacity-[0.08] rotate-12 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:opacity-[0.14] z-0 pointer-events-none select-none grayscale group-hover:grayscale-0">
                        <Icon className="w-full h-full text-slate-200 dark:text-slate-800 group-hover:text-slate-300 dark:group-hover:text-slate-600 transition-colors duration-500" />
                      </div>

                      <div className={`relative z-10 flex flex-col ${isPrimary ? "justify-between h-full" : "items-center text-center gap-3"}`}>
                        {/* Icon */}
                        <div className={`relative transition-transform duration-500 group-hover:-translate-y-1 ${isPrimary ? "mb-5" : "mb-0"}`}>
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-400/20 via-slate-300/15 to-slate-400/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-700 opacity-0 group-hover:opacity-100" />
                          <IconContainer className={`relative transition-transform duration-500 group-hover:rotate-1 ${isPrimary ? "mb-5 w-fit" : "mb-0 mx-auto"}`}>
                            <div
                              className={`relative ${isPrimary ? "p-4" : "p-3"} rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60`}
                              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)" }}
                            >
                              <Icon className={`${isPrimary ? "h-8 w-8" : "h-6 w-6"} text-slate-600 dark:text-slate-300 relative z-10 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors duration-300`} />
                            </div>
                          </IconContainer>
                        </div>

                        {/* isPrimary 卡（福利）：图标下方插入装饰内容块 */}
                        {isPrimary && (
                          <div className="my-4 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/60 p-4 flex flex-col gap-2">
                            {["🎁 注册即得ETF定投模板", "🔔 周报邮件提醒", "🛡️ 早鸟专属折扣"].map((item) => (
                              <div key={item} className="text-xs text-slate-600 dark:text-slate-400">{item}</div>
                            ))}
                          </div>
                        )}

                        <div className={`space-y-2 transition-transform duration-500 group-hover:-translate-y-0.5 ${isPrimary ? "text-left" : "text-center"}`}>
                          <CardTitle className={`${isPrimary ? "text-xl md:text-2xl" : "text-base md:text-lg"} font-serif font-bold text-slate-900 dark:text-white group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors duration-300 tracking-tight`}>
                            {feature.name}
                          </CardTitle>
                          <CardDescription className={`${isPrimary ? "text-sm md:text-base" : "text-xs md:text-sm"} text-slate-600 dark:text-slate-400 leading-relaxed font-light`}>
                            {feature.description}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </div>
                </InteractiveCard>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </section>
    </SectionWrapper>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ResourcesSection
// ─────────────────────────────────────────────────────────────────────────────
const resources = [
  { name: "Investing.com", url: "https://www.investing.com/", description: "行情与宏观数据" },
  { name: "TradingView", url: "https://www.tradingview.com/", description: "图表分析平台" },
  { name: "Seeking Alpha", url: "https://seekingalpha.com", description: "投资分析" },
  { name: "CoinMarketCap", url: "https://coinmarketcap.com", description: "加密货币数据" },
];

function ResourceCard({ resource, index }: { resource: typeof resources[0]; index: number }) {
  return (
    <InteractiveCard href={getSafeExternalUrl(resource.url)} className="group relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-slate-300/20 via-slate-400/10 to-slate-300/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div
        className="relative h-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl border border-white/30 dark:border-slate-800/50 rounded-2xl p-4 md:p-5 overflow-hidden"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.1)" }}
      >
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(251,191,36,0.4), rgba(234,179,8,0.3), rgba(251,191,36,0.4))",
            padding: "1.5px",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />
        <div className="flex items-start gap-4 relative z-10">
          <ResourceIcon url={resource.url} name={resource.name} size={48} className="shrink-0" />
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base md:text-lg font-serif font-bold text-slate-900 dark:text-white group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors duration-300 mb-1.5">
              {resource.name}
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400 text-xs md:text-sm font-light">
              {resource.description}
            </CardDescription>
          </div>
        </div>
      </div>
    </InteractiveCard>
  );
}

function ResourcesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  return (
    <section id="resources" ref={sectionRef} className="container mx-auto px-4 py-4 md:py-6 relative isolate">
      <ParallaxBackground sectionRef={sectionRef} parallaxSpeed={0.15} />
      <div className="relative z-10">
        <TitleAnimation className="font-serif text-2xl md:text-3xl font-bold text-center mb-4 md:mb-6 text-slate-900 dark:text-white tracking-tight relative inline-block w-full">
          <span className="relative inline-block">
            常用导航
            <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-slate-400 to-transparent opacity-30" />
          </span>
        </TitleAnimation>
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 max-w-6xl mx-auto" staggerDelay={0.08}>
          {resources.map((resource, index) => (
            <StaggerItem key={index} index={index}>
              <ResourceCard resource={resource} index={index} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FriendlySitesSection
// ─────────────────────────────────────────────────────────────────────────────
const friendlySites = [
  {
    name: "giffgaff 手机卡购买",
    url: "https://www.wise-sim.org/",
    description: "全球eSIM服务，支持多国家/地区流量方案，出境上网更省心。",
    watermarkEmoji: "📱" as const,
  },
  {
    name: "见证开户",
    url: "https://www.wise-witness.com/",
    description: "足不出户也可以开立全球境外银行账户，快速完成身份认证。",
    watermarkEmoji: "🌍" as const,
  },
  {
    name: "OpenClaw 入门学习教程",
    url: "https://www.wise-claw.org/",
    description: "专业的学习教程和资源库，助力投资者快速上手。",
    watermarkEmoji: "⚙️" as const,
  },
  {
    name: "ETF 投资指南",
    url: "https://www.wise-etf.com/",
    description: "专注ETF投资策略与数据分析，帮助投资者做出更明智的决策。",
    watermarkEmoji: "📈" as const,
  },
];

function FriendlySiteCard({ site, index }: { site: (typeof friendlySites)[0]; index: number }) {
  return (
    <a
      href={getSafeExternalUrl(site.url)}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block animate-spring-slow h-full"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-slate-300/20 via-slate-400/10 to-slate-300/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div
        className="relative overflow-hidden p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 about-me-card h-full min-h-[160px] flex flex-col"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.1)" }}
      >
        <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(251,191,36,0.4), rgba(234,179,8,0.3), rgba(251,191,36,0.4))",
            padding: "1.5px",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 opacity-[0.08] rotate-12 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:opacity-[0.12] z-0 pointer-events-none select-none flex items-center justify-center">
          <span className="text-7xl">{site.watermarkEmoji}</span>
        </div>
        <div className="relative z-10 flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2 mb-2">
            <CardTitle className="text-lg font-serif font-bold text-slate-900 dark:text-white group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
              {site.name}
            </CardTitle>
            <ArrowUpRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors shrink-0" />
          </div>
          <CardDescription className="text-slate-500 dark:text-slate-400 text-sm font-light">
            {site.description}
          </CardDescription>
        </div>
      </div>
    </a>
  );
}

function FriendlySitesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  return (
    <section ref={sectionRef} className="container mx-auto px-4 py-4 md:py-6 relative isolate">
      <ParallaxBackground sectionRef={sectionRef} parallaxSpeed={0.12} />
      <div className="relative z-10">
        <TitleAnimation className="font-serif text-2xl md:text-3xl font-bold text-center mb-2 text-white tracking-tight relative inline-block w-full">
          <span className="relative inline-block">
            友站板块
            <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-70" />
          </span>
        </TitleAnimation>
        <p className="text-center text-sm text-slate-400 mb-6">探索我们精选的合作伙伴资源</p>
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 max-w-6xl mx-auto items-stretch" staggerDelay={0.08}>
          {friendlySites.map((site, index) => (
            <StaggerItem key={index} index={index} className="min-h-[160px]">
              <FriendlySiteCard site={site} index={index} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="flex flex-col relative">

      {/* ① Hero — 深色 #0f172a */}
      <HeroSection />

      {/* ↓ SVG 曲线过渡，代替硬切边 */}
      <CurveDivider />

      {/* ② MarqueeStrip — 过渡浅灰 */}
      <MarqueeStrip />

      {/* ③ WeeklyAction — 天蓝淡底，与 Marquee 区分 */}
      <div className="bg-sky-50/50 dark:bg-slate-900">
        <FadeInSection>
          <WeeklyActionSection />
        </FadeInSection>
      </div>

      {/* ④ FeaturesSection — 再次深色，形成强对比 */}
      <div className="relative" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0f172a 100%)" }}>
        <NoiseTexture opacity={0.03} />
        <FeaturesSection />
      </div>

      {/* ⑤ CEXSection — 淡绿底，从深色中浮出 */}
      <div className="bg-emerald-50/40 dark:bg-slate-950">
        <FadeInSection>
          <CEXSection />
        </FadeInSection>
      </div>

      {/* ⑥ ToolsSection — 淡靛蓝底 */}
      <div className="bg-indigo-50/40 dark:bg-slate-900">
        <FadeInSection>
          <ToolsSection />
        </FadeInSection>
      </div>

      {/* ⑦ TweetsSection — 琥珀暖色调（保持） */}
      <div className="bg-amber-50/60 dark:bg-slate-900/80">
        <FadeInSection>
          <TweetsSection />
        </FadeInSection>
      </div>

      {/* ⑧ AnthologySection — 淡紫底，与 TweetsSection 区分 */}
      <div className="bg-violet-50/40 dark:bg-slate-950">
        <FadeInSection>
          <AnthologySection />
        </FadeInSection>
      </div>

      {/* ⑨ FriendlySites — 深色收尾，与 Hero 呼应 */}
      <div className="relative" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0f172a 100%)" }}>
        <NoiseTexture opacity={0.03} />
        <FriendlySitesSection />
      </div>

    </div>
  );
}
