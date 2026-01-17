"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Quote } from "lucide-react";

interface QuoteItem {
  author: string;
  authorCn: string;
  quote: string;
  quoteCn: string;
}

const quotes: QuoteItem[] = [
  {
    author: "Warren Buffett",
    authorCn: "巴菲特",
    quote: "Be fearful when others are greedy and greedy when others are fearful.",
    quoteCn: "别人贪婪时我恐惧，别人恐惧时我贪婪。",
  },
  {
    author: "Duan Yongping",
    authorCn: "段永平",
    quote: "Investment is about ignoring the noise and focusing on the fundamentals of the business.",
    quoteCn: "投资最重要的是理解企业的商业模式和护城河，忽略市场噪音。",
  },
];

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {quotes.map((quote, index) => (
            <div
              key={index}
              className="group relative w-full animate-spring-slow"
              style={{
                animationDelay: `${index * 150}ms`,
              }}
            >
              {/* Enhanced Radial Glow with Amber-to-Gold */}
              <div className="absolute -inset-3 bg-gradient-to-r from-amber-400/20 via-yellow-500/15 to-amber-400/20 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              {/* Premium Glassmorphism Card on Dark Background */}
              <div className="relative bg-white/80 dark:bg-white/5 backdrop-blur-2xl border border-slate-200/50 dark:border-white/5 rounded-2xl p-8 md:p-10 transition-all duration-700 relative overflow-hidden
                hover:bg-white/90 dark:hover:bg-white/8 hover:border-amber-400/30"
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
                
                {/* Large Quote Mark Background with Inner Glow */}
                <div className="absolute top-10 left-10 opacity-[0.08] dark:opacity-[0.12] pointer-events-none">
                  <Quote className="h-36 w-36 md:h-48 md:w-48 text-amber-500/20 dark:text-amber-400/30" 
                    style={{ filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.2))' }} />
                </div>
                
                {/* Inner Glow Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-yellow-500/0 to-amber-500/0 group-hover:from-amber-500/10 group-hover:via-yellow-500/6 group-hover:to-amber-500/10 rounded-2xl transition-all duration-700 pointer-events-none" />
                
                <div className="relative z-10">
                  {/* Author Info */}
                  <div className="flex items-center gap-5 mb-10">
                    <div className="relative">
                      {/* Multi-layer Glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-400/50 via-yellow-500/40 to-amber-400/50 rounded-full blur-xl group-hover:blur-2xl transition-all duration-700 opacity-0 group-hover:opacity-100" />
                      <div className="relative p-4 bg-gradient-to-br from-amber-500/20 via-yellow-500/15 to-amber-500/20 group-hover:from-amber-500/30 group-hover:via-yellow-500/20 group-hover:to-amber-500/30 rounded-full border border-amber-400/30 group-hover:border-amber-400/50 transition-all duration-700"
                        style={{
                          boxShadow: '0 4px 16px rgba(251, 191, 36, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                        }}
                      >
                        <Quote className="h-7 w-7 text-amber-400 relative z-10" 
                          style={{ filter: 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.6))' }} />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-700 tracking-tight">
                        {quote.authorCn}
                      </h3>
                      <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 font-light tracking-wide">
                        {quote.author}
                      </p>
                    </div>
                  </div>
                  
                  {/* Quote Content with Serif Typography */}
                  <blockquote className="font-serif text-3xl md:text-4xl text-slate-900 dark:text-white italic leading-relaxed mb-8 font-light tracking-wide">
                    &ldquo;{quote.quoteCn}&rdquo;
                  </blockquote>
                  <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 italic font-light leading-relaxed tracking-wide">
                    &ldquo;{quote.quote}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

