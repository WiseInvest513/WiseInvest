"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Copy, ExternalLink, BookOpen, Check, Users, Star, Zap, TrendingUp, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { perks, type Perk } from "@/lib/perks-data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { IconService } from "@/lib/icon-service";
import { openSafeExternalUrl } from "@/lib/security/external-links";
import { ResourceIcon } from "@/components/ui/resource-icon";

interface PerkCategory {
  id: string;
  label: string;
  emoji: string;
  items: Perk[];
}

interface OtherResourceItem {
  id: string;
  title: string;
  highlight?: string;
  description: string;
  code?: string | null;
  link?: string;
  iconUrl?: string;
  tutorialLink?: string;
  claimedCount?: number;
}

const ipoResource: OtherResourceItem = {
  id: "a-stock-ipo",
  title: "A 股打新",
  highlight: "集合打新获取超额财富",
  description: "利用现有A股持仓参与集合申购，提升中签率，在股票涨跌之外获取稳定的阿尔法超额收益，年化预期 3%～10%。",
  link: "/ipo",
  claimedCount: 180,
};

const otherResources: OtherResourceItem[] = [
  {
    id: "gamsgo",
    title: "GamsGo 会员合租",
    highlight: "低成本共享主流订阅",
    description: "连续7年提供高质量、价格可负担的数字订阅服务，适合控制流媒体与软件订阅开支。",
    link: "https://www.gamsgo.com/partner/GwZjT",
    iconUrl: "https://www.gamsgo.com/",
    tutorialLink: "https://x.com/WiseInvest513/status/2017103331576139919",
    claimedCount: 890,
  },
  {
    id: "xesim",
    title: "Xesim eSIM 服务",
    highlight: "一站式全球 eSIM 连接",
    description: "支持多国家/地区流量方案，适合跨境出行、商务差旅与海外应用注册场景。",
    code: "WISE666",
    link: "https://xesim.cc/?DIST=RkJHFVg%3D",
    iconUrl: "https://xesim.cc/",
    tutorialLink: "https://x.com/WiseInvest513/status/2022688883348246699",
    claimedCount: 450,
  },
  {
    id: "account-planet",
    title: "账号星球",
    highlight: "海外账号注册一站式方案",
    description: "专注解决出海必备账号注册难题，覆盖主流平台账号注册与激活流程。",
    link: "https://wiseinvest.acceboy.com/",
    iconUrl: "https://wiseinvest.acceboy.com/",
    claimedCount: 320,
  },
];

const perkCategories: PerkCategory[] = [
  { id: "crypto", label: "加密货币", emoji: "₿", items: perks.filter((p) => p.category === "Crypto") },
  { id: "banking", label: "银行服务", emoji: "🏦", items: perks.filter((p) => p.category === "Banking") },
  { id: "stocks", label: "股票交易", emoji: "📈", items: perks.filter((p) => p.category === "Stocks") },
  { id: "a-stocks", label: "A股券商", emoji: "🏮", items: perks.filter((p) => p.category === "AStocks") },
  { id: "virtual-card", label: "虚拟 U 卡", emoji: "💳", items: perks.filter((p) => p.category === "VirtualCard") },
  { id: "wallet", label: "链上钱包", emoji: "⛓️", items: perks.filter((p) => p.category === "Wallet") },
  { id: "a-stock-ipo", label: "A股打新", emoji: "🎯", items: [] },
  { id: "other-resources", label: "其他资源", emoji: "🧰", items: [] },
];

const totalClaimed = [
  ...perks.map((p) => p.claimedCount ?? 0),
  ...otherResources.map((r) => r.claimedCount ?? 0),
  ipoResource.claimedCount ?? 0,
].reduce((a, b) => a + b, 0);

const formatCount = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

const getTextColor = (hex: string) => {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? "#000000" : "#ffffff";
};

const BADGE_STYLE: Record<string, string> = {
  "编辑推荐": "bg-amber-400 text-amber-950",
  "热门": "bg-rose-500 text-white",
  "新上线": "bg-emerald-500 text-white",
  "限时": "bg-purple-500 text-white",
};

// 新手推荐三步走
const starterPath = [
  {
    step: 1,
    label: "先开交易所",
    desc: "注册币安 / Bybit，20% 手续费返佣",
    color: "#F3BA2F",
    perkId: "binance",
  },
  {
    step: 2,
    label: "再办港卡",
    desc: "Wise + 众安，打通境内外资金流转",
    color: "#00B9FF",
    perkId: "wise",
  },
  {
    step: 3,
    label: "最后开券商",
    desc: "复星证券终生免佣，开始投资港美股",
    color: "#1A1A1A",
    perkId: "futu",
  },
];

export default function PerksPage() {
  const [activeCategory, setActiveCategory] = useState<string>(perkCategories[0]?.id || "");
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Hash-based anchor scrolling (e.g. /perks#china-galaxy)
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const tryScroll = (attempts = 0) => {
      const el = document.getElementById(hash);
      if (el) {
        window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 100, behavior: "smooth" });
      } else if (attempts < 10) {
        setTimeout(() => tryScroll(attempts + 1), 100);
      }
    };
    setTimeout(() => tryScroll(), 200);
  }, []);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const sections = perkCategories
            .map((cat) => {
              const el = document.getElementById(cat.id);
              if (!el) return null;
              const rect = el.getBoundingClientRect();
              return { id: cat.id, top: rect.top, bottom: rect.bottom };
            })
            .filter(Boolean) as { id: string; top: number; bottom: number }[];
          const mid = window.innerHeight / 2 + 100;
          for (const s of sections) {
            if (s.top <= mid && s.bottom >= mid) { setActiveCategory(s.id); break; }
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCategoryClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 80, behavior: "smooth" });
      setActiveCategory(id);
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    toast.success("邀请码已复制");
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative dot-grid">

      {/* ── PAGE HERO ── */}
      <div className="relative z-[1] bg-amber-50 dark:bg-slate-900 border-b border-amber-200 dark:border-slate-800">
        <div className="max-w-[1520px] mx-auto px-4 md:px-6 pt-6 pb-4 md:pt-8 md:pb-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                  <Zap className="w-3 h-3" />
                  WiseInvest 读者专属
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-1.5">
                社区专属福利中心
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
                每一个邀请码都经过亲测，确保福利真实有效。通过这里注册，你比直接注册能多拿到更多奖励。
              </p>
            </div>
            {/* Stats */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-center bg-white dark:bg-slate-900 rounded-xl px-3 py-2 md:px-4 md:py-2.5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-lg md:text-xl font-black text-amber-500">{formatCount(totalClaimed)}+</div>
                <div className="text-[10px] md:text-[11px] text-slate-400 mt-0.5">已领取人次</div>
              </div>
              <div className="text-center bg-white dark:bg-slate-900 rounded-xl px-3 py-2 md:px-4 md:py-2.5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-lg md:text-xl font-black text-slate-800 dark:text-white">{perks.length + otherResources.length + 1}</div>
                <div className="text-[10px] md:text-[11px] text-slate-400 mt-0.5">个专属福利</div>
              </div>
              <div className="text-center bg-white dark:bg-slate-900 rounded-xl px-3 py-2 md:px-4 md:py-2.5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-lg md:text-xl font-black text-emerald-500">100%</div>
                <div className="text-[10px] md:text-[11px] text-slate-400 mt-0.5">亲测有效</div>
              </div>
            </div>
          </div>

          {/* Starter Path */}
          <div className="hidden md:block mt-5 rounded-2xl border border-amber-200/70 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/80 to-white dark:from-slate-900 dark:to-slate-900 p-5 shadow-sm overflow-hidden relative">
            {/* subtle glow behind */}
            <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-64 h-24 rounded-full bg-amber-300/20 blur-2xl" />

            <div className="flex items-center gap-2 mb-5 relative">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">新手推荐领取路径</span>
              <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[11px] font-semibold">按顺序领效果最好</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-3 sm:gap-0 relative">
              {starterPath.map((item, i) => (
                <div key={item.step} className="flex sm:flex-row items-center flex-1 min-w-0">
                  {/* Step card */}
                  <div
                    className="flex-1 rounded-xl p-3 md:p-4 border relative transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    style={{
                      borderColor: item.color + "55",
                      background: `linear-gradient(135deg, ${item.color}12 0%, ${item.color}06 100%)`,
                    }}
                  >
                    {/* Step number badge */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shadow mb-2"
                      style={{ backgroundColor: item.color, color: getTextColor(item.color) }}
                    >
                      {item.step}
                    </div>
                    <div className="font-bold text-sm md:text-[15px] text-slate-900 dark:text-white leading-snug">{item.label}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{item.desc}</div>
                  </div>

                  {/* Animated flow connector */}
                  {i < starterPath.length - 1 && (
                    <div className="hidden sm:flex shrink-0 flex-col items-center justify-center w-14 self-center gap-1">
                      <div className="relative w-full h-[3px] bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="animate-flow-dot absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-amber-400 to-transparent"
                          style={{ animationDelay: `${i * 0.55}s` }}
                        />
                      </div>
                      <div
                        className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-amber-400 dark:border-l-amber-500 -mt-0.5"
                        style={{ marginLeft: "auto", marginRight: "4px" }}
                      />
                    </div>
                  )}

                  {/* Mobile vertical connector */}
                  {i < starterPath.length - 1 && (
                    <div className="sm:hidden flex flex-col items-center w-full py-1 gap-0.5">
                      <div className="relative h-8 w-[3px] bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mx-auto">
                        <div className="absolute inset-0 w-full bg-gradient-to-b from-transparent via-amber-400 to-transparent animate-flow-dot-vertical" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE CATEGORY TABS ── */}
      <div className="md:hidden sticky top-16 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide px-3 py-2">
          {perkCategories.map((cat) => {
            const count = cat.id === "other-resources" ? otherResources.length : cat.id === "a-stock-ipo" ? 1 : cat.items.length;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap",
                  isActive
                    ? "bg-amber-400 text-slate-900"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                )}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
                <span className={cn(
                  "text-[10px] rounded-full px-1 font-mono",
                  isActive ? "bg-amber-950/20 text-amber-900" : "text-slate-400"
                )}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative z-[1] max-w-[1520px] mx-auto flex items-start gap-4 px-4 md:px-6 pt-4">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="w-52 shrink-0 sticky top-20 pt-4 self-start max-h-[calc(100vh-80px)] overflow-y-auto hidden md:block scrollbar-hide">
          <div className="px-3 py-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 px-1">
              分类导航
            </p>
            <nav className="space-y-1">
              {perkCategories.map((cat) => {
                const count = cat.id === "other-resources" ? otherResources.length : cat.id === "a-stock-ipo" ? 1 : cat.items.length;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-full text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-amber-400 dark:bg-amber-500 text-slate-900 shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </span>
                    <span className={cn(
                      "text-xs rounded-full px-1.5 py-0.5 font-mono",
                      isActive
                        ? "bg-amber-950/20 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Trust Signal */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-2 px-1">
                <Shield className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                  所有福利均经过 WiseInvest 亲测验证，安全可靠。
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 min-w-0 flex flex-col pb-16 md:pb-20 space-y-8 md:space-y-12">
          {perkCategories.map((category) => {
            const isOther = category.id === "other-resources";
            const items = isOther ? [] : category.items;
            const featured = items.find((p) => p.featured);
            const rest = items.filter((p) => !p.featured);
            const count = isOther ? otherResources.length : items.length;

            const isIpo = category.id === "a-stock-ipo";

            return (
              <section key={category.id} id={category.id} className="scroll-mt-24">
                {/* Section Header */}
                <div className="flex items-center gap-3 mb-4 md:mb-5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-base">
                    {category.emoji}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{category.label}</h2>
                  <span className="text-xs font-mono bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 px-2 py-0.5 rounded-full">
                    {isIpo ? "1 个福利" : `${count} 个福利`}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* A股打新：单独大卡 */}
                  {isIpo && (
                    <OtherCard item={ipoResource} copiedCodeId={copiedCodeId} onCopyCode={handleCopyCode} />
                  )}
                  {/* A股券商：全部作为大卡展示 */}
                  {!isOther && !isIpo && category.id === "a-stocks" && (
                    <div className="space-y-4">
                      {items.map((perk) => (
                        <HeroCard key={perk.id} perk={perk} copiedCodeId={copiedCodeId} onCopyCode={handleCopyCode} />
                      ))}
                    </div>
                  )}
                  {/* 其他分类：一张精选大卡 + 普通卡网格 */}
                  {!isOther && !isIpo && category.id !== "a-stocks" && featured && (
                    <HeroCard perk={featured} copiedCodeId={copiedCodeId} onCopyCode={handleCopyCode} />
                  )}
                  {!isOther && !isIpo && category.id !== "a-stocks" && rest.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {rest.map((perk) => (
                        <PerkCard key={perk.id} perk={perk} copiedCodeId={copiedCodeId} onCopyCode={handleCopyCode} />
                      ))}
                    </div>
                  )}
                  {isOther && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {otherResources.map((item) => (
                        <OtherCard key={item.id} item={item} copiedCodeId={copiedCodeId} onCopyCode={handleCopyCode} />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </main>
      </div>
    </div>
  );
}

// ── Hero Card ──────────────────────────────────────────────────────────────────
function HeroCard({ perk, copiedCodeId, onCopyCode }: {
  perk: Perk; copiedCodeId: string | null; onCopyCode: (code: string, id: string) => void;
}) {
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [wechatOpen, setWechatOpen] = useState(false);
  const router = useRouter();
  const isCopied = copiedCodeId === perk.id;
  const iconSourceUrl = perk.iconUrl || perk.link;
  const iconInfo = IconService.getIconInfo(iconSourceUrl, perk.platform);
  const hasTutorial = perk.tutorialImage || perk.tutorialLink;

  const handleTutorialClick = () => {
    if (perk.tutorialImage) setTutorialOpen(true);
    else if (perk.tutorialLink) {
      if (perk.tutorialLink.startsWith("/")) router.push(perk.tutorialLink);
      else openSafeExternalUrl(perk.tutorialLink);
    }
  };

  const handleClaimClick = () => {
    if (perk.contactWeChat) setWechatOpen(true);
    else openSafeExternalUrl(perk.link);
  };

  return (
    <div
      id={perk.id}
      className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300 scroll-mt-24"
      style={{ borderLeftWidth: 4, borderLeftColor: perk.color }}
    >
      {/* Tinted top stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: `linear-gradient(90deg, ${perk.color}60, transparent)` }}
      />

      {/* Watermark */}
      {!iconInfo.isDefault && (
        <img
          src={iconInfo.iconUrl} alt=""
          className="absolute -bottom-16 -right-12 w-64 h-64 opacity-[0.06] rotate-12 group-hover:opacity-[0.1] group-hover:rotate-6 transition-all duration-500 pointer-events-none select-none grayscale group-hover:grayscale-0 z-0"
        />
      )}

      <div className="relative z-10 p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left: icon + info */}
          <div className="flex items-center gap-3">
            <ResourceIcon url={iconSourceUrl} name={perk.platform} size={44} rounded />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white">{perk.platform}</span>
                {perk.badge && (
                  <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold", BADGE_STYLE[perk.badge])}>
                    <Star className="w-2.5 h-2.5" />{perk.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{perk.description}</p>
            </div>
          </div>

          {/* Right: claimed count */}
          {perk.claimedCount && (
            <div className="shrink-0 text-right">
              <div className="text-base font-black" style={{ color: perk.color }}>{formatCount(perk.claimedCount)}</div>
              <div className="text-[10px] text-slate-400 whitespace-nowrap">人已领取</div>
            </div>
          )}
        </div>

        {/* Reward highlight */}
        <div className="mt-3 mb-3 flex items-end gap-3">
          <div
            className="text-3xl md:text-4xl font-black leading-none tracking-tight"
            style={{ color: perk.color }}
          >
            {perk.highlightValue}
          </div>
          <div className="pb-0.5">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">{perk.benefit}</p>
          </div>
        </div>

        {/* Details grid */}
        {perk.details && perk.details.length > 0 && (
          <div className="mb-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 p-3">
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {(() => {
                const groups: { title: string; items: string[] }[] = [];
                let current: { title: string; items: string[] } | null = null;
                for (const d of perk.details!) {
                  if (d.startsWith("##")) {
                    if (current) groups.push(current);
                    current = { title: d.slice(2), items: [] };
                  } else {
                    if (!current) current = { title: "", items: [] };
                    current.items.push(d);
                  }
                }
                if (current) groups.push(current);
                return groups.map((group, gi) => (
                  <div key={gi} className="min-w-0 flex-1" style={{ minWidth: "160px" }}>
                    {group.title && (
                      <p className="text-[10px] font-bold mb-1" style={{ color: perk.color }}>
                        {group.title}
                      </p>
                    )}
                    <div className="space-y-0.5">
                      {group.items.map((item, ii) => (
                        <div key={ii} className="flex items-start gap-1">
                          <span className="mt-[5px] shrink-0 w-1 h-1 rounded-full" style={{ backgroundColor: perk.color + "99" }} />
                          <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Code */}
        {perk.code && (
          <div className="mb-4 flex items-center gap-2 max-w-xs">
            <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">邀请码</span>
            <button
              onClick={() => onCopyCode(perk.code!, perk.id)}
              className="flex-1 flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 hover:border-amber-400 dark:hover:border-amber-500 transition-colors group/code"
            >
              <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-100 tracking-widest">
                {perk.code}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400 group-hover/code:text-amber-500 transition-colors ml-2">
                {isCopied ? <><Check className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-500">已复制</span></> : <><Copy className="w-3.5 h-3.5" />复制</>}
              </span>
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleClaimClick}
            className="h-10 px-6 rounded-xl text-sm font-bold hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center gap-2"
            style={{ backgroundColor: perk.color, color: getTextColor(perk.color) }}
          >
            立即领取
            {perk.contactWeChat ? <span className="text-base leading-none">💬</span> : <ExternalLink className="w-4 h-4" />}
          </button>
          {hasTutorial && (
            <button
              onClick={handleTutorialClick}
              className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 transition-all flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4" />
              查看教程
            </button>
          )}
        </div>
      </div>

      {perk.tutorialImage && (
        <Dialog open={tutorialOpen} onOpenChange={setTutorialOpen}>
          <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-auto p-0">
            <DialogHeader className="p-4 pb-0"><DialogTitle>{perk.platform} - 教程</DialogTitle></DialogHeader>
            <div className="p-4 pt-2">
              <img src={perk.tutorialImage} alt={`${perk.platform} 教程`} className="w-full h-auto rounded-lg" />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {perk.contactWeChat && (
        <Dialog open={wechatOpen} onOpenChange={setWechatOpen}>
          <DialogContent className="max-w-sm w-[90vw] p-0 overflow-hidden">
            <DialogHeader className="sr-only"><DialogTitle>微信联系二维码</DialogTitle></DialogHeader>
            <div className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-900 p-6 text-center">
              <div className="mb-3">
                <p className="text-base font-bold text-slate-900 dark:text-white">添加微信，获取专属开户支持</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  扫码添加好友，发送「<span className="font-semibold text-slate-700 dark:text-slate-300">{perk.platform}</span>」即可获取专属开户费率协助
                </p>
              </div>
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm mx-auto" style={{ maxWidth: 260 }}>
                <img src="/images/企业微信.png" alt="微信二维码" className="w-full h-auto block" />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3">长按或扫码识别二维码</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ── Regular Perk Card ──────────────────────────────────────────────────────────
function PerkCard({ perk, copiedCodeId, onCopyCode }: {
  perk: Perk; copiedCodeId: string | null; onCopyCode: (code: string, id: string) => void;
}) {
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [wechatOpen, setWechatOpen] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const isCopied = copiedCodeId === perk.id;
  const iconSourceUrl = perk.iconUrl || perk.link;
  const iconInfo = IconService.getIconInfo(iconSourceUrl, perk.platform);
  const hasTutorial = perk.tutorialImage || perk.tutorialLink;

  // 进入视口时触发浮动动画（仅 notice 卡片）
  useEffect(() => {
    if (!perk.notice) return;
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsFloating(true); },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [perk.notice]);

  const handleTutorialClick = () => {
    if (perk.tutorialImage) setTutorialOpen(true);
    else if (perk.tutorialLink) {
      if (perk.tutorialLink.startsWith("/")) router.push(perk.tutorialLink);
      else openSafeExternalUrl(perk.tutorialLink);
    }
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative rounded-2xl bg-white dark:bg-slate-900 overflow-hidden group hover:shadow-lg transition-all duration-200 flex flex-col",
        perk.notice
          ? "border-2 border-amber-400 dark:border-amber-500 shadow-[0_0_0_3px_rgba(251,191,36,0.15)] dark:shadow-[0_0_0_3px_rgba(251,191,36,0.1)]"
          : "border border-slate-200 dark:border-slate-800 shadow-sm",
        isFloating ? "animate-float-attention" : "hover:-translate-y-0.5"
      )}
      style={perk.notice ? undefined : { borderLeftWidth: 3, borderLeftColor: perk.color }}
    >
      {/* Tinted top stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${perk.color}80, transparent)` }}
      />

      {!iconInfo.isDefault && (
        <img
          src={iconInfo.iconUrl} alt=""
          className="absolute -bottom-10 -right-8 w-36 h-36 opacity-[0.07] rotate-12 group-hover:opacity-[0.12] group-hover:rotate-6 transition-all duration-500 pointer-events-none select-none grayscale group-hover:grayscale-0 z-0"
        />
      )}

      <div className="relative z-10 p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <ResourceIcon url={iconSourceUrl} name={perk.platform} size={36} rounded />
            <span className="font-bold text-slate-900 dark:text-white text-sm">{perk.platform}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {perk.badge && (
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", BADGE_STYLE[perk.badge])}>
                {perk.badge}
              </span>
            )}
            {perk.claimedCount && (
              <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                <Users className="w-3 h-3" />
                <span className="text-[11px] font-mono font-semibold">{formatCount(perk.claimedCount)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Reward */}
        <div className="mb-3">
          <div className="text-2xl md:text-3xl font-black leading-none mb-1.5 tracking-tight" style={{ color: perk.color }}>
            {perk.highlightValue}
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-snug">{perk.benefit}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{perk.description}</p>
          {perk.notice && (
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 px-3 py-1.5">
              <span className="text-base leading-none">🔥</span>
              <p className="text-sm font-bold text-red-600 dark:text-red-400">{perk.notice}</p>
            </div>
          )}
        </div>

        {/* Details grid */}
        {perk.details && perk.details.length > 0 && (
          <div className="mb-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 p-2.5">
            <div className="grid grid-cols-1 gap-y-1">
              {perk.details.slice(0, 8).map((d, i) => {
                const isTitle = d.startsWith("##");
                if (isTitle) return (
                  <p key={i} className="text-[11px] font-bold mt-1.5 first:mt-0" style={{ color: perk.color }}>{d.slice(2)}</p>
                );
                return (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="mt-[4px] shrink-0 w-1 h-1 rounded-full" style={{ backgroundColor: perk.color + "aa" }} />
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">{d}</span>
                  </div>
                );
              })}
              {perk.details.filter(d => !d.startsWith("##")).length > 6 && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 pl-2.5">+更多权益</p>
              )}
            </div>
          </div>
        )}

        {/* Code */}
        {perk.code && (
          <button
            onClick={() => onCopyCode(perk.code!, perk.id)}
            className="mb-3 w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 hover:border-amber-400 dark:hover:border-amber-500 transition-colors group/code text-left"
          >
            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 tracking-widest">
              {perk.code}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400 group-hover/code:text-amber-500 transition-colors ml-2">
              {isCopied ? <><Check className="w-3 h-3 text-emerald-500" /><span className="text-emerald-500">已复制</span></> : <><Copy className="w-3 h-3" />点击复制</>}
            </span>
          </button>
        )}

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          {perk.link !== "#" && (
            <button
              onClick={() => openSafeExternalUrl(perk.link)}
              className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-xl text-sm font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm"
              style={{ backgroundColor: perk.color, color: getTextColor(perk.color) }}
            >
              立即领取
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
          {perk.contactWeChat && (
            perk.link === "#" ? (
              <button
                onClick={() => setWechatOpen(true)}
                className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-xl text-sm font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm"
                style={{ backgroundColor: perk.color, color: getTextColor(perk.color) }}
              >
                <span className="text-base leading-none">💬</span>
                联系博主
              </button>
            ) : (
              <button
                onClick={() => setWechatOpen(true)}
                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 transition-all flex items-center gap-1 whitespace-nowrap"
              >
                <span className="text-sm leading-none">💬</span>
                联系博主
              </button>
            )
          )}
          {hasTutorial && (
            <button
              onClick={handleTutorialClick}
              className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 transition-all flex items-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" />
              教程
            </button>
          )}
        </div>
      </div>

      {perk.tutorialImage && (
        <Dialog open={tutorialOpen} onOpenChange={setTutorialOpen}>
          <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-auto p-0">
            <DialogHeader className="p-4 pb-0"><DialogTitle>{perk.platform} - 教程</DialogTitle></DialogHeader>
            <div className="p-4 pt-2">
              <img src={perk.tutorialImage} alt={`${perk.platform} 教程`} className="w-full h-auto rounded-lg" />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {perk.contactWeChat && (
        <Dialog open={wechatOpen} onOpenChange={setWechatOpen}>
          <DialogContent className="max-w-sm w-[90vw] p-0 overflow-hidden">
            <DialogHeader className="sr-only"><DialogTitle>微信联系二维码</DialogTitle></DialogHeader>
            <div className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-900 p-6 text-center">
              <div className="mb-3">
                <p className="text-base font-bold text-slate-900 dark:text-white">添加微信，获取专属开户支持</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  扫码添加好友，发送「<span className="font-semibold text-slate-700 dark:text-slate-300">{perk.platform}</span>」即可获取专属开户费率协助
                </p>
              </div>
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm mx-auto" style={{ maxWidth: 260 }}>
                <img src="/images/企业微信.png" alt="微信二维码" className="w-full h-auto block" />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3">长按或扫码识别二维码</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ── Other Resource Card ───────────────────────────────────────────────────────
function OtherCard({ item, copiedCodeId, onCopyCode }: {
  item: OtherResourceItem; copiedCodeId: string | null; onCopyCode: (code: string, id: string) => void;
}) {
  const isCopied = copiedCodeId === item.id;
  const router = useRouter();
  const isInternalLink = item.link?.startsWith("/");
  const iconSourceUrl = item.iconUrl || (isInternalLink ? undefined : item.link) || "";
  const iconInfo = IconService.getIconInfo(iconSourceUrl, item.title);

  return (
    <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col border-l-[3px] border-l-slate-400 dark:border-l-slate-600">
      {!iconInfo.isDefault && (
        <img src={iconInfo.iconUrl} alt="" className="absolute -bottom-10 -right-8 w-36 h-36 opacity-[0.07] rotate-12 group-hover:opacity-[0.12] group-hover:rotate-6 transition-all duration-500 pointer-events-none select-none grayscale group-hover:grayscale-0 z-0" />
      )}
      <div className="relative z-10 p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <ResourceIcon url={iconSourceUrl} name={item.title} size={36} rounded />
            <span className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</span>
          </div>
          {item.claimedCount && (
            <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
              <Users className="w-3 h-3" />
              <span className="text-[11px] font-mono font-semibold">{formatCount(item.claimedCount)}</span>
            </div>
          )}
        </div>

        <div className="mb-3">
          {item.highlight && (
            <p className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">{item.highlight}</p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.description}</p>
        </div>

        {item.code && (
          <button
            onClick={() => onCopyCode(item.code!, item.id)}
            className="mb-3 w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 hover:border-amber-400 dark:hover:border-amber-500 transition-colors group/code text-left"
          >
            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 tracking-widest">{item.code}</span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400 group-hover/code:text-amber-500 transition-colors ml-2">
              {isCopied ? <><Check className="w-3 h-3 text-emerald-500" /><span className="text-emerald-500">已复制</span></> : <><Copy className="w-3 h-3" />点击复制</>}
            </span>
          </button>
        )}

        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
          {item.link && (
            <button
              onClick={() => isInternalLink ? router.push(item.link!) : openSafeExternalUrl(item.link!)}
              className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 text-sm font-bold hover:opacity-90 active:scale-95 transition-all"
            >
              立即访问 <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
          {item.tutorialLink && (
            <button
              onClick={() => openSafeExternalUrl(item.tutorialLink!)}
              className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" /> 教程
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
