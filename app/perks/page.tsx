"use client";

import { useState, useEffect } from "react";
import { Copy, ExternalLink, BookOpen, Check, Users, Star } from "lucide-react";
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
  { id: "virtual-card", label: "虚拟 U 卡", emoji: "💳", items: perks.filter((p) => p.category === "VirtualCard") },
  { id: "wallet", label: "链上钱包", emoji: "⛓️", items: perks.filter((p) => p.category === "Wallet") },
  { id: "other-resources", label: "其他资源", emoji: "🧰", items: [] },
];

const formatCount = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

// 根据背景色亮度返回对应文字色
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

export default function PerksPage() {
  const [activeCategory, setActiveCategory] = useState<string>(perkCategories[0]?.id || "");
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
      <div className="max-w-[1520px] mx-auto flex items-start gap-4 relative px-4 md:px-6 pt-2">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="w-52 shrink-0 sticky top-20 pt-6 self-start max-h-[calc(100vh-80px)] overflow-y-auto hidden md:block scrollbar-hide">
          <div className="px-3 py-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 px-1">
              分类导航
            </p>
            <nav className="space-y-1">
              {perkCategories.map((cat) => {
                const count = cat.id === "other-resources" ? otherResources.length : cat.items.length;
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
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 min-w-0 flex flex-col">

          {/* Page Header */}
          <div className="pt-6 pb-4">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">社区专属福利</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              专为 Wise Invest 读者精选的最佳注册优惠和手续费返佣
            </p>
          </div>

          {/* Sections */}
          <div className="pb-20 space-y-14">
            {perkCategories.map((category) => {
              const isOther = category.id === "other-resources";
              const items = isOther ? [] : category.items;
              const featured = items.find((p) => p.featured);
              const rest = items.filter((p) => !p.featured);
              const count = isOther ? otherResources.length : items.length;

              return (
                <section key={category.id} id={category.id} className="scroll-mt-24">
                  {/* Section Header */}
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-xl">{category.emoji}</span>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{category.label}</h2>
                    <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
                      {count} 个福利
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Featured Hero Card */}
                    {!isOther && featured && (
                      <HeroCard
                        perk={featured}
                        copiedCodeId={copiedCodeId}
                        onCopyCode={handleCopyCode}
                      />
                    )}

                    {/* Regular 2-col Grid */}
                    {!isOther && rest.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {rest.map((perk) => (
                          <PerkCard
                            key={perk.id}
                            perk={perk}
                            copiedCodeId={copiedCodeId}
                            onCopyCode={handleCopyCode}
                          />
                        ))}
                      </div>
                    )}

                    {/* Other Resources Grid */}
                    {isOther && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {otherResources.map((item) => (
                          <OtherCard
                            key={item.id}
                            item={item}
                            copiedCodeId={copiedCodeId}
                            onCopyCode={handleCopyCode}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Hero Card (Featured, Full-Width) ──────────────────────────────────────────
function HeroCard({
  perk,
  copiedCodeId,
  onCopyCode,
}: {
  perk: Perk;
  copiedCodeId: string | null;
  onCopyCode: (code: string, id: string) => void;
}) {
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const isCopied = copiedCodeId === perk.id;
  const iconSourceUrl = perk.iconUrl || perk.link;
  const iconInfo = IconService.getIconInfo(iconSourceUrl, perk.platform);
  const hasTutorial = perk.tutorialImage || perk.tutorialLink;

  const handleTutorialClick = () => {
    if (perk.tutorialImage) setTutorialOpen(true);
    else if (perk.tutorialLink) openSafeExternalUrl(perk.tutorialLink);
  };

  return (
    <div
      className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden group hover:shadow-lg transition-all duration-300"
      style={{ borderLeftWidth: 4, borderLeftColor: perk.color }}
    >
      {/* Watermark */}
      {!iconInfo.isDefault && (
        <img
          src={iconInfo.iconUrl}
          alt=""
          className="absolute -bottom-16 -right-12 w-64 h-64 opacity-[0.06] rotate-12 group-hover:opacity-[0.1] group-hover:scale-105 group-hover:rotate-6 transition-all duration-500 pointer-events-none select-none grayscale group-hover:grayscale-0 z-0"
        />
      )}

      <div className="relative z-10 p-4 md:p-5">
        {/* Top row: icon + name + badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <ResourceIcon url={iconSourceUrl} name={perk.platform} size={36} rounded />
            <div>
              <span className="font-bold text-slate-900 dark:text-white text-sm">{perk.platform}</span>
              <p className="text-xs text-slate-500 dark:text-slate-400">{perk.description}</p>
            </div>
          </div>
          {perk.badge && (
            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold", BADGE_STYLE[perk.badge])}>
              <Star className="w-3 h-3" />
              {perk.badge}
            </span>
          )}
        </div>

        {/* Highlight value + benefit */}
        <div className="mb-3">
          <div
            className="text-3xl font-extrabold leading-none mb-1.5 tracking-tight"
            style={{ color: perk.color }}
          >
            {perk.highlightValue}
          </div>
          <p className="text-base font-semibold text-slate-800 dark:text-slate-100">{perk.benefit}</p>
        </div>

        {/* Code */}
        {perk.code && (
          <div className="mb-3 flex items-center gap-2 max-w-xs">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">邀请码</span>
            <div className="flex-1 flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2.5 py-1.5">
              <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100 tracking-widest">
                {perk.code}
              </span>
              <button
                onClick={() => onCopyCode(perk.code!, perk.id)}
                className="ml-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                aria-label="复制邀请码"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* Actions + social proof */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => openSafeExternalUrl(perk.link)}
            className="h-8 px-4 font-bold text-xs hover:opacity-90 transition-opacity shadow-sm"
            style={{ backgroundColor: perk.color, color: getTextColor(perk.color) }}
          >
            立即领取
            <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
          </Button>
          {hasTutorial && (
            <Button
              onClick={handleTutorialClick}
              variant="outline"
              className="h-8 px-3 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs"
            >
              <BookOpen className="w-3 h-3 mr-1.5" />
              查看教程
            </Button>
          )}
          {perk.claimedCount && (
            <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 ml-auto">
              <Users className="w-3.5 h-3.5" />
              <span className="text-xs">{formatCount(perk.claimedCount)} 人已领取</span>
            </div>
          )}
        </div>
      </div>

      {/* Tutorial Dialog */}
      {perk.tutorialImage && (
        <Dialog open={tutorialOpen} onOpenChange={setTutorialOpen}>
          <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-auto p-0">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle>{perk.platform} - 教程</DialogTitle>
            </DialogHeader>
            <div className="p-4 pt-2">
              <img src={perk.tutorialImage} alt={`${perk.platform} 教程`} className="w-full h-auto rounded-lg" />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ── Regular Perk Card (2-col grid) ────────────────────────────────────────────
function PerkCard({
  perk,
  copiedCodeId,
  onCopyCode,
}: {
  perk: Perk;
  copiedCodeId: string | null;
  onCopyCode: (code: string, id: string) => void;
}) {
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const isCopied = copiedCodeId === perk.id;
  const iconSourceUrl = perk.iconUrl || perk.link;
  const iconInfo = IconService.getIconInfo(iconSourceUrl, perk.platform);
  const hasTutorial = perk.tutorialImage || perk.tutorialLink;

  const handleTutorialClick = () => {
    if (perk.tutorialImage) setTutorialOpen(true);
    else if (perk.tutorialLink) openSafeExternalUrl(perk.tutorialLink);
  };

  return (
    <div
      className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
      style={{ borderLeftWidth: 3, borderLeftColor: perk.color }}
    >
      {/* Watermark */}
      {!iconInfo.isDefault && (
        <img
          src={iconInfo.iconUrl}
          alt=""
          className="absolute -bottom-10 -right-8 w-36 h-36 opacity-[0.07] rotate-12 group-hover:opacity-[0.12] group-hover:rotate-6 transition-all duration-500 pointer-events-none select-none grayscale group-hover:grayscale-0 z-0"
        />
      )}

      <div className="relative z-10 p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <ResourceIcon url={iconSourceUrl} name={perk.platform} size={36} rounded />
            <span className="font-bold text-slate-900 dark:text-white text-sm">{perk.platform}</span>
          </div>
          {perk.badge && (
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", BADGE_STYLE[perk.badge])}>
              {perk.badge}
            </span>
          )}
        </div>

        {/* Highlight value + benefit */}
        <div className="mb-4">
          <div
            className="text-2xl font-extrabold leading-none mb-1.5 tracking-tight"
            style={{ color: perk.color }}
          >
            {perk.highlightValue}
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-snug">{perk.benefit}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{perk.description}</p>
        </div>

        {/* Code */}
        {perk.code && (
          <div className="mb-3 flex items-center gap-1.5">
            <div className="flex-1 flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2.5 py-1.5">
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 tracking-widest">
                {perk.code}
              </span>
              <button
                onClick={() => onCopyCode(perk.code!, perk.id)}
                className="ml-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                aria-label="复制邀请码"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => openSafeExternalUrl(perk.link)}
            className="flex-1 h-8 flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: perk.color, color: getTextColor(perk.color) }}
          >
            立即领取
            <ExternalLink className="w-3 h-3" />
          </button>
          {hasTutorial && (
            <button
              onClick={handleTutorialClick}
              className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
            >
              <BookOpen className="w-3 h-3" />
              教程
            </button>
          )}
          {perk.claimedCount && (
            <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 ml-auto">
              <Users className="w-3 h-3" />
              <span className="text-[11px] font-mono">{formatCount(perk.claimedCount)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tutorial Dialog */}
      {perk.tutorialImage && (
        <Dialog open={tutorialOpen} onOpenChange={setTutorialOpen}>
          <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-auto p-0">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle>{perk.platform} - 教程</DialogTitle>
            </DialogHeader>
            <div className="p-4 pt-2">
              <img src={perk.tutorialImage} alt={`${perk.platform} 教程`} className="w-full h-auto rounded-lg" />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ── Other Resource Card ───────────────────────────────────────────────────────
function OtherCard({
  item,
  copiedCodeId,
  onCopyCode,
}: {
  item: OtherResourceItem;
  copiedCodeId: string | null;
  onCopyCode: (code: string, id: string) => void;
}) {
  const isCopied = copiedCodeId === item.id;
  const iconSourceUrl = item.iconUrl || item.link || "";
  const iconInfo = IconService.getIconInfo(iconSourceUrl, item.title);

  return (
    <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col border-l-[3px] border-l-slate-400 dark:border-l-slate-600">
      {!iconInfo.isDefault && (
        <img
          src={iconInfo.iconUrl}
          alt=""
          className="absolute -bottom-10 -right-8 w-36 h-36 opacity-[0.07] rotate-12 group-hover:opacity-[0.12] group-hover:rotate-6 transition-all duration-500 pointer-events-none select-none grayscale group-hover:grayscale-0 z-0"
        />
      )}
      <div className="relative z-10 p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2.5 mb-4">
          <ResourceIcon url={iconSourceUrl} name={item.title} size={36} rounded />
          <span className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</span>
        </div>

        <div className="mb-4">
          {item.highlight && (
            <p className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">{item.highlight}</p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.description}</p>
        </div>

        {item.code && (
          <div className="mb-3 flex items-center gap-1.5">
            <div className="flex-1 flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2.5 py-1.5">
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 tracking-widest">
                {item.code}
              </span>
              <button
                onClick={() => onCopyCode(item.code!, item.id)}
                className="ml-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                aria-label="复制邀请码"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
          {item.link && (
            <button
              onClick={() => openSafeExternalUrl(item.link!)}
              className="flex-1 h-8 flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity"
            >
              立即访问
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
          {item.tutorialLink && (
            <button
              onClick={() => openSafeExternalUrl(item.tutorialLink!)}
              className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
            >
              <BookOpen className="w-3 h-3" />
              教程
            </button>
          )}
          {item.claimedCount && (
            <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 ml-auto">
              <Users className="w-3 h-3" />
              <span className="text-[11px] font-mono">{formatCount(item.claimedCount)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
