"use client";

import { useEffect, useState, useRef } from "react";
// import Link from "next/link"; // 未使用，已注释
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

// Hero Section uses its own ParallaxBackground component

// Section A: Hero Section - Asymmetric Editorial Layout with Motion
function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);
  
  return (
    <section 
      ref={sectionRef}
      id="hero"
      className="relative min-h-[75vh] flex items-center justify-center overflow-hidden"
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
      
      {/* Enhanced Parallax Background */}
      <ParallaxBackground sectionRef={sectionRef} parallaxSpeed={0.2} />
      
      {/* Asymmetric Content Layout */}
      <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Offset Title to Left with Animation */}
          <div 
            className="ml-0 md:ml-8 mb-8"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0)' : 'translateX(-50px)',
              transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s',
            }}
          >
            <h1 
              className="font-serif text-6xl md:text-8xl lg:text-9xl font-bold mb-8 tracking-tight leading-[0.9]"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'scale(1)' : 'scale(0.95)',
                transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s',
              }}
            >
              <span 
                className="block bg-gradient-to-r from-slate-900 via-amber-700 to-slate-900 dark:from-white dark:via-amber-300 dark:to-white bg-clip-text text-transparent"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s',
                }}
              >
                Wise
              </span>
              <span 
                className="block mt-2 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 dark:from-amber-400 dark:via-yellow-400 dark:to-amber-400 bg-clip-text text-transparent"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s',
                }}
              >
                Invest
              </span>
            </h1>
          </div>
          
          {/* Right-aligned Description with Animation */}
          <div 
            className="ml-auto max-w-xl text-right md:mr-12"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0)' : 'translateX(50px)',
              transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s',
            }}
          >
            <p 
              className="text-lg md:text-xl text-slate-700 dark:text-slate-300 mb-6 leading-relaxed font-light tracking-wide"
              style={{
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 0.6s ease-out 0.7s',
              }}
            >
              专业的投资内容平台，为您提供投资工具、深度分析和优质资源
            </p>
            <div 
              className="h-px bg-gradient-to-r from-transparent via-amber-400 to-amber-400 ml-auto"
              style={{
                width: isVisible ? 96 : 0,
                transition: 'width 0.6s ease-out 0.8s',
              }}
            />
          </div>
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
                    <div className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 via-yellow-500/15 to-amber-400/20 rounded-2xl blur-xl" />
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-yellow-600/8 to-amber-500/10 rounded-2xl blur-2xl" />
                    </div>
                    
                    {/* Advanced Glassmorphism Card */}
                    <div className={`h-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl rounded-2xl p-5 md:p-6 relative overflow-hidden
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
                      
                      <div className={`relative z-10 flex flex-col ${isPrimary ? 'justify-between h-full' : 'items-center text-center gap-3'}`}>
                        {/* Icon with Enhanced Glow */}
                        <div className={`relative ${isPrimary ? 'mb-5' : 'mb-0'}`}>
                          {/* Multi-layer Glow */}
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/50 via-yellow-500/40 to-amber-400/50 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-700 opacity-0 group-hover:opacity-100" />
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 via-yellow-600/25 to-amber-500/30 rounded-xl blur-2xl group-hover:blur-3xl transition-all duration-700 opacity-0 group-hover:opacity-100" />
                          
                          {/* Icon container with Motion */}
                          <IconContainer className={`relative ${isPrimary ? 'mb-5' : 'mb-0'} ${isPrimary ? 'w-fit' : 'mx-auto'}`}>
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
                        
                        <div className={`space-y-2 ${isPrimary ? 'text-left' : 'text-center'}`}>
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
