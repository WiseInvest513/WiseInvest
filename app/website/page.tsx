import Image from "next/image";
import { ArrowUpRight, Globe2 } from "lucide-react";

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

function SiteCard({ site, priority }: { site: WiseSite; priority: boolean }) {
  const card = (
    <div className={`relative aspect-[4/3] min-h-[260px] w-full overflow-hidden rounded-[1.7rem] border border-slate-200/90 bg-white text-left shadow-[0_12px_30px_rgba(40,45,50,0.08)] transition-shadow duration-300 group-hover:shadow-[0_18px_40px_rgba(40,45,50,0.13)] ${site.accentBorder}`}>
      <Image
        src={site.image}
        alt={`${site.name} 产品场景`}
        fill
        priority={priority}
        sizes={siteImageSizes}
        className={`object-contain object-top ${site.comingSoon ? "saturate-[0.82]" : ""}`}
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
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/85 text-slate-600 backdrop-blur-md transition-colors duration-300 group-hover:border-slate-300 group-hover:text-slate-950" aria-hidden="true">
            <ArrowUpRight className="h-4 w-4" />
          </span>
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
            <SiteCard key={site.name} site={site} priority={index === 0} />
          ))}
        </section>

        <p className="mt-8 text-center text-xs font-medium tracking-normal text-slate-400 dark:text-slate-600">
          所有网站均为 Wise Invest 旗下独立产品
        </p>
      </div>
    </main>
  );
}
