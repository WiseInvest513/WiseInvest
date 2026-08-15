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
  glow: string;
  comingSoon?: boolean;
};

const sites: WiseSite[] = [
  {
    name: "Wise Sim",
    url: "https://www.wise-sim.org/",
    desc: "手机卡购买平台",
    eyebrow: "全球通信",
    image: "/images/websites/wise-sim-tech.jpg",
    accent: "#f59e0b",
    accentText: "text-amber-300",
    accentBorder: "group-hover:border-amber-400/70",
    glow: "from-amber-500/35",
  },
  {
    name: "Wise Witness",
    url: "https://www.wise-witness.com/",
    desc: "见证开户平台",
    eyebrow: "远程认证",
    image: "/images/websites/wise-witness-tech.jpg",
    accent: "#a78bfa",
    accentText: "text-violet-300",
    accentBorder: "group-hover:border-violet-400/70",
    glow: "from-violet-500/35",
  },
  {
    name: "Wise Hold",
    url: "https://www.wise-hold.com/",
    desc: "长期持有策略",
    eyebrow: "长期复利",
    image: "/images/websites/wise-hold-tech.jpg",
    accent: "#34d399",
    accentText: "text-emerald-300",
    accentBorder: "group-hover:border-emerald-400/70",
    glow: "from-emerald-500/35",
  },
  {
    name: "Wise ETF",
    url: "https://www.wise-etf.com/",
    desc: "ETF 指数投资",
    eyebrow: "指数配置",
    image: "/images/websites/wise-etf-tech.jpg",
    accent: "#38bdf8",
    accentText: "text-sky-300",
    accentBorder: "group-hover:border-sky-400/70",
    glow: "from-sky-500/35",
  },
  {
    name: "Wise IPO",
    url: "https://www.wise-ipo.com/",
    desc: "港美 A 股 IPO 信息",
    eyebrow: "新股情报",
    image: "/images/websites/wise-ipo-tech.jpg",
    accent: "#fb7185",
    accentText: "text-rose-300",
    accentBorder: "group-hover:border-rose-400/70",
    glow: "from-rose-500/35",
  },
  {
    name: "Wise Chain",
    desc: "热门产业链数据",
    eyebrow: "产业链数据",
    image: "/images/websites/wise-chain-tech.jpg",
    accent: "#22d3ee",
    accentText: "text-cyan-300",
    accentBorder: "group-hover:border-cyan-400/70",
    glow: "from-cyan-500/35",
    comingSoon: true,
  },
];

function SiteCard({ site, priority, index }: { site: WiseSite; priority: boolean; index: number }) {
  const displayUrl = site.url ?? "网址筹备中";
  const card = (
    <div
      className="wise-site-card-float relative aspect-[4/3] w-full rounded-[1.7rem]"
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
        {/* 正面：保留科技产品主视觉 */}
        <div
          aria-hidden="true"
          className={`absolute inset-0 block h-full w-full overflow-hidden rounded-[1.7rem] border border-slate-800/90 bg-slate-950 text-left shadow-[0_18px_45px_rgba(15,23,42,0.18)] transition-shadow duration-500 group-hover:shadow-[0_26px_65px_rgba(15,23,42,0.28)] ${site.accentBorder}`}
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
        >
          <Image
            src={site.image}
            alt={`${site.name} 产品场景`}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 352px, (min-width: 640px) 50vw, 100vw"
            className={`object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045] ${site.comingSoon ? "saturate-[0.82]" : ""}`}
          />

          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-slate-950/95" />
          <div className={`absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t ${site.glow} via-transparent to-transparent opacity-35 transition-opacity duration-500 group-hover:opacity-55`} />
          <div className="absolute inset-0 rounded-[1.65rem] ring-1 ring-inset ring-white/10" />

          <div className="absolute left-4 top-4 z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[10px] font-black tracking-[0.14em] text-white/85 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: site.accent, color: site.accent }} />
              {site.eyebrow}
            </span>
          </div>

          <div className="absolute right-4 top-4 z-10 rounded-lg border border-white/10 bg-black/70 px-2 py-1.5 shadow-xl backdrop-blur-md">
            <Image
              src="/images/websites/wiseinvest-brand.png"
              alt="WiseInvest"
              width={109}
              height={27}
              className="h-[21px] w-auto object-contain"
            />
          </div>

          {site.comingSoon && (
            <div className="absolute right-4 top-[3.9rem] z-10 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-black tracking-widest text-cyan-200 backdrop-blur-md">
              即将上线
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 z-10 p-5 md:p-6">
            <div className={`mb-1.5 text-[11px] font-black uppercase tracking-[0.2em] ${site.accentText}`}>
              Wise Product
            </div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-black tracking-tight text-white md:text-2xl">{site.name}</h2>
                <p className="mt-1 text-xs font-medium text-slate-300 md:text-sm">{site.desc}</p>
              </div>
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md transition-all duration-300 group-hover:rotate-180 group-hover:bg-white group-hover:text-slate-950" aria-hidden="true">
                <RotateCcw className="h-4 w-4" />
              </span>
            </div>
          </div>

          <div className="pointer-events-none absolute -left-1/2 top-0 h-full w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-700 group-hover:left-[115%] group-hover:opacity-100" />
        </div>

        {/* 背面：网站名称、真实网址与访问入口 */}
        <div
          aria-hidden="true"
          className="absolute inset-0 overflow-hidden rounded-[1.7rem] border border-white/15 bg-[#070912] text-white shadow-[0_22px_60px_rgba(15,23,42,0.34)]"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <Image src={site.image} alt="" fill sizes="(min-width: 1024px) 352px, (min-width: 640px) 50vw, 100vw" className="scale-110 object-cover opacity-[0.12] blur-[2px]" />
          <div className="absolute inset-0 bg-[linear-gradient(125deg,rgba(2,6,23,0.98),rgba(9,12,25,0.92)_52%,rgba(15,23,42,0.82))]" />
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:28px_28px]" />
          <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: site.accent }} />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

          <div className="relative z-10 flex h-full flex-col p-5 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/55">
                <span className="h-1.5 w-1.5 rounded-full shadow-[0_0_12px_currentColor]" style={{ backgroundColor: site.accent, color: site.accent }} />
                Website destination
              </span>
              <Image src="/images/websites/wiseinvest-brand.png" alt="WiseInvest" width={109} height={27} className="h-[19px] w-auto object-contain opacity-90" />
            </div>

            <div className="my-auto py-3">
              <p className={`mb-2 text-[10px] font-black uppercase tracking-[0.2em] ${site.accentText}`}>Wise ecosystem</p>
              <h2 className="text-2xl font-black tracking-tight text-white md:text-[1.75rem]">{site.name}</h2>
              <p className="mt-1.5 text-xs font-medium text-slate-400 md:text-sm">{site.desc}</p>
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.055] px-3.5 py-3 backdrop-blur-sm">
                <span className="block text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Official URL</span>
                <span className="mt-1 block break-all font-mono text-[11px] font-bold text-white/85 md:text-xs">{displayUrl}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {site.url ? (
                <span className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-slate-950 transition-all group-hover:bg-slate-100">
                  点击前往
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              ) : (
                <div className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center text-xs font-black text-white/45">
                  即将上线
                </div>
              )}
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/70">
                <RotateCcw className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const wrapperClass = "group block rounded-[1.7rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-4 dark:focus-visible:ring-offset-slate-950";

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
    <main className="relative min-h-screen overflow-hidden bg-slate-50 pb-16 pt-28 dark:bg-slate-950 md:pb-20 md:pt-32">
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
        <div className="absolute left-[8%] top-24 h-72 w-72 rounded-full bg-amber-200/20 blur-3xl dark:bg-amber-500/5" />
        <div className="absolute right-[8%] top-1/3 h-96 w-96 rounded-full bg-cyan-200/20 blur-3xl dark:bg-cyan-500/5" />
        <div className="absolute inset-0 opacity-[0.28] dark:opacity-[0.08] [background-image:linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 md:px-6">
        <header className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
          <div className="mb-3 flex items-center justify-center gap-2">
            <Globe2 className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-black uppercase tracking-[0.2em] text-amber-500">My Websites</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">Wise 系列网站</h1>
          <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400 md:text-base">
            六个独立产品，同一套 WiseInvest 科技生态
          </p>
        </header>

        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 md:gap-7" aria-label="Wise 系列产品">
          {sites.map((site, index) => (
            <SiteCard key={site.name} site={site} priority={index < 3} index={index} />
          ))}
        </section>

        <p className="mt-10 text-center text-xs font-medium tracking-wide text-slate-400 dark:text-slate-600">
          所有网站均为 Wise Invest 旗下独立产品
        </p>
      </div>
    </main>
  );
}
