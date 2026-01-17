"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ExternalLink, Eye } from "lucide-react";
import { tweets, type Tweet } from "@/lib/data";

export function TweetsSection() {
  // 只显示前9个推文（三排）
  const displayedTweets = tweets.slice(0, 9);

  const getBadgeStyle = (type: string) => {
    if (type === "Dry Goods" || type === "Tutorial") {
      return "bg-yellow-400 text-black";
    }
    return "bg-slate-100 text-slate-600";
  };

  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-center mb-10 text-slate-900 dark:text-white tracking-tight relative inline-block w-full">
        <span className="relative inline-block">
          精选推文 & 干货
          <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-30" />
        </span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 max-w-6xl mx-auto">
        {displayedTweets.map((tweet) => (
                <div
                  key={tweet.id}
                  className="group relative cursor-pointer"
                  onClick={() => {
                    if (tweet.link && tweet.link !== "#" && typeof window !== 'undefined') {
                      window.open(tweet.link, "_blank", "noopener,noreferrer");
                    }
                  }}
                >
                  {/* Radial Glow */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/10 via-orange-500/8 to-amber-400/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 rounded-2xl p-6 transition-all duration-500 overflow-hidden
                    hover:shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-1 hover:bg-white/90 dark:hover:bg-slate-900/90"
                    style={{
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}>
                    
                    {/* Living Border */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(249, 115, 22, 0.2), rgba(251, 191, 36, 0.3))',
                        padding: '1px',
                        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor',
                        maskComposite: 'exclude'
                      }} />
                    
                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-orange-500/0 to-amber-500/0 group-hover:from-amber-500/5 group-hover:via-orange-500/3 group-hover:to-amber-500/5 rounded-2xl transition-all duration-500 pointer-events-none" />
                    <Card
                      className="border-0 shadow-none p-0 bg-transparent relative z-10"
                    >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs text-muted-foreground">
                        {tweet.date}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getBadgeStyle(
                          tweet.type
                        )}`}
                      >
                        {tweet.type === "Dry Goods"
                          ? "干货"
                          : tweet.type === "Tutorial"
                          ? "教程"
                          : tweet.type === "Daily"
                          ? "日常"
                          : "新闻"}
                      </span>
                    </div>
                    <h3 className="font-heading text-lg font-bold line-clamp-2 leading-tight">
                      {tweet.title}
                    </h3>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      点击查看完整内容...
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0 pb-4 justify-between items-center">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Eye className="h-3.5 w-3.5" />
                      <span className="font-mono">
                        {tweet.views >= 1000
                          ? `${(tweet.views / 1000).toFixed(1)}k`
                          : tweet.views}
                      </span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </CardFooter>
                    </Card>
                  </div>
                </div>
      ))}
      </div>
    </section>
  );
}
