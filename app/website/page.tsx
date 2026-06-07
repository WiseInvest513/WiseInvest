"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Globe } from "lucide-react";

const sites = [
  {
    name: "Wise Sim",
    url: "https://www.wise-sim.org/",
    desc: "手机卡购买平台",
    gradient: "from-amber-400 to-orange-500",
    bg: "from-amber-50 to-orange-50",
    darkBg: "dark:from-amber-900/20 dark:to-orange-900/20",
    border: "border-amber-200 dark:border-amber-700/40",
    accent: "#f59e0b",
    delay: 0,
    floatDelay: "0s",
    flipDelay: "0s",
  },
  {
    name: "Wise Witness",
    url: "https://www.wise-witness.com/",
    desc: "见证开户平台",
    gradient: "from-violet-400 to-purple-500",
    bg: "from-violet-50 to-purple-50",
    darkBg: "dark:from-violet-900/20 dark:to-purple-900/20",
    border: "border-violet-200 dark:border-violet-700/40",
    accent: "#8b5cf6",
    delay: 1,
    floatDelay: "0.6s",
    flipDelay: "0.8s",
  },
  {
    name: "Wise Hold",
    url: "https://www.wise-hold.com/",
    desc: "长期持有策略",
    gradient: "from-emerald-400 to-teal-500",
    bg: "from-emerald-50 to-teal-50",
    darkBg: "dark:from-emerald-900/20 dark:to-teal-900/20",
    border: "border-emerald-200 dark:border-emerald-700/40",
    accent: "#10b981",
    delay: 2,
    floatDelay: "1.2s",
    flipDelay: "1.6s",
  },
  {
    name: "Wise ETF",
    url: "https://www.wise-etf.com/",
    desc: "ETF 指数投资",
    gradient: "from-sky-400 to-blue-500",
    bg: "from-sky-50 to-blue-50",
    darkBg: "dark:from-sky-900/20 dark:to-blue-900/20",
    border: "border-sky-200 dark:border-sky-700/40",
    accent: "#0ea5e9",
    delay: 3,
    floatDelay: "1.8s",
    flipDelay: "2.4s",
  },
  {
    name: "Wise IPO",
    url: "",
    desc: "港美 A 股 IPO 信息",
    gradient: "from-rose-400 to-pink-500",
    bg: "from-rose-50 to-pink-50",
    darkBg: "dark:from-rose-900/20 dark:to-pink-900/20",
    border: "border-rose-200 dark:border-rose-700/40",
    accent: "#f43f5e",
    delay: 4,
    floatDelay: "2.4s",
    flipDelay: "3.2s",
    comingSoon: true,
  },
  {
    name: "Wise Chain",
    url: "",
    desc: "热门产业链数据",
    gradient: "from-indigo-400 to-cyan-500",
    bg: "from-indigo-50 to-cyan-50",
    darkBg: "dark:from-indigo-900/20 dark:to-cyan-900/20",
    border: "border-indigo-200 dark:border-indigo-700/40",
    accent: "#6366f1",
    delay: 5,
    floatDelay: "3.0s",
    flipDelay: "4.0s",
    comingSoon: true,
  },
];

export default function WebsitePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-300/10 dark:bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-300/10 dark:bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-300/5 dark:bg-sky-500/3 rounded-full blur-3xl" />
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotateX(0deg); }
          25% { transform: translateY(-12px) rotateX(3deg); }
          50% { transform: translateY(-6px) rotateX(-2deg); }
          75% { transform: translateY(-14px) rotateX(2deg); }
        }

        @keyframes flip-y {
          0% { transform: rotateY(0deg); }
          45% { transform: rotateY(0deg); }
          50% { transform: rotateY(180deg); }
          95% { transform: rotateY(180deg); }
          100% { transform: rotateY(360deg); }
        }

        .site-card-wrapper {
          perspective: 1200px;
          animation: float 4s ease-in-out infinite;
        }

        .site-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          animation: flip-y 6s ease-in-out infinite;
        }

        .site-card-front,
        .site-card-back {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 1.5rem;
        }

        .site-card-back {
          transform: rotateY(180deg);
        }
      `}</style>

      {/* 标题 */}
      <div
        className={`text-center mb-12 md:mb-16 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <Globe className="w-5 h-5 text-amber-500" />
          <span className="text-amber-500 font-semibold text-sm tracking-widest uppercase">My Websites</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-3">
          Wise 系列网站
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
          点击卡片前往网站，灰色卡片为即将上线产品
        </p>
      </div>

      {/* 卡片网格 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 px-6 max-w-5xl w-full relative z-10">
        {sites.map((site, i) => {
          const isComingSoon = (site as any).comingSoon;
          const CardWrapper = isComingSoon ? "div" : "a";
          const wrapperProps = isComingSoon
            ? {}
            : { href: site.url, target: "_blank", rel: "noopener noreferrer" };

          return (
            <CardWrapper
              key={i}
              {...(wrapperProps as any)}
              className={`site-card-wrapper block w-full h-48 md:h-56 group ${isComingSoon ? "cursor-default" : "cursor-pointer"}`}
              style={{
                animationDelay: site.floatDelay,
                animationDuration: `${3.5 + i * 0.4}s`,
              }}
            >
              <div
                className="site-card-inner"
                style={{ animationDelay: site.flipDelay, animationDuration: `${5 + i * 0.5}s` }}
              >
                {/* 正面 */}
                <div
                  className={`site-card-front bg-gradient-to-br ${site.bg} ${site.darkBg} border ${site.border} shadow-xl flex flex-col items-center justify-center gap-3 p-4 ${isComingSoon ? "" : "hover:shadow-2xl"} transition-shadow duration-300`}
                >
                  {isComingSoon && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                      即将上线
                    </span>
                  )}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${site.gradient} flex items-center justify-center shadow-lg ${isComingSoon ? "opacity-60" : ""}`}>
                    <Globe className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-center">
                    <div className={`font-black text-sm md:text-base leading-tight ${isComingSoon ? "text-slate-400 dark:text-slate-500" : "text-slate-900 dark:text-white"}`}>{site.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{site.desc}</div>
                  </div>
                  {isComingSoon ? (
                    <div className="text-xs text-slate-400 dark:text-slate-500">敬请期待</div>
                  ) : (
                    <div className={`flex items-center gap-1 text-xs font-semibold bg-gradient-to-r ${site.gradient} bg-clip-text text-transparent`}>
                      <span>访问网站</span>
                      <ArrowUpRight className="w-3 h-3" style={{ color: site.accent }} />
                    </div>
                  )}
                </div>

                {/* 背面 */}
                <div
                  className={`site-card-back bg-gradient-to-br ${isComingSoon ? "from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-600" : site.gradient} shadow-xl flex flex-col items-center justify-center gap-3 p-4`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Globe className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="font-black text-white text-sm md:text-base leading-tight">{site.name}</div>
                    <div className="text-xs text-white/70 mt-1">
                      {isComingSoon ? "即将上线" : site.url.replace("https://", "").replace("/", "")}
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-white/80">
                    {isComingSoon ? "🚧 开发中" : "点击前往 →"}
                  </div>
                </div>
              </div>
            </CardWrapper>
          );
        })}
      </div>

      {/* 底部说明 */}
      <p
        className={`mt-14 text-xs text-slate-400 dark:text-slate-600 transition-all duration-1000 delay-500 ${mounted ? "opacity-100" : "opacity-0"}`}
      >
        所有网站均为 Wise Invest 旗下独立产品
      </p>
    </div>
  );
}
