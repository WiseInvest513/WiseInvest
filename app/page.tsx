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
import { MessageSquare, Wrench, Map, BookOpen, Gift, Navigation, Sparkles } from "lucide-react";
import { ResourceIcon } from "@/components/ui/resource-icon";
import { SectionWrapper, StaggerContainer, StaggerItem, TitleAnimation } from "@/components/motion/SectionWrapper";
import { InteractiveCard, IconContainer } from "@/components/motion/InteractiveCard";
import { ParallaxBackground } from "@/components/motion/ParallaxBackground";
import { tools, tweets } from "@/lib/data";
import { resourceCategories } from "@/lib/resources-data";

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
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
      
      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 opacity-30 dark:opacity-15" style={{
        background: `
          radial-gradient(at 20% 30%, rgba(251, 191, 36, 0.25) 0px, transparent 50%),
          radial-gradient(at 80% 70%, rgba(234, 179, 8, 0.2) 0px, transparent 50%),
          radial-gradient(at 50% 50%, rgba(251, 191, 36, 0.12) 0px, transparent 50%)
        `
      }} />

      {/* Hero 底部流水海岸特效 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[9] h-[46%] overflow-hidden">
        <div className="hero-coast-wave hero-coast-wave-back hero-wave-a" />
        <div className="hero-coast-wave hero-coast-wave-mid hero-wave-b" />
        <div className="hero-coast-wave hero-coast-wave-front hero-wave-c" />
        <div className="hero-coast-foam hero-wave-d" />
        <div className="hero-coast-glow" />
      </div>
      
      {/* Enhanced Parallax Background */}
      <ParallaxBackground sectionRef={sectionRef} parallaxSpeed={0.2} />
      
      {/* Hero Layout */}
      <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 gap-8 md:grid-cols-12 md:items-end">
          <div
            className="md:col-span-7"
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
              从工具到策略、从学习到实盘，帮你建立长期可复利的投资系统。
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
                  一站式投资成长平台
                </h2>
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-300">
                  每周更新
                </span>
              </div>
              <p className="relative z-10 text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                专业的投资内容平台，为您提供投资工具、深度分析和优质资源。
              </p>
              <div className="relative z-10 mt-5 space-y-2">
                {/* 第一行：数字类 */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-lg bg-amber-50/80 px-2 py-2 dark:bg-amber-900/20">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">7+</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">功能模块</div>
                  </div>
                  <div className="rounded-lg bg-amber-50/80 px-2 py-2 dark:bg-amber-900/20">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{tools.length}+</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">投资工具</div>
                  </div>
                  <div className="rounded-lg bg-amber-50/80 px-2 py-2 dark:bg-amber-900/20">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{tweets.length}+</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">深度推文</div>
                  </div>
                  <div className="rounded-lg bg-amber-50/80 px-2 py-2 dark:bg-amber-900/20">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{resourceCategories.reduce((sum, c) => sum + c.items.length, 0)}+</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">导航网站</div>
                  </div>
                </div>
                {/* 第二行：周更、长期、工具、文集 */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-lg bg-amber-50/80 px-2 py-2 dark:bg-amber-900/20">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">周更</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">实盘追踪</div>
                  </div>
                  <div className="rounded-lg bg-amber-50/80 px-2 py-2 dark:bg-amber-900/20">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">长期</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">复利体系</div>
                  </div>
                  <div className="rounded-lg bg-amber-50/80 px-2 py-2 dark:bg-amber-900/20">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">工具</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">实用工具</div>
                  </div>
                  <div className="rounded-lg bg-amber-50/80 px-2 py-2 dark:bg-amber-900/20">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">思想</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">优质文集</div>
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
      @keyframes coastMorphA {
        0% {
          transform: translateX(-7%) translateY(10px) scaleX(1.03);
          clip-path: polygon(0% 42%, 8% 36%, 19% 44%, 30% 37%, 42% 47%, 53% 39%, 64% 49%, 76% 41%, 88% 48%, 100% 44%, 100% 100%, 0% 100%);
        }
        19% {
          transform: translateX(2%) translateY(2px) scaleX(1);
          clip-path: polygon(0% 45%, 10% 39%, 22% 47%, 33% 41%, 46% 49%, 58% 42%, 70% 50%, 82% 43%, 92% 49%, 100% 46%, 100% 100%, 0% 100%);
        }
        37% {
          transform: translateX(6%) translateY(-2px) scaleX(0.99);
          clip-path: polygon(0% 47%, 9% 43%, 20% 50%, 31% 44%, 43% 53%, 55% 45%, 67% 54%, 79% 47%, 90% 55%, 100% 50%, 100% 100%, 0% 100%);
        }
        63% {
          transform: translateX(-1%) translateY(5px) scaleX(1.01);
          clip-path: polygon(0% 44%, 7% 38%, 18% 46%, 29% 39%, 41% 48%, 54% 40%, 66% 49%, 78% 41%, 90% 47%, 100% 43%, 100% 100%, 0% 100%);
        }
        100% {
          transform: translateX(5%) translateY(8px) scaleX(1.02);
          clip-path: polygon(0% 43%, 11% 37%, 23% 45%, 34% 38%, 45% 46%, 56% 39%, 69% 48%, 81% 40%, 92% 46%, 100% 42%, 100% 100%, 0% 100%);
        }
      }

      @keyframes coastMorphB {
        0% {
          transform: translateX(5%) translateY(12px) scaleX(1.02);
          clip-path: polygon(0% 52%, 9% 46%, 20% 56%, 31% 49%, 43% 59%, 55% 51%, 66% 60%, 77% 53%, 89% 61%, 100% 56%, 100% 100%, 0% 100%);
        }
        23% {
          transform: translateX(-2%) translateY(4px) scaleX(0.99);
          clip-path: polygon(0% 55%, 8% 50%, 19% 58%, 30% 52%, 42% 61%, 54% 54%, 65% 62%, 77% 55%, 88% 63%, 100% 58%, 100% 100%, 0% 100%);
        }
        49% {
          transform: translateX(-6%) translateY(-1px) scaleX(1.01);
          clip-path: polygon(0% 57%, 10% 52%, 21% 60%, 33% 54%, 44% 63%, 56% 56%, 67% 64%, 79% 57%, 91% 65%, 100% 60%, 100% 100%, 0% 100%);
        }
        71% {
          transform: translateX(1%) translateY(6px) scaleX(1.03);
          clip-path: polygon(0% 54%, 9% 48%, 20% 57%, 31% 50%, 43% 60%, 55% 52%, 67% 61%, 78% 54%, 90% 62%, 100% 57%, 100% 100%, 0% 100%);
        }
        100% {
          transform: translateX(6%) translateY(10px) scaleX(1.01);
          clip-path: polygon(0% 53%, 8% 47%, 18% 55%, 30% 49%, 42% 58%, 54% 51%, 66% 59%, 78% 52%, 89% 60%, 100% 55%, 100% 100%, 0% 100%);
        }
      }

      @keyframes coastMorphC {
        0% {
          transform: translateX(-4%) translateY(14px);
          clip-path: polygon(0% 62%, 10% 57%, 22% 65%, 34% 58%, 47% 67%, 60% 59%, 72% 68%, 84% 61%, 93% 68%, 100% 64%, 100% 100%, 0% 100%);
        }
        31% {
          transform: translateX(1%) translateY(8px);
          clip-path: polygon(0% 64%, 11% 59%, 23% 67%, 35% 60%, 48% 69%, 61% 61%, 73% 70%, 85% 63%, 94% 70%, 100% 66%, 100% 100%, 0% 100%);
        }
        58% {
          transform: translateX(4%) translateY(3px);
          clip-path: polygon(0% 66%, 9% 61%, 21% 69%, 33% 62%, 46% 71%, 58% 63%, 71% 72%, 83% 64%, 93% 72%, 100% 68%, 100% 100%, 0% 100%);
        }
        100% {
          transform: translateX(-2%) translateY(11px);
          clip-path: polygon(0% 63%, 10% 58%, 22% 66%, 34% 59%, 47% 68%, 60% 60%, 72% 69%, 84% 62%, 94% 69%, 100% 65%, 100% 100%, 0% 100%);
        }
      }

      @keyframes coastFoamShift {
        0% {
          transform: translateX(-12%) translateY(0px);
          opacity: 0.48;
        }
        30% {
          transform: translateX(-3%) translateY(-3px);
          opacity: 0.62;
        }
        62% {
          transform: translateX(6%) translateY(2px);
          opacity: 0.4;
        }
        100% {
          transform: translateX(12%) translateY(0px);
          opacity: 0.56;
        }
      }

      @keyframes coastGlowFlow {
        0% {
          background-position: -45% 0%;
        }
        100% {
          background-position: 145% 0%;
        }
      }

      .hero-coast-wave,
      .hero-coast-foam {
        position: absolute;
        left: -12%;
        width: 124%;
        border-radius: 9999px;
        pointer-events: none;
      }

      .hero-coast-wave-back {
        bottom: -22%;
        height: 96%;
        background: linear-gradient(
          to top,
          rgba(217, 119, 6, 0.28) 0%,
          rgba(245, 158, 11, 0.2) 34%,
          rgba(255, 255, 255, 0) 78%
        );
        filter: blur(1.4px);
        opacity: 0.92;
      }

      .hero-coast-wave-mid {
        bottom: -28%;
        height: 92%;
        background: linear-gradient(
          to top,
          rgba(251, 191, 36, 0.32) 0%,
          rgba(245, 158, 11, 0.22) 30%,
          rgba(255, 255, 255, 0) 74%
        );
        filter: blur(1px);
        opacity: 0.86;
      }

      .hero-coast-wave-front {
        bottom: -34%;
        height: 92%;
        background: linear-gradient(
          to top,
          rgba(253, 224, 71, 0.4) 0%,
          rgba(250, 204, 21, 0.24) 26%,
          rgba(255, 251, 235, 0.12) 46%,
          rgba(255, 255, 255, 0) 76%
        );
        filter: blur(0.6px);
        opacity: 0.9;
      }

      .hero-coast-foam {
        bottom: -36%;
        height: 90%;
        background: linear-gradient(
          to top,
          rgba(255, 251, 235, 0.46) 0%,
          rgba(254, 243, 199, 0.28) 14%,
          rgba(254, 243, 199, 0.12) 24%,
          rgba(255, 255, 255, 0) 58%
        );
        clip-path: polygon(0% 71%, 8% 66%, 18% 73%, 29% 67%, 40% 74%, 52% 68%, 63% 75%, 75% 69%, 86% 76%, 100% 72%, 100% 100%, 0% 100%);
        filter: blur(0.8px);
        opacity: 0.58;
      }

      .hero-coast-glow {
        position: absolute;
        inset: auto -15% 0;
        height: 62%;
        background: linear-gradient(
          108deg,
          rgba(251, 191, 36, 0) 0%,
          rgba(251, 191, 36, 0.14) 38%,
          rgba(255, 251, 235, 0.38) 50%,
          rgba(251, 191, 36, 0.14) 62%,
          rgba(251, 191, 36, 0) 100%
        );
        background-size: 210% 100%;
        filter: blur(10px);
        opacity: 0.64;
        animation: coastGlowFlow 18s linear infinite;
      }

      .hero-wave-a {
        animation: coastMorphA 23s ease-in-out infinite;
      }

      .hero-wave-b {
        animation: coastMorphB 17s ease-in-out infinite reverse;
      }

      .hero-wave-c {
        animation: coastMorphC 13s ease-in-out infinite;
      }

      .hero-wave-d {
        animation: coastFoamShift 11s ease-in-out infinite alternate;
      }

      :global(.dark) .hero-coast-wave-back {
        background: linear-gradient(
          to top,
          rgba(29, 78, 216, 0.28) 0%,
          rgba(37, 99, 235, 0.18) 34%,
          rgba(15, 23, 42, 0) 78%
        );
        opacity: 0.8;
      }

      :global(.dark) .hero-coast-wave-mid {
        background: linear-gradient(
          to top,
          rgba(14, 116, 144, 0.32) 0%,
          rgba(56, 189, 248, 0.2) 34%,
          rgba(15, 23, 42, 0) 76%
        );
        opacity: 0.76;
      }

      :global(.dark) .hero-coast-wave-front {
        background: linear-gradient(
          to top,
          rgba(125, 211, 252, 0.34) 0%,
          rgba(56, 189, 248, 0.22) 28%,
          rgba(191, 219, 254, 0.08) 44%,
          rgba(15, 23, 42, 0) 78%
        );
        opacity: 0.72;
      }

      :global(.dark) .hero-coast-foam {
        background: linear-gradient(
          to top,
          rgba(219, 234, 254, 0.28) 0%,
          rgba(186, 230, 253, 0.2) 16%,
          rgba(186, 230, 253, 0.05) 30%,
          rgba(15, 23, 42, 0) 62%
        );
        opacity: 0.44;
      }

      :global(.dark) .hero-coast-glow {
        background: linear-gradient(
          108deg,
          rgba(56, 189, 248, 0) 0%,
          rgba(56, 189, 248, 0.12) 38%,
          rgba(191, 219, 254, 0.32) 50%,
          rgba(56, 189, 248, 0.12) 62%,
          rgba(56, 189, 248, 0) 100%
        );
        opacity: 0.48;
      }
    `}</style>
    </>
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
              <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50" />
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
                      ${hasBg ? 'bg-gradient-to-br from-amber-50/60 via-yellow-50/40 to-transparent dark:from-amber-950/30 dark:via-yellow-950/20' : ''}`}
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
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-yellow-500/0 to-amber-500/0 group-hover:from-amber-500/8 group-hover:via-yellow-500/5 group-hover:to-amber-500/8 rounded-2xl transition-all duration-700 pointer-events-none" />

                      {/* AboutMe 同款：背景水印图标（悬浮放大、旋转、灰度转彩色） */}
                      <div className="absolute -bottom-12 -right-12 w-44 h-44 opacity-[0.08] rotate-12 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:opacity-[0.14] z-0 pointer-events-none select-none grayscale group-hover:grayscale-0">
                        <Icon className="w-full h-full text-slate-300 dark:text-slate-700 group-hover:text-amber-300 dark:group-hover:text-amber-500 transition-colors duration-500" />
                      </div>
                      
                      <div className={`relative z-10 flex flex-col ${isPrimary ? 'justify-between h-full' : 'items-center text-center gap-3'}`}>
                        {/* Icon with Enhanced Glow */}
                        <div className={`relative transition-transform duration-500 group-hover:-translate-y-1 ${isPrimary ? 'mb-5' : 'mb-0'}`}>
                          {/* Multi-layer Glow */}
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/50 via-yellow-500/40 to-amber-400/50 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-700 opacity-0 group-hover:opacity-100" />
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 via-yellow-600/25 to-amber-500/30 rounded-xl blur-2xl group-hover:blur-3xl transition-all duration-700 opacity-0 group-hover:opacity-100" />
                          
                          {/* Icon container with Motion */}
                          <IconContainer className={`relative transition-transform duration-500 group-hover:rotate-1 ${isPrimary ? 'mb-5' : 'mb-0'} ${isPrimary ? 'w-fit' : 'mx-auto'}`}>
                            <div className={`relative ${isPrimary ? 'p-4' : 'p-3'} rounded-xl bg-gradient-to-br from-amber-100/60 via-yellow-50/40 to-amber-100/60 dark:from-amber-900/40 dark:via-yellow-900/30 dark:to-amber-900/40 border border-amber-200/40 dark:border-amber-800/40`}
                              style={{
                                boxShadow: '0 4px 12px rgba(251, 191, 36, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                              }}
                            >
                              <Icon className={`${isPrimary ? 'h-8 w-8' : 'h-6 w-6'} text-amber-700 dark:text-amber-400 relative z-10`} 
                                style={{ 
                                  filter: 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.6))',
                                }} 
                              />
                            </div>
                          </IconContainer>
                        </div>
                        
                        <div className={`space-y-2 transition-transform duration-500 group-hover:-translate-y-0.5 ${isPrimary ? 'text-left' : 'text-center'}`}>
                          <CardTitle className={`${isPrimary ? 'text-xl md:text-2xl' : 'text-base md:text-lg'} font-serif font-bold text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors duration-700 tracking-tight`}>
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
  { name: "Investopedia", url: "https://www.investopedia.com", description: "投资教育平台" },
  { name: "Bloomberg", url: "https://www.bloomberg.com", description: "财经新闻" },
  { name: "Seeking Alpha", url: "https://seekingalpha.com", description: "投资分析" },
  { name: "CoinMarketCap", url: "https://coinmarketcap.com", description: "加密货币数据" },
];

function ResourceCard({ resource, index }: { resource: typeof resources[0]; index: number }) {
  return (
    <InteractiveCard
      href={resource.url}
      className="group relative"
    >
      {/* Enhanced Radial Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/15 via-yellow-500/10 to-amber-400/15 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
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
            <CardTitle className="text-base md:text-lg font-serif font-bold text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors duration-700 mb-1.5">
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
            <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50" />
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
  { name: "投资伙伴 A", url: "#", description: "专业的投资分析平台" },
  { name: "投资伙伴 B", url: "#", description: "量化交易工具" },
  { name: "投资伙伴 C", url: "#", description: "投资社区" },
];

function FriendlySitesSection() {
  return (
    <section className="container mx-auto px-4 py-4 md:py-6">
      <h2 className="font-serif text-2xl md:text-3xl font-bold text-center mb-4 md:mb-6 text-slate-900 dark:text-white tracking-tight relative inline-block w-full">
        <span className="relative inline-block">
          友站板块
          <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50" />
        </span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 max-w-5xl mx-auto">
        {friendlySites.map((site, index) => (
          <a
            key={index}
            href={site.url}
            className="group relative animate-spring"
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            {/* Enhanced Radial Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/15 via-yellow-500/10 to-amber-400/15 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="relative h-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl border border-white/30 dark:border-slate-800/50 rounded-2xl p-3 md:p-4 transition-all duration-700 overflow-hidden
              hover:bg-white/95 dark:hover:bg-slate-900/95"
              style={{
                boxShadow: `
                  0 1px 3px rgba(0, 0, 0, 0.05),
                  0 4px 12px rgba(0, 0, 0, 0.08),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1)
                `,
                transform: 'translateY(0)',
                transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = `
                  0 8px 24px rgba(0, 0, 0, 0.12),
                  0 4px 12px rgba(251, 191, 36, 0.15),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2)
                `;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `
                  0 1px 3px rgba(0, 0, 0, 0.05),
                  0 4px 12px rgba(0, 0, 0, 0.08),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1)
                `;
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
              
              <CardTitle className="text-base md:text-lg font-serif font-bold text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors duration-700 mb-1.5 relative z-10">
                  {site.name}
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 text-xs md:text-sm relative z-10 font-light">
                {site.description}
              </CardDescription>
            </div>
          </a>
        ))}
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
