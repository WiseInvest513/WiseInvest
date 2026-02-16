"use client";

import { useState, useEffect } from "react";
import { Copy, ExternalLink, BookOpen, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { perks, type Perk } from "@/lib/perks-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

// Group perks by category (similar to resources structure)
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
}

const otherResources: OtherResourceItem[] = [
  {
    id: "gamsgo",
    title: "GamsGo 会员合租",
    highlight: "连续7年提供高质量、价格可负担的数字订阅服务",
    description:
      "低成本共享主流订阅服务，适合控制流媒体与软件订阅开支，适合作为长期降本工具。",
    link: "https://www.gamsgo.com/partner/GwZjT",
    iconUrl: "https://www.gamsgo.com/",
    tutorialLink: "https://x.com/WiseInvest513/status/2017103331576139919",
  },
  {
    id: "xesim",
    title: "Xesim eSIM 服务",
    highlight: "一站式全球 eSIM 连接服务，出境上网更省心",
    description:
      "支持多国家/地区流量方案与设备适配查询，适合跨境出行、商务差旅与海外应用注册场景。",
    code: "WISE666",
    link: "https://xesim.cc/?DIST=RkJHFVg%3D",
    iconUrl: "https://xesim.cc/",
    tutorialLink: "https://x.com/WiseInvest513/status/2022688883348246699",
  },
];

const perkCategories: PerkCategory[] = [
  {
    id: "crypto",
    label: "加密货币",
    emoji: "₿",
    items: perks.filter((p) => p.category === "Crypto"),
  },
  {
    id: "banking",
    label: "银行服务",
    emoji: "🏦",
    items: perks.filter((p) => p.category === "Banking"),
  },
  {
    id: "stocks",
    label: "股票交易",
    emoji: "📈",
    items: perks.filter((p) => p.category === "Stocks"),
  },
  {
    id: "virtual-card",
    label: "虚拟 U 卡",
    emoji: "💳",
    items: perks.filter((p) => p.category === "VirtualCard"),
  },
  {
    id: "wallet",
    label: "链上钱包",
    emoji: "⛓️",
    items: perks.filter((p) => p.category === "Wallet"),
  },
  {
    id: "other-resources",
    label: "其他资源",
    emoji: "🧰",
    items: [],
  },
];

export default function PerksPage() {
  const [activeCategory, setActiveCategory] = useState<string>(
    perkCategories[0]?.id || ""
  );
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Handle smooth scroll and active category detection (Optimized with throttle)
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const sections = perkCategories
            .map((cat) => {
              const element = document.getElementById(cat.id);
              if (element) {
                const rect = element.getBoundingClientRect();
                return {
                  id: cat.id,
                  top: rect.top,
                  bottom: rect.bottom,
                };
              }
              return null;
            })
            .filter(Boolean) as Array<{ id: string; top: number; bottom: number }>;

          // Find the section currently in view
          const viewportMiddle = window.innerHeight / 2 + 100; // Offset for sticky header
          for (const section of sections) {
            if (section.top <= viewportMiddle && section.bottom >= viewportMiddle) {
              setActiveCategory(section.id);
              break;
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    const element = document.getElementById(categoryId);
    if (element) {
      const offset = 80; // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      setActiveCategory(categoryId);
    }
  };

  const handleCopyCode = (code: string, perkId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(perkId);
    toast.success("邀请码已复制到剪贴板");
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleClaimOffer = (link: string) => {
    openSafeExternalUrl(link);
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "Crypto":
        return "text-yellow-600 border-yellow-300";
      case "Banking":
        return "text-blue-600 border-blue-300";
      case "Stocks":
        return "text-green-600 border-green-300";
      case "VirtualCard":
        return "text-purple-600 border-purple-300";
      case "Wallet":
        return "text-amber-600 border-amber-300";
      default:
        return "text-slate-600 border-slate-300";
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Main Container - No top padding here. We handle spacing inside sticky elements. */}
      <div className="max-w-[1520px] mx-auto flex items-start relative pt-0">
        
        {/* --- LEFT SIDEBAR --- */}
        <aside className="w-48 shrink-0 sticky top-16 pt-6 self-start max-h-[calc(100vh-64px)] overflow-y-auto border-r border-transparent hidden md:block scrollbar-hide">
          {/* Inner padding for content */}
          <div className="px-2">
            <h2 className="px-2 text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">
              分类导航
            </h2>
            <nav className="space-y-1 px-2 flex flex-col items-center">
              {perkCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={cn(
                    "directory-nav-button",
                    activeCategory === category.id
                      ? "directory-nav-button-active directory-nav-active"
                      : ""
                  )}
                >
                  <span className="mr-2">{category.emoji}</span>
                  {category.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* --- RIGHT CONTENT --- */}
        <main className="flex-1 min-w-0 flex flex-col">
          
          {/* 1. HEADER (Smart Sticky) */}
          <div className="sticky top-16 z-20 bg-white/95 dark:bg-slate-950/95 backdrop-blur pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 transition-all">
            <div className="px-6 md:px-8">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                社区专属福利
              </h1>
              <p className="text-base text-slate-500 dark:text-slate-400">
                专为 Wise Invest 读者精选的最佳注册优惠和手续费返佣
              </p>
            </div>
          </div>

          {/* 2. SCROLLABLE CONTENT */}
          <div className="content-fade-in px-6 md:px-8 pb-20 pt-6">
            {perkCategories.map((category) => {
              const sectionCount =
                category.id === "other-resources"
                  ? otherResources.length
                  : category.items.length;
              return (
              <section
                key={category.id}
                id={category.id}
                className="mb-12 scroll-mt-32"
              >
                {/* Section Header */}
                <div className="mb-6">
                  <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                    <span>{category.emoji}</span>
                    {category.label}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {sectionCount} 个福利
                  </p>
                </div>

                {/* Perk Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {category.id === "other-resources"
                    ? otherResources.map((item) => {
                        const iconSourceUrl = item.iconUrl || item.link || "";
                        const iconInfo = IconService.getIconInfo(iconSourceUrl, item.title);
                        const hasWatermarkIcon = Boolean(item.link) && !iconInfo.isDefault;
                        return item.link ? (
                          <div
                            key={item.id}
                            className="group bg-bg-primary border border-border-color rounded-lg shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col relative overflow-hidden"
                          >
                            <div className="h-1 w-full bg-red-500" />
                            {hasWatermarkIcon && (
                              <img
                                src={iconInfo.iconUrl}
                                alt=""
                                className="absolute -bottom-12 -right-10 w-44 h-44 opacity-[0.1] rotate-12 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:opacity-[0.16] z-0 pointer-events-none select-none grayscale group-hover:grayscale-0"
                              />
                            )}
                            <div className="relative z-10 p-5 flex flex-col flex-1">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <ResourceIcon
                                    url={iconSourceUrl}
                                    name={item.title}
                                    size={40}
                                    rounded={true}
                                  />
                                  <h3 className="font-bold text-text-primary text-base leading-tight">
                                    {item.title}
                                  </h3>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="text-xs shrink-0 text-slate-600 border-slate-300 border-current"
                                >
                                  其他资源
                                </Badge>
                              </div>
                              <div className="mb-4">
                                {item.highlight && (
                                  <p className="text-lg font-bold text-text-primary mb-1 leading-tight">
                                    {item.highlight}
                                  </p>
                                )}
                                <p className="text-xs text-text-secondary line-clamp-1">
                                  {item.description}
                                </p>
                              </div>
                              {item.code && (
                                <div className="mb-2 flex items-center gap-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300 whitespace-nowrap shrink-0">
                                      折扣邀请码
                                  </span>
                                  <div className="flex-1 min-w-0 bg-bg-secondary rounded-md flex justify-between items-center px-3 py-1.5 border border-slate-200/70 dark:border-slate-700/70">
                                    <span className="text-sm font-mono text-text-primary truncate">
                                      {item.code}
                                    </span>
                                    <button
                                      onClick={() => handleCopyCode(item.code!, item.id)}
                                      className="text-text-muted hover:text-text-primary transition-colors"
                                      aria-label="复制邀请码"
                                    >
                                      {copiedCodeId === item.id ? (
                                        <Check className="w-4 h-4 text-green-600" />
                                      ) : (
                                        <Copy className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )}
                              <div className="mt-auto flex items-center gap-2">
                                <Button
                                  onClick={() => openSafeExternalUrl(item.link!)}
                                  className="flex-1 h-9 bg-yellow-400 dark:bg-yellow-500 text-black hover:bg-yellow-500 dark:hover:bg-yellow-600 font-semibold text-sm"
                                >
                                  立即访问
                                  <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                                </Button>
                                {item.tutorialLink && (
                                  <Button
                                    onClick={() => openSafeExternalUrl(item.tutorialLink!)}
                                    variant="outline"
                                    className="h-9 px-3 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 font-medium text-sm whitespace-nowrap"
                                  >
                                    <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                                    查看教程
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div
                            key={item.id}
                            className="bg-bg-primary border border-border-color rounded-lg shadow-sm h-full min-h-[240px] flex flex-col justify-center items-center text-center p-6"
                          >
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                              <span className="text-xl">📦</span>
                            </div>
                            <h3 className="font-bold text-text-primary text-lg mb-2">
                              {item.title}
                            </h3>
                            <p className="text-sm text-text-secondary">{item.description}</p>
                          </div>
                        );
                      })
                    : category.items.map((perk) => (
                        <PerkCard
                          key={perk.id}
                          perk={perk}
                          copiedCodeId={copiedCodeId}
                          onCopyCode={handleCopyCode}
                          onClaimOffer={handleClaimOffer}
                          getCategoryBadgeColor={getCategoryBadgeColor}
                        />
                      ))}
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

interface PerkCardProps {
  perk: Perk;
  copiedCodeId: string | null;
  onCopyCode: (code: string, perkId: string) => void;
  onClaimOffer: (link: string) => void;
  getCategoryBadgeColor: (category: string) => string;
}

function PerkCard({
  perk,
  copiedCodeId,
  onCopyCode,
  onClaimOffer,
  getCategoryBadgeColor,
}: PerkCardProps) {
  const [tutorialDialogOpen, setTutorialDialogOpen] = useState(false);
  const isCopied = copiedCodeId === perk.id;
  const iconSourceUrl = perk.iconUrl || perk.link;
  const iconInfo = IconService.getIconInfo(iconSourceUrl, perk.platform);
  const hasWatermarkIcon = !iconInfo.isDefault;
  const hasTutorial = perk.tutorialImage || perk.tutorialLink;

  const handleTutorialClick = () => {
    if (perk.tutorialImage) {
      setTutorialDialogOpen(true);
    } else if (perk.tutorialLink) {
      openSafeExternalUrl(perk.tutorialLink!);
    }
  };

  return (
    <div className="group bg-bg-primary border border-border-color rounded-lg shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
      {/* Top Border Stripe - Brand Accent */}
      <div
        className="h-1 w-full"
        style={{
          backgroundColor: perk.color,
        }}
      />

      {/* Watermark background icon */}
      {hasWatermarkIcon && (
        <img
          src={iconInfo.iconUrl}
          alt=""
          className="absolute -bottom-12 -right-10 w-44 h-44 opacity-[0.1] rotate-12 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:opacity-[0.16] z-0 pointer-events-none select-none grayscale group-hover:grayscale-0"
        />
      )}

      {/* Card Content */}
      <div className="relative z-10 p-5 flex flex-col flex-1">
        {/* Header Row 1: Platform Name + Category Badge */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Brand Icon - 使用通用图标组件 */}
            <ResourceIcon 
              url={perk.iconUrl || perk.link}
              name={perk.platform}
              size={40}
              rounded={true}
            />
            {/* Platform Name */}
            <h3 className="font-bold text-text-primary text-base leading-tight">
              {perk.platform}
            </h3>
          </div>
          <Badge
            variant="outline"
            className={`text-xs shrink-0 ${getCategoryBadgeColor(perk.category)} border-current`}
          >
            {perk.category === "Crypto"
              ? "加密货币"
              : perk.category === "Banking"
              ? "银行服务"
              : perk.category === "Stocks"
              ? "股票交易"
              : perk.category === "VirtualCard"
              ? "虚拟 U 卡"
              : "链上钱包"}
          </Badge>
        </div>

        {/* Row 2: Benefit + Description */}
        <div className="mb-4">
          <p className="text-lg font-bold text-text-primary mb-1 leading-tight">
            {perk.benefit}
          </p>
          <p className="text-xs text-text-secondary line-clamp-1">
            {perk.description}
          </p>
        </div>

        {/* Row 3: Action Area - Compact Footer (Pushed to Bottom) */}
        <div className={`mt-auto flex flex-col gap-2 ${!perk.code ? "pt-2" : ""}`}>
          {/* Code Section - Compact */}
          {perk.code && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300 whitespace-nowrap shrink-0">
                  折扣邀请码
              </span>
              <div className="flex-1 min-w-0 bg-bg-secondary rounded-md flex justify-between items-center px-3 py-1.5 border border-slate-200/70 dark:border-slate-700/70">
                <span className="text-sm font-mono text-text-primary truncate">
                  {perk.code}
                </span>
                <button
                  onClick={() => onCopyCode(perk.code!, perk.id)}
                  className="text-text-muted hover:text-text-primary transition-colors"
                  aria-label="复制邀请码"
                >
                  {isCopied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons - Side by Side */}
          <div className="flex items-center gap-2">
            {/* Main CTA Button */}
            <Button
              onClick={() => onClaimOffer(perk.link)}
              className="flex-1 h-9 bg-yellow-400 dark:bg-yellow-500 text-black hover:bg-yellow-500 dark:hover:bg-yellow-600 font-semibold text-sm"
            >
              立即领取
              <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
            </Button>

            {/* Tutorial Button - 图片弹窗 或 链接新窗口 */}
            {hasTutorial && (
              <Button
                onClick={handleTutorialClick}
                variant="outline"
                className="h-9 px-3 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 font-medium text-sm whitespace-nowrap"
              >
                <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                查看教程
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 教程图片弹窗 */}
      {perk.tutorialImage && (
        <Dialog open={tutorialDialogOpen} onOpenChange={setTutorialDialogOpen}>
          <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-auto p-0">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle>{perk.platform} - 教程</DialogTitle>
            </DialogHeader>
            <div className="p-4 pt-2">
              <img
                src={perk.tutorialImage}
                alt={`${perk.platform} 教程`}
                className="w-full h-auto min-w-0 rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
