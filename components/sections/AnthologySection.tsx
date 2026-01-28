"use client";

import Link from "next/link";
import { Quote } from "lucide-react";

interface AnthologyItem {
  id: string;
  title: string;
  author: string;
  authorEn: string;
  summary: string;
  href: string;
  size: "small" | "medium" | "large"; // 卡片大小
}

const anthologyItems: AnthologyItem[] = [
  {
    id: "buffett-speech-1998",
    title: "1998年巴菲特在佛罗里达大学商学院的演讲",
    author: "巴菲特",
    authorEn: "Warren Buffett",
    summary: "巴菲特分享投资智慧，强调品行的重要性，讨论护城河、能力圈，以及如何找到能看懂的好生意。",
    href: "/anthology?author=巴菲特&category=2、演讲合集#buffett-speech-1998巴菲特在佛罗里达大学商学院的演讲",
    size: "large",
  },
  {
    id: "buffett-speech-2018",
    title: "2018年巴菲特再度邀请北大光华学子共进午餐问答全记录",
    author: "巴菲特",
    authorEn: "Warren Buffett",
    summary: "巴菲特与北大学子深度对话，分享投资理念、企业护城河的重要性，以及如何找到明显被错误定价的投资机会。",
    href: "/anthology?author=巴菲特&category=2、演讲合集#buffett-speech-2018-巴菲特再度邀请北大光华学子共进午餐问答全记录",
    size: "medium",
  },
  {
    id: "buffett-speech-2025",
    title: "2025年伯克希尔股东大会",
    author: "巴菲特",
    authorEn: "Warren Buffett",
    summary: "巴菲特在第60届股东大会上分享投资见解，讨论贸易政策、日本投资、以及伯克希尔的经营哲学。",
    href: "/anthology?author=巴菲特&category=2、演讲合集#buffett-speech-2025-伯克希尔股东大会",
    size: "small",
  },
  {
    id: "duan-business-2025-interview",
    title: "2025年段永平方略访谈",
    author: "段永平",
    authorEn: "Duan Yongping",
    summary: "段永平分享个人成长经历、创业心得、企业文化，强调\"本分\"哲学和做对的事情的重要性。",
    href: "/anthology?author=段永平&category=1、商业逻辑#duan-business-2025段永平方略访谈",
    size: "medium",
  },
  {
    id: "duan-business-2025-zju",
    title: "2025年段永平1月5日浙大师生见面会问答实录",
    author: "段永平",
    authorEn: "Duan Yongping",
    summary: "段永平在浙大师生见面会上分享投资理念，强调长期思维、不要快速判断，以及创业要基于真实想法而非为了创业而创业。",
    href: "/anthology?author=段永平&category=1、商业逻辑#duan-business-2025段永平浙大",
    size: "small",
  },
  {
    id: "buffett-speech-1990",
    title: "1990年巴菲特在斯坦福大学的演讲",
    author: "巴菲特",
    authorEn: "Warren Buffett",
    summary: "巴菲特分享投资与经营的共通之处，强调能力圈、只投资了解的公司，以及避免投资竞争激烈的行业。",
    href: "/anthology?author=巴菲特&category=2、演讲合集#buffett-speech-1990-巴菲特在斯坦福大学的演讲",
    size: "large",
  },
];

// 定义不同大小的样式 - 错落有致的布局
const sizeStyles = {
  small: "md:col-span-1",
  medium: "md:col-span-2",
  large: "md:col-span-3",
};

const heightStyles = {
  small: "min-h-[220px]",
  medium: "min-h-[280px]",
  large: "min-h-[320px]",
};

export function AnthologySection() {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden" style={{ isolation: 'isolate' }}>
      {/* High-Darkness Background - Visual Anchor */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" style={{ zIndex: -1 }} />
      
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        backgroundSize: '200px 200px',
        zIndex: -1,
      }} />
      
      <div className="container mx-auto px-4 relative" style={{ zIndex: 1 }}>
        <h2 className="font-serif text-4xl md:text-5xl font-bold text-center mb-12 text-slate-900 dark:text-white tracking-tight relative inline-block w-full">
          <span className="relative inline-block">
            经典文集
            <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-60" />
          </span>
        </h2>
        
        {/* 错落有致的网格布局 - 使用6列网格，不同大小的卡片占据不同列数 */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-5 max-w-7xl mx-auto">
          {anthologyItems.map((item, index) => (
            <Link
              key={item.id}
              href={item.href}
              className={`group relative ${sizeStyles[item.size]} ${heightStyles[item.size]} animate-spring-slow`}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Enhanced Radial Glow with Amber-to-Gold */}
              <div className="absolute -inset-3 bg-gradient-to-r from-amber-400/20 via-yellow-500/15 to-amber-400/20 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              {/* Premium Glassmorphism Card */}
              <div className={`relative bg-white/80 dark:bg-white/5 backdrop-blur-2xl border border-slate-200/50 dark:border-white/5 ${item.size === 'large' ? 'rounded-2xl p-6 md:p-8' : item.size === 'medium' ? 'rounded-xl p-5 md:p-6' : 'rounded-lg p-4 md:p-5'} transition-all duration-700 relative overflow-hidden h-full flex flex-col hover:bg-white/90 dark:hover:bg-white/8 hover:border-amber-400/30`}
                style={{
                  boxShadow: `
                    0 8px 32px rgba(0, 0, 0, 0.3),
                    0 4px 16px rgba(0, 0, 0, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1)
                  `,
                  transform: 'translateY(0)',
                  transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = `
                    0 16px 48px rgba(0, 0, 0, 0.4),
                    0 8px 24px rgba(251, 191, 36, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.15)
                  `;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `
                    0 8px 32px rgba(0, 0, 0, 0.3),
                    0 4px 16px rgba(0, 0, 0, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1)
                  `;
                }}
              >
                {/* Amber-to-Gold Gradient Border */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.5), rgba(234, 179, 8, 0.4), rgba(251, 191, 36, 0.5))',
                    padding: '2px',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    filter: 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.4))',
                  }} />
                
                {/* Large Quote Mark Background */}
                <div className={`absolute ${item.size === 'large' ? 'top-6 left-6' : item.size === 'medium' ? 'top-5 left-5' : 'top-4 left-4'} opacity-[0.08] dark:opacity-[0.12] pointer-events-none`}>
                  <Quote className={`${item.size === 'large' ? 'h-20 w-20 md:h-24 md:w-24' : item.size === 'medium' ? 'h-16 w-16 md:h-20 md:w-20' : 'h-12 w-12 md:h-16 md:w-16'} text-amber-500/20 dark:text-amber-400/30`} 
                    style={{ filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.2))' }} />
                </div>
                
                {/* Inner Glow Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-yellow-500/0 to-amber-500/0 group-hover:from-amber-500/10 group-hover:via-yellow-500/6 group-hover:to-amber-500/10 rounded-2xl transition-all duration-700 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col h-full">
                  {/* Author Info */}
                  <div className={`flex items-center gap-2 ${item.size === 'large' ? 'mb-4' : item.size === 'medium' ? 'mb-3' : 'mb-2'}`}>
                    <div className="relative">
                      {/* Multi-layer Glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-400/50 via-yellow-500/40 to-amber-400/50 rounded-full blur-xl group-hover:blur-2xl transition-all duration-700 opacity-0 group-hover:opacity-100" />
                      <div className={`relative ${item.size === 'large' ? 'p-2.5' : item.size === 'medium' ? 'p-2' : 'p-1.5'} bg-gradient-to-br from-amber-500/20 via-yellow-500/15 to-amber-500/20 group-hover:from-amber-500/30 group-hover:via-yellow-500/20 group-hover:to-amber-500/30 rounded-full border border-amber-400/30 group-hover:border-amber-400/50 transition-all duration-700`}
                        style={{
                          boxShadow: '0 4px 16px rgba(251, 191, 36, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                        }}
                      >
                        <Quote className={`${item.size === 'large' ? 'h-5 w-5' : item.size === 'medium' ? 'h-4 w-4' : 'h-3.5 w-3.5'} text-amber-400 relative z-10`} 
                          style={{ filter: 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.6))' }} />
                      </div>
                    </div>
                    <div>
                      <h3 className={`font-serif ${item.size === 'large' ? 'text-base md:text-lg' : item.size === 'medium' ? 'text-sm md:text-base' : 'text-xs md:text-sm'} font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-700 tracking-tight`}>
                        {item.author}
                      </h3>
                      <p className={`${item.size === 'large' ? 'text-xs' : 'text-xs'} text-slate-600 dark:text-slate-300 font-light tracking-wide`}>
                        {item.authorEn}
                      </p>
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h4 className={`font-serif ${item.size === 'large' ? 'text-base md:text-lg mb-3' : item.size === 'medium' ? 'text-sm md:text-base mb-2' : 'text-xs md:text-sm mb-2'} font-semibold text-slate-900 dark:text-white ${item.size === 'large' ? 'line-clamp-3' : item.size === 'medium' ? 'line-clamp-2' : 'line-clamp-2'} group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-700`}>
                    {item.title}
                  </h4>
                  
                  {/* Summary */}
                  <p className={`${item.size === 'large' ? 'text-sm md:text-base line-clamp-4' : item.size === 'medium' ? 'text-xs md:text-sm line-clamp-3' : 'text-xs line-clamp-2'} text-slate-600 dark:text-slate-300 leading-relaxed flex-1`}>
                    {item.summary}
                  </p>
                  
                  {/* Read More Indicator */}
                  <div className={`${item.size === 'large' ? 'mt-4 pt-4' : item.size === 'medium' ? 'mt-3 pt-3' : 'mt-2 pt-2'} border-t border-slate-200/50 dark:border-white/10`}>
                    <span className={`${item.size === 'large' ? 'text-sm' : 'text-xs'} text-amber-600 dark:text-amber-400 font-medium group-hover:underline transition-all`}>
                      阅读全文 →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
