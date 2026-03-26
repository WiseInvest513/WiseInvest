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
import { SectionWrapper, StaggerContainer, StaggerItem, TitleAnimation } from "@/components/motion/SectionWrapper";
import { InteractiveCard, IconContainer } from "@/components/motion/InteractiveCard";
import { ParallaxBackground } from "@/components/motion/ParallaxBackground";
import { getSafeExternalUrl } from "@/lib/security/external-links";

// Hero Section uses its own ParallaxBackground component

// Section A: Hero Section - Asymmetric Editorial Layout with Motion
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
      className="relative min-h-[68vh] md:min-h-[72vh] flex items-center justify-center overflow-hidden"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.8s ease-out',
      }}
    >
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 via-white to-slate-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />

      {/* Mesh gradient overlay - 极淡灰蓝，不抢戏 */}
      <div className="absolute inset-0 opacity-20 dark:opacity-10" style={{
        background: `
          radial-gradient(at 20% 30%, rgba(100, 116, 139, 0.15) 0px, transparent 50%),
          radial-gradient(at 80% 70%, rgba(71, 85, 105, 0.1) 0px, transparent 50%),
          radial-gradient(at 50% 50%, rgba(217, 119, 6, 0.06) 0px, transparent 50%)
        `
      }} />

      {/* 真实 SVG 海浪 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[9] overflow-hidden" style={{ height: '52%' }}>

        {/* Layer 1 — 深层背景涌浪：最慢、最透明、长波长 */}
        <div className="hero-wave-layer" style={{ animation: 'waveScroll 28s linear infinite', height: '100%' }}>
          <svg viewBox="0 0 2880 400" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
            <defs>
              <linearGradient id="wg1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(71,85,105,0)" />
                <stop offset="100%" stopColor="rgba(71,85,105,0.16)" />
              </linearGradient>
            </defs>
            {/* 周期 1440，两个周期无缝循环 */}
            <path d="
              M 0 220
              C 120 220 240 140 360 140
              C 480 140 600 220 720 220
              C 840 220 960 300 1080 300
              C 1200 300 1320 220 1440 220
              C 1560 220 1680 140 1800 140
              C 1920 140 2040 220 2160 220
              C 2280 220 2400 300 2520 300
              C 2640 300 2760 220 2880 220
              L 2880 400 L 0 400 Z
            " fill="url(#wg1)" />
          </svg>
        </div>

        {/* Layer 2 — 中层波：反向、中速 */}
        <div className="hero-wave-layer" style={{ animation: 'waveScroll 17s linear infinite reverse', height: '84%' }}>
          <svg viewBox="0 0 2880 340" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
            <defs>
              <linearGradient id="wg2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(100,116,139,0)" />
                <stop offset="100%" stopColor="rgba(100,116,139,0.22)" />
              </linearGradient>
            </defs>
            {/* 周期 720，四个周期无缝循环 */}
            <path d="
              M 0 190
              C 60 190 120 130 180 130
              C 240 130 300 190 360 190
              C 420 190 480 250 540 250
              C 600 250 660 190 720 190
              C 780 190 840 130 900 130
              C 960 130 1020 190 1080 190
              C 1140 190 1200 250 1260 250
              C 1320 250 1380 190 1440 190
              C 1500 190 1560 130 1620 130
              C 1680 130 1740 190 1800 190
              C 1860 190 1920 250 1980 250
              C 2040 250 2100 190 2160 190
              C 2220 190 2280 130 2340 130
              C 2400 130 2460 190 2520 190
              C 2580 190 2640 250 2700 250
              C 2760 250 2820 190 2880 190
              L 2880 340 L 0 340 Z
            " fill="url(#wg2)" />
          </svg>
        </div>

        {/* Layer 3 — 前景波：最快、Stokes 不对称、有泡沫 */}
        <div className="hero-wave-layer" style={{ animation: 'waveScroll 11s linear infinite', height: '68%' }}>
          <svg viewBox="0 0 2880 270" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
            <defs>
              <linearGradient id="wg3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(148,163,184,0)" />
                <stop offset="28%" stopColor="rgba(148,163,184,0.08)" />
                <stop offset="100%" stopColor="rgba(203,213,225,0.30)" />
              </linearGradient>
            </defs>
            {/*
              Stokes 不对称波：浪峰陡，浪谷缓
              周期 480，六个周期，在 x=0 和 x=1440 处 y=140 保证无缝
              上升控制点偏右（缓冲上升），下降控制点偏左（快速落下）
            */}
            <path d="
              M 0 140
              C 50 140 95 92 120 92
              C 145 92 190 140 240 140
              C 290 140 335 188 360 188
              C 385 188 430 140 480 140
              C 530 140 575 92 600 92
              C 625 92 670 140 720 140
              C 770 140 815 188 840 188
              C 865 188 910 140 960 140
              C 1010 140 1055 92 1080 92
              C 1105 92 1150 140 1200 140
              C 1250 140 1295 188 1320 188
              C 1345 188 1390 140 1440 140
              C 1490 140 1535 92 1560 92
              C 1585 92 1630 140 1680 140
              C 1730 140 1775 188 1800 188
              C 1825 188 1870 140 1920 140
              C 1970 140 2015 92 2040 92
              C 2065 92 2110 140 2160 140
              C 2210 140 2255 188 2280 188
              C 2305 188 2350 140 2400 140
              C 2450 140 2495 92 2520 92
              C 2545 92 2590 140 2640 140
              C 2690 140 2735 188 2760 188
              C 2785 188 2830 140 2880 140
              L 2880 270 L 0 270 Z
            " fill="url(#wg3)" />

            {/* 浪尖泡沫线 */}
            <path d="
              M 0 140
              C 50 140 95 92 120 92
              C 145 92 190 140 240 140
              C 290 140 335 188 360 188
              C 385 188 430 140 480 140
              C 530 140 575 92 600 92
              C 625 92 670 140 720 140
              C 770 140 815 188 840 188
              C 865 188 910 140 960 140
              C 1010 140 1055 92 1080 92
              C 1105 92 1150 140 1200 140
              C 1250 140 1295 188 1320 188
              C 1345 188 1390 140 1440 140
              C 1490 140 1535 92 1560 92
              C 1585 92 1630 140 1680 140
              C 1730 140 1775 188 1800 188
              C 1825 188 1870 140 1920 140
              C 1970 140 2015 92 2040 92
              C 2065 92 2110 140 2160 140
              C 2210 140 2255 188 2280 188
              C 2305 188 2350 140 2400 140
              C 2450 140 2495 92 2520 92
              C 2545 92 2590 140 2640 140
              C 2690 140 2735 188 2760 188
              C 2785 188 2830 140 2880 140
            " fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      
      {/* Enhanced Parallax Background */}
      <ParallaxBackground sectionRef={sectionRef} parallaxSpeed={0.2} />
      
      {/* Hero Layout */}
      <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 gap-8 md:grid-cols-12 md:items-center">
          <div
            className="md:col-span-7 md:-mt-6 lg:-mt-8"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateX(0)" : "translateX(-40px)",
              transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s",
            }}
          >
            <div className="mb-4 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-300">
              独立投资内容平台
            </div>
            <h1
              className="font-serif text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[0.9]"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "scale(1)" : "scale(0.95)",
                transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s",
              }}
            >
              <span className="block bg-gradient-to-r from-slate-900 via-amber-700 to-slate-900 dark:from-white dark:via-amber-300 dark:to-white bg-clip-text text-transparent">
                Wise
              </span>
              <span className="block mt-2 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 dark:from-amber-400 dark:via-yellow-400 dark:to-amber-400 bg-clip-text text-transparent">
                Invest
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              做最懂小白的博主，投资最好是十年前，其次是现在。
            </p>
          </div>

          <div
            className="md:col-span-5"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateX(0)" : "translateX(50px)",
              transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.45s",
            }}
          >
            <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/75 p-6 shadow-sm backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-900/55">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                  人生作弊指南：执行版
                </h2>
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-300">
                  每周更新
                </span>
              </div>
              <p className="relative z-10 text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                专业的投资内容平台，为您提供投资工具、深度分析和优质资源。
              </p>
              <div className="relative z-10 mt-5 space-y-2">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/80 px-2 py-2 dark:border-slate-700/50 dark:bg-slate-800/40">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">周更</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">实盘追踪</div>
                  </div>
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/80 px-2 py-2 dark:border-slate-700/50 dark:bg-slate-800/40">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">长期</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">复利体系</div>
                  </div>
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/80 px-2 py-2 dark:border-slate-700/50 dark:bg-slate-800/40">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">工具</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">实用工具</div>
                  </div>
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/80 px-2 py-2 dark:border-slate-700/50 dark:bg-slate-800/40">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">思想</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">优质文集</div>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200/80 bg-white/70 px-3 py-2.5 dark:border-slate-700/70 dark:bg-slate-800/45">
                  <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    本周聚焦
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 dark:bg-slate-700/70 dark:text-slate-300">
                      ETF 定投纪律
                    </span>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 dark:bg-slate-700/70 dark:text-slate-300">
                      现金流优先
                    </span>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 dark:bg-slate-700/70 dark:text-slate-300">
                      风险控制先行
                    </span>
                  </div>
                </div>
              </div>
              <div className="relative z-10 mt-5 flex flex-wrap gap-3">
                <Link
                  href="/practice/dca-investment"
                  className="inline-flex items-center justify-center rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-amber-600 hover:shadow-md"
                >
                  查看实盘数据
                </Link>
                <Link
                  href="/roadmap"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-300 hover:border-amber-400 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-amber-500 dark:hover:text-amber-300"
                >
                  开始学习路径
                </Link>
              </div>
              <div className="relative z-10 mt-5 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
    <style jsx>{`
      @keyframes waveScroll {
        from { transform: translateX(0); }
        to   { transform: translateX(-50%); }
      }

      .hero-wave-layer {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 200%;
        pointer-events: none;
      }
    `}</style>
    </>
  );
}

const weeklyActionItems = [
  {
    title: "本周该做什么",
    icon: CheckCircle2,
    summary: "按计划定投，不猜顶底，不追涨杀跌。",
    ctaLabel: "去看定投记录",
    ctaHref: "/practice/dca-investment",
    accent: "from-emerald-500/20 via-emerald-400/10 to-transparent",
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "本周风险提醒",
    icon: ShieldAlert,
    summary: "优先现金流安全与仓位纪律，避免高杠杆与情绪化交易。",
    ctaLabel: "查看工具箱",
    ctaHref: "/tools",
    accent: "from-rose-500/20 via-rose-400/10 to-transparent",
    iconClass: "text-rose-600 dark:text-rose-400",
  },
  {
    title: "本周机会观察",
    icon: Radar,
    summary: "关注美股 ETF 与优质加密资产的中长期配置窗口。",
    ctaLabel: "阅读最新推文",
    ctaHref: "/tweets",
    accent: "from-amber-500/20 via-yellow-400/10 to-transparent",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
];

function WeeklyActionSection() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section ref={sectionRef} className="container mx-auto px-4 py-5 md:py-8 relative isolate">
      <ParallaxBackground sectionRef={sectionRef} parallaxSpeed={0.14} />
      <div className="relative z-10 max-w-6xl mx-auto rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white/85 dark:bg-slate-900/70 backdrop-blur-md p-4 md:p-6 shadow-sm">
        <div className="mb-4 md:mb-6 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            本周行动面板
          </h2>
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-300">
            每周更新
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {weeklyActionItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.ctaHref}
                className="group relative overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-700/70 bg-white dark:bg-slate-900 p-4 md:p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_-20px_rgba(15,23,42,0.45)]"
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.accent} opacity-90`} />
                <div className="relative z-10">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                    <Icon className={`h-5 w-5 ${item.iconClass}`} />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3 min-h-[44px]">
                    {item.summary}
                  </p>
                  <div className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white group-hover:gap-2 transition-all">
                    {item.ctaLabel}
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Section B: Features Showcase - Enhanced Bento Grid with Light Refraction
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
  
  // Asymmetric Bento Grid Layout - 7 features
  // Layout: 
  // Row 1: 推文(3) | 工具(1)
  // Row 2: 学习路线(1) | 福利(2, spans 2 rows) | 文集(1)
  // Row 3: 常用导航(1) | 实践(1)
  const bentoLayout = [
    { ...features[0], span: "col-span-2 md:col-span-3", rowSpan: "row-span-1", isPrimary: false, hasBg: true, priority: "high", delay: 0 },
    { ...features[1], span: "col-span-2 md:col-span-1", rowSpan: "row-span-1", isPrimary: false, hasBg: false, priority: "normal", delay: 100 },
    { ...features[2], span: "col-span-2 md:col-span-1", rowSpan: "row-span-1", isPrimary: false, hasBg: false, priority: "normal", delay: 200 },
    { ...features[3], span: "col-span-2 md:col-span-2", rowSpan: "row-span-2", isPrimary: true, hasBg: true, priority: "high", delay: 300 },
    { ...features[4], span: "col-span-2 md:col-span-1", rowSpan: "row-span-1", isPrimary: false, hasBg: false, priority: "normal", delay: 400 },
    { ...features[5], span: "col-span-2 md:col-span-1", rowSpan: "row-span-1", isPrimary: false, hasBg: false, priority: "normal", delay: 500 },
    { ...features[6], span: "col-span-2 md:col-span-1", rowSpan: "row-span-1", isPrimary: false, hasBg: false, priority: "normal", delay: 600 },
  ];

  return (
    <SectionWrapper parallaxSpeed={0.3}>
      <section id="features" ref={sectionRef} className="container mx-auto px-4 py-16 md:py-20 relative">
        <ParallaxBackground sectionRef={sectionRef} parallaxSpeed={0.25} />
        
        <div className="text-center mb-12 relative z-10">
          <TitleAnimation className="font-serif text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">
            <span className="relative inline-block">
              平台功能
              <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-slate-400 to-transparent opacity-30" />
            </span>
          </TitleAnimation>
          <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 text-center max-w-2xl mx-auto font-light tracking-wide">
            探索 Wise Invest 提供的七大核心功能，助力您的投资之旅
          </p>
        </div>
        
        {/* Enhanced Bento Grid with Staggered Animation */}
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6 max-w-7xl mx-auto auto-rows-fr relative z-10" staggerDelay={0.1}>
          {bentoLayout.map((feature, index) => {
            const Icon = feature.icon;
            const isPrimary = feature.isPrimary;
            const hasBg = feature.hasBg;
            
            return (
              <StaggerItem key={feature.name} className={`${feature.span} ${feature.rowSpan}`} index={index}>
                <InteractiveCard href={feature.href} className="h-full">
                  <div className={`group relative h-full ${isPrimary ? 'min-h-[200px] md:min-h-[400px]' : 'min-h-[180px] md:min-h-[190px]'}`}>
                    {/* Multi-layered Shadow System */}
                    <div className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 via-yellow-500/15 to-amber-400/20 rounded-2xl blur-xl" />
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-yellow-600/8 to-amber-500/10 rounded-2xl blur-2xl" />
                    </div>
                    
                    {/* Advanced Glassmorphism Card */}
                    <div className={`h-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl rounded-2xl p-5 md:p-6 relative overflow-hidden
                      transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-2xl
                      ${isPrimary ? 'md:p-8' : ''}
                      ${hasBg ? 'bg-gradient-to-br from-slate-50/60 to-transparent dark:from-slate-800/20' : ''}`}
                      style={{
                        boxShadow: `
                          0 1px 3px rgba(0, 0, 0, 0.05),
                          0 4px 12px rgba(0, 0, 0, 0.08),
                          0 8px 24px rgba(0, 0, 0, 0.06),
                          inset 0 1px 0 rgba(255, 255, 255, 0.1)
                        `,
                      }}
                    >
                      {/* Sweep light band for dynamic motion */}
                      <div className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-0 blur-md transition-all duration-1000 ease-out group-hover:left-[120%] group-hover:opacity-100 dark:via-white/15" />

                      {/* Floating highlight orbs */}
                      <div className="pointer-events-none absolute -top-8 right-10 h-20 w-20 rounded-full bg-amber-300/20 blur-2xl transition-all duration-700 group-hover:-translate-y-1 group-hover:translate-x-2 group-hover:bg-amber-300/30" />
                      <div className="pointer-events-none absolute bottom-8 left-8 h-16 w-16 rounded-full bg-yellow-300/15 blur-2xl transition-all duration-700 group-hover:translate-x-2 group-hover:-translate-y-2 group-hover:bg-yellow-300/25" />

                      {/* Light Refraction Effect on Hover */}
                      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                        style={{
                          background: `
                            linear-gradient(135deg, 
                              rgba(251, 191, 36, 0.15) 0%, 
                              transparent 25%,
                              rgba(234, 179, 8, 0.1) 50%,
                              transparent 75%,
                              rgba(251, 191, 36, 0.15) 100%
                            )
                          `,
                          filter: 'blur(20px)',
                          transform: 'rotate(45deg) scale(1.5)',
                          transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }}
                      />
                      
                      {/* Gradient Border with Inner Glow */}
                      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                        style={{
                          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.4), rgba(234, 179, 8, 0.3), rgba(251, 191, 36, 0.4))',
                          padding: '1.5px',
                          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                          WebkitMaskComposite: 'xor',
                          maskComposite: 'exclude',
                          filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.3))',
                        }} />
                      
                      {/* Inner Glow Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-500/0 to-slate-500/0 group-hover:from-slate-100/40 group-hover:to-slate-50/20 dark:group-hover:from-slate-700/20 dark:group-hover:to-slate-800/10 rounded-2xl transition-all duration-500 pointer-events-none" />

                      {/* AboutMe 同款：背景水印图标（悬浮放大、旋转、灰度转彩色） */}
                      <div className="absolute -bottom-12 -right-12 w-44 h-44 opacity-[0.08] rotate-12 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:opacity-[0.14] z-0 pointer-events-none select-none grayscale group-hover:grayscale-0">
                        <Icon className="w-full h-full text-slate-200 dark:text-slate-800 group-hover:text-slate-300 dark:group-hover:text-slate-600 transition-colors duration-500" />
                      </div>
                      
                      <div className={`relative z-10 flex flex-col ${isPrimary ? 'justify-between h-full' : 'items-center text-center gap-3'}`}>
                        {/* Icon with Enhanced Glow */}
                        <div className={`relative transition-transform duration-500 group-hover:-translate-y-1 ${isPrimary ? 'mb-5' : 'mb-0'}`}>
                          {/* Subtle hover glow - 灰色，不抢主色 */}
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-400/20 via-slate-300/15 to-slate-400/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-700 opacity-0 group-hover:opacity-100" />

                          {/* Icon container with Motion */}
                          <IconContainer className={`relative transition-transform duration-500 group-hover:rotate-1 ${isPrimary ? 'mb-5' : 'mb-0'} ${isPrimary ? 'w-fit' : 'mx-auto'}`}>
                            <div className={`relative ${isPrimary ? 'p-4' : 'p-3'} rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60`}
                              style={{
                                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                              }}
                            >
                              <Icon className={`${isPrimary ? 'h-8 w-8' : 'h-6 w-6'} text-slate-600 dark:text-slate-300 relative z-10 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors duration-300`} />
                            </div>
                          </IconContainer>
                        </div>
                        
                        <div className={`space-y-2 transition-transform duration-500 group-hover:-translate-y-0.5 ${isPrimary ? 'text-left' : 'text-center'}`}>
                          <CardTitle className={`${isPrimary ? 'text-xl md:text-2xl' : 'text-base md:text-lg'} font-serif font-bold text-slate-900 dark:text-white group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors duration-300 tracking-tight`}>
                            {feature.name}
                          </CardTitle>
                          <CardDescription className={`${isPrimary ? 'text-sm md:text-base' : 'text-xs md:text-sm'} text-slate-600 dark:text-slate-400 leading-relaxed font-light`}>
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

// Section F: Recommended Resources
const resources = [
  { name: "Investing.com", url: "https://www.investing.com/", description: "行情与宏观数据" },
  { name: "TradingView", url: "https://www.tradingview.com/", description: "图表分析平台" },
  { name: "Seeking Alpha", url: "https://seekingalpha.com", description: "投资分析" },
  { name: "CoinMarketCap", url: "https://coinmarketcap.com", description: "加密货币数据" },
];

function ResourceCard({ resource, index }: { resource: typeof resources[0]; index: number }) {
  return (
    <InteractiveCard
      href={getSafeExternalUrl(resource.url)}
      className="group relative"
    >
      {/* Enhanced Radial Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-slate-300/20 via-slate-400/10 to-slate-300/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative h-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl border border-white/30 dark:border-slate-800/50 rounded-2xl p-4 md:p-5 overflow-hidden"
        style={{
          boxShadow: `
            0 1px 3px rgba(0, 0, 0, 0.05),
            0 4px 12px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
        }}
      >
        
        {/* Gradient Border */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.4), rgba(234, 179, 8, 0.3), rgba(251, 191, 36, 0.4))',
            padding: '1.5px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }} />
        
        <div className="flex items-start gap-4 relative z-10">
          {/* Icon Container - 使用通用图标组件 */}
          <ResourceIcon 
            url={resource.url}
            name={resource.name}
            size={48}
            className="shrink-0"
          />
          
          {/* Content */}
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
        
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 max-w-6xl mx-auto" staggerDelay={0.08}>
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

// Section G: Friendly Sites
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
      {/* 常用导航同款：悬浮渐变光晕 */}
      <div className="absolute -inset-1 bg-gradient-to-r from-slate-300/20 via-slate-400/10 to-slate-300/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative overflow-hidden p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 about-me-card h-full min-h-[140px] flex flex-col"
        style={{
          boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        {/* 常用导航同款：悬浮渐变描边 */}
        <div
          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(251,191,36,0.4), rgba(234,179,8,0.3), rgba(251,191,36,0.4))",
            padding: "1.5px",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />
        {/* 关于我同款：背后水印 emoji + 悬浮动效 */}
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
        <TitleAnimation className="font-serif text-2xl md:text-3xl font-bold text-center mb-4 md:mb-6 text-slate-900 dark:text-white tracking-tight relative inline-block w-full">
          <span className="relative inline-block">
            友站板块
            <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-slate-400 to-transparent opacity-30" />
          </span>
        </TitleAnimation>
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 max-w-6xl mx-auto items-stretch" staggerDelay={0.08}>
          {friendlySites.map((site, index) => (
            <StaggerItem key={index} index={index} className="min-h-[140px]">
              <FriendlySiteCard site={site} index={index} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

// Main Page Component
export default function Home() {
  // 周刊订阅功能暂时隐藏，目前还用不到
  // useEffect(() => {
  //   // Check if user has closed the toast or subscribed within 24 hours
  //   const checkNewsletterStatus = () => {
  //     if (typeof window === 'undefined') {
  //       return false;
  //     }

  //     try {
  //     const dismissed = localStorage.getItem("newsletter-dismissed");
  //     const subscribed = localStorage.getItem("newsletter-subscribed");
      
  //     if (subscribed === "true") {
  //         return false;
  //     }

  //     if (dismissed) {
  //       const dismissedTime = parseInt(dismissed, 10);
  //       const now = Date.now();
  //       const twentyFourHours = 24 * 60 * 60 * 1000;
      
  //       if (now - dismissedTime < twentyFourHours) {
  //           return false;
  //         }
  //       }

  //       return true;
  //     } catch (error) {
  //       console.error('Error accessing localStorage:', error);
  //       return false;
  //     }
  //   };

  //   const timer = setTimeout(() => {
  //     if (checkNewsletterStatus()) {
  //       toast.custom(
  //         (t) => (
  //           <NewsletterToast
  //             toastId={t}
  //             onClose={() => {
  //               toast.dismiss(t);
  //               try {
  //                 if (typeof window !== 'undefined') {
  //               localStorage.setItem("newsletter-dismissed", Date.now().toString());
  //                 }
  //               } catch (error) {
  //                 console.error('Error saving to localStorage:', error);
  //               }
  //             }}
  //           />
  //         ),
  //         {
  //           duration: Infinity,
  //         }
  //       );
  //     }
  //   }, 5000);

  //   return () => clearTimeout(timer);
  // }, []);

  return (
    <div className="flex flex-col relative">
      <HeroSection />
      <WeeklyActionSection />
      <div className="py-3 md:py-4" />
      <FeaturesSection />
      <div className="py-3 md:py-4" />
      <CEXSection />
      <div className="py-3 md:py-4" />
      <ToolsSection />
      <div className="py-3 md:py-4" />
      <TweetsSection />
      <div className="py-3 md:py-4" />
      <AnthologySection />
      <div className="py-3 md:py-4" />
      <ResourcesSection />
      <div className="py-1 md:py-2" />
      <FriendlySitesSection />
    </div>
  );
}
