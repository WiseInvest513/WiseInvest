"use client";

import Image from "next/image";
import { ArrowUpRight, Globe2, RotateCcw } from "lucide-react";

type WiseSite = {
  name: string;
  url?: string;
  desc: string;
  eyebrow: string;
  image: string;
  accent: string;
  accentText: string;
  accentBorder: string;
  comingSoon?: boolean;
};

const sites: WiseSite[] = [
  {
    name: "Wise VIP",
    url: "https://vip.wise-invest.org/join",
    desc: "VIP 社群、研究内容与专属工具",
    eyebrow: "会员中心",
    image: "/images/websites/wise-vip-silver.webp",
    accent: "#b78a35",
    accentText: "text-amber-700",
    accentBorder: "group-hover:border-amber-400/70",
  },
  {
    name: "Wise ETF",
    url: "https://www.wise-etf.com/",
    desc: "ETF 指数投资",
    eyebrow: "指数配置",
    image: "/images/websites/wise-etf-silver.webp",
    accent: "#0284c7",
    accentText: "text-sky-700",
    accentBorder: "group-hover:border-sky-400/70",
  },
  {
    name: "Wise IPO",
    url: "https://www.wise-ipo.com/",
    desc: "港美 A 股 IPO 信息",
    eyebrow: "新股情报",
    image: "/images/websites/wise-ipo-silver.webp",
    accent: "#be4b67",
    accentText: "text-rose-700",
    accentBorder: "group-hover:border-rose-400/70",
  },
  {
    name: "Wise Chain",
    url: "https://chain.wise-invest.org/",
    desc: "热门产业链数据",
    eyebrow: "产业链数据",
    image: "/images/websites/wise-chain-silver.webp",
    accent: "#0e7490",
    accentText: "text-cyan-700",
    accentBorder: "group-hover:border-cyan-400/70",
  },
  {
    name: "Wise Crypto",
    url: "https://crypto.wise-invest.org/",
    desc: "BTC / ETH 行情与交易工具",
    eyebrow: "加密市场",
    image: "/images/websites/wise-crypto-silver.webp",
    accent: "#a97919",
    accentText: "text-amber-700",
    accentBorder: "group-hover:border-amber-400/70",
  },
  {
    name: "Wise Sim",
    url: "https://www.wise-sim.org/",
    desc: "手机卡购买平台",
    eyebrow: "全球通信",
    image: "/images/websites/wise-sim-silver.webp",
    accent: "#0f766e",
    accentText: "text-teal-700",
    accentBorder: "group-hover:border-teal-400/70",
  },
  {
    name: "Wise Witness",
    url: "https://www.wise-witness.com/",
    desc: "见证开户平台",
    eyebrow: "远程认证",
    image: "/images/websites/wise-witness-silver.webp",
    accent: "#7c5eb0",
    accentText: "text-violet-700",
    accentBorder: "group-hover:border-violet-400/70",
  },
  {
    name: "Wise Hold",
    url: "https://www.wise-hold.com/",
    desc: "长期持有策略",
    eyebrow: "长期复利",
    image: "/images/websites/wise-hold-silver.webp",
    accent: "#047857",
    accentText: "text-emerald-700",
    accentBorder: "group-hover:border-emerald-400/70",
  },
];

const siteImageSizes = "(min-width: 1280px) 290px, (min-width: 768px) calc((100vw - 72px) / 2), (min-width: 640px) calc((100vw - 48px) / 2), calc(100vw - 32px)";

function SiteCard({ site, priority, index }: { site: WiseSite; priority: boolean; index: number }) {
  const displayUrl = site.url ?? "网址筹备中";
  const card = (
    <div
      className="wise-site-card-float relative aspect-[4/3] min-h-[260px] w-full rounded-[1.7rem]"
      style={{
        perspective: "1200px",
        animationDelay: `${index * 0.6}s`,
        animationDuration: `${3.5 + index * 0.4}s`,
      }}
    >
      <div
        className="wise-site-card-inner relative h-full w-full will-change-transform [transform-style:preserve-3d]"
        style={{
          animationDelay: `${index * 0.8}s`,
          animationDuration: `${5 + index * 0.5}s`,
        }}
      >
        {/* 正面：银白玻璃产品场景 */}
        <div
          aria-hidden="true"
          className={`absolute inset-0 block h-full w-full overflow-hidden rounded-[1.7rem] border border-slate-200/90 bg-white text-left shadow-[0_12px_30px_rgba(40,45,50,0.08)] transition-shadow duration-500 group-hover:shadow-[0_18px_40px_rgba(40,45,50,0.13)] ${site.accentBorder}`}
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
        >
          <Image
            src={site.image}
            alt={`${site.name} 产品场景`}
            fill
            priority={priority}
            sizes={siteImageSizes}
            className={`object-contain object-top transition-transform duration-700 ease-out group-hover:scale-[1.025] ${site.comingSoon ? "saturate-[0.82]" : ""}`}
          />

          <div className="absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-t from-white via-white/95 to-transparent" />
          <div className="absolute inset-0 rounded-[1.65rem] ring-1 ring-inset ring-white/70" />

          <div className="absolute left-3 top-3 z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/85 px-2.5 py-1 text-[10px] font-semibold tracking-normal text-slate-600 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: site.accent }} />
              {site.eyebrow}
            </span>
          </div>

          <div className="absolute right-3 top-3 z-10 rounded-lg border border-slate-200/70 bg-white/85 px-2 py-1.5 text-[10px] font-semibold text-slate-700 backdrop-blur-md">
            Wise Invest
          </div>

          {site.comingSoon && (
            <div className="absolute right-4 top-[3.9rem] z-10 rounded-full border border-cyan-200 bg-white/90 px-2.5 py-1 text-[10px] font-semibold tracking-normal text-cyan-700 backdrop-blur-md">
              即将上线
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 z-10 p-4">
            <div className={`mb-1 text-[10px] font-black uppercase tracking-normal ${site.accentText}`}>
              Wise Product
            </div>
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-black tracking-normal text-slate-900">{site.name}</h2>
                <p className="mt-1 text-xs font-medium text-slate-600">{site.desc}</p>
              </div>
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/85 text-slate-600 backdrop-blur-md transition-all duration-300 group-hover:rotate-180 group-hover:border-slate-300 group-hover:text-slate-950" aria-hidden="true">
                <RotateCcw className="h-4 w-4" />
              </span>
            </div>
          </div>

          <div className="pointer-events-none absolute -left-1/2 top-0 h-full w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-700 group-hover:left-[115%] group-hover:opacity-100" />
        </div>

        {/* 背面：网站名称、真实网址与访问入口 */}
        <div
          aria-hidden="true"
          className="absolute inset-0 overflow-hidden rounded-[1.7rem] border border-slate-200/90 bg-white text-slate-900 shadow-[0_12px_30px_rgba(40,45,50,0.08)]"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <Image src={site.image} alt="" fill priority={priority} sizes={siteImageSizes} className="object-contain object-top opacity-[0.16]" />
          <div className="absolute inset-0 bg-white/70" />
          <div className="absolute inset-x-0 top-0 h-px bg-white" />

          <div className="relative z-10 flex h-full flex-col p-4">
            <div className="flex shrink-0 items-start justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-normal text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: site.accent }} />
                Website destination
              </span>
              <span className="shrink-0 text-[10px] font-semibold text-slate-700">Wise Invest</span>
            </div>

            <div className="my-auto py-2">
              <p className={`mb-1 text-[9px] font-black uppercase tracking-normal ${site.accentText}`}>Wise ecosystem</p>
              <h2 className="text-xl font-black tracking-normal text-slate-900">{site.name}</h2>
              <p className="mt-1 text-xs font-medium text-slate-600">{site.desc}</p>
              <div className="mt-3 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 backdrop-blur-sm">
                <span className="block text-[9px] font-semibold uppercase tracking-normal text-slate-500">Official URL</span>
                <span className="mt-1 block break-all font-mono text-[11px] font-semibold text-slate-700">{displayUrl}</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {site.url ? (
                <span className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-900 px-3 text-xs font-semibold text-white transition-all group-hover:bg-slate-800">
                  点击前往
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              ) : (
                <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center text-xs font-semibold text-slate-500">
                  即将上线
                </div>
              )}
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white/85 text-slate-600">
                <RotateCcw className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const wrapperClass = "group block min-w-0 rounded-[1.7rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-4 dark:focus-visible:ring-offset-slate-950 xl:col-span-2";

  if (site.url) {
    return (
      <a href={site.url} target="_blank" rel="noopener noreferrer" className={wrapperClass} aria-label={`访问 ${site.name}：${site.url}`}>
        {card}
      </a>
    );
  }

  return (
    <div className={`${wrapperClass} cursor-default`} aria-label={`${site.name}，即将上线`}>
      {card}
    </div>
  );
}

export default function WebsitePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 pb-12 pt-14 dark:bg-slate-950 md:pb-16 md:pt-16">
      <style jsx global>{`
        @keyframes wise-site-float {
          0%, 100% { transform: translateY(0) rotateX(0deg); }
          25% { transform: translateY(-12px) rotateX(3deg); }
          50% { transform: translateY(-6px) rotateX(-2deg); }
          75% { transform: translateY(-14px) rotateX(2deg); }
        }

        @keyframes wise-site-flip-y {
          0% { transform: rotateY(0deg); }
          45% { transform: rotateY(0deg); }
          50% { transform: rotateY(180deg); }
          95% { transform: rotateY(180deg); }
          100% { transform: rotateY(360deg); }
        }

        .wise-site-card-float {
          animation-name: wise-site-float;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }

        .wise-site-card-inner {
          animation-name: wise-site-flip-y;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          transform-style: preserve-3d;
        }

        @media (prefers-reduced-motion: reduce) {
          .wise-site-card-float,
          .wise-site-card-inner {
            animation: none !important;
          }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-[0.28] dark:opacity-[0.08] [background-image:linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 md:px-6">
        <header className="mx-auto mb-8 max-w-2xl text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <Globe2 className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-black uppercase tracking-[0.2em] text-amber-500">My Websites</span>
          </div>
          <h1 className="text-3xl font-black tracking-normal text-slate-950 dark:text-white md:text-4xl">Wise 系列网站</h1>
          <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            {sites.length} 个独立产品，同一套 WiseInvest 科技生态
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-8 md:gap-6" aria-label="Wise 系列产品">
          {sites.map((site, index) => (
            <SiteCard key={site.name} site={site} priority={index === 0} index={index} />
          ))}
        </section>

        <p className="mt-8 text-center text-xs font-medium tracking-normal text-slate-400 dark:text-slate-600">
          所有网站均为 Wise Invest 旗下独立产品
        </p>
      </div>
    </main>
  );
}
