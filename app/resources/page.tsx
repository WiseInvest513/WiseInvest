"use client";

import { useState, useEffect } from "react";
import { resourceCategories, type ResourceCategory } from "@/lib/resources-data";
import { ResourceIcon } from "@/components/ui/resource-icon";
import { IconService } from "@/lib/icon-service";
import {
  Coins,
  TrendingUp,
  DollarSign,
  Shield,
  BarChart3,
  Activity,
  PiggyBank,
  Network,
  Database,
  Building2,
  Globe,
  Briefcase,
  Search,
  Eye,
  Wallet,
  Newspaper,
  FileText,
  BookOpen,
  Star,
  ExternalLink,
  ArrowUpRight,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { openSafeExternalUrl } from "@/lib/security/external-links";

// Icon mapping (used as fallback)
const iconMap: Record<string, LucideIcon> = {
  Coins,
  TrendingUp,
  DollarSign,
  Shield,
  BarChart3,
  Activity,
  PiggyBank,
  Network,
  Database,
  Building2,
  Globe,
  Briefcase,
  Search,
  Eye,
  Wallet,
  Newspaper,
  FileText,
  BookOpen,
  Star,
};

// Icon display priority:
// 1. Local cached favicon (fastest, most reliable)
// 2. Google favicon API (fallback)
// 3. Lucide icon (final fallback)

interface ResourceCardProps {
  resource: {
    name: string;
    desc: string;
    url: string;
    invitationLink?: string; // 邀请链接（用户点击时跳转，如果没有则使用 url）
    iconUrl?: string; // 图标 URL（用于获取图标，如果没有则使用 url）
    icon?: string;
    tag?: "Recommended" | "Official" | "Popular";
    rating: number;
  };
  rank?: number; // 1, 2, or 3 for top 3 ranking
}

function ResourceCard({ resource, rank }: ResourceCardProps) {
  // Get icon from iconMap, fallback to Coins if not found
  const Icon = resource.icon && iconMap[resource.icon] ? iconMap[resource.icon] : Coins;
  const iconSourceUrl = resource.iconUrl || resource.url;
  const iconInfo = IconService.getIconInfo(iconSourceUrl, resource.name);
  const hasWatermarkIcon = !iconInfo.isDefault;

  const handleClick = () => {
    // 优先使用 invitationLink，如果没有则使用 url
    const linkUrl = resource.invitationLink || resource.url;
    openSafeExternalUrl(linkUrl);
  };

  const getTagStyle = (tag?: string) => {
    if (tag === "Recommended") {
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300 text-[10px] px-2 py-0.5 rounded-full ml-2 font-medium";
    }
    return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded-full ml-2 font-medium";
  };

  const getTagLabel = (tag?: string) => {
    const labels: Record<string, string> = {
      Recommended: "推荐",
      Official: "官方",
      Popular: "热门",
    };
    return labels[tag || ""] || tag;
  };

  const getRankIcon = () => {
    if (rank === 1) return <Trophy className="w-4 h-4 text-yellow-500 fill-yellow-500" />;
    if (rank === 2) return <Trophy className="w-4 h-4 text-slate-400 fill-slate-400" />;
    if (rank === 3) return <Trophy className="w-4 h-4 text-orange-500 fill-orange-500" />;
    return null;
  };

  const getRankBadge = () => {
    if (rank === 1) return "No.1";
    if (rank === 2) return "No.2";
    if (rank === 3) return "No.3";
    return null;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400 fill-opacity-50" />
        );
      } else {
        stars.push(
          <Star key={i} className="w-3 h-3 text-slate-300 fill-slate-300 dark:text-slate-600 dark:fill-slate-600" />
        );
      }
    }
    return stars;
  };

  const isRank1 = rank === 1;

  return (
    <div
      onClick={handleClick}
      className={`border rounded-lg p-4 hover:border-yellow-400 hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer group relative overflow-hidden ${
        isRank1
          ? "bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800"
          : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
      }`}
    >
      {/* AboutMe 同款背景水印图标 */}
      {hasWatermarkIcon ? (
        <img
          src={iconInfo.iconUrl}
          alt=""
          className="absolute -bottom-6 -right-6 w-24 h-24 opacity-[0.06] rotate-12 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:opacity-[0.10] z-0 pointer-events-none select-none grayscale group-hover:grayscale-0 object-contain"
        />
      ) : (
        <div className="absolute -bottom-6 -right-6 w-24 h-24 opacity-[0.06] rotate-12 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:opacity-[0.10] z-0 pointer-events-none select-none grayscale group-hover:grayscale-0 flex items-center justify-center">
          <Icon className="w-16 h-16 text-slate-300" />
        </div>
      )}

      {/* External Link Icon - Top Right Corner */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-yellow-600" />
      </div>

      {/* Rank Badge - Top Left */}
      {rank && rank <= 3 && (
        <div className="absolute top-3 left-3 flex items-center gap-1">
          {getRankIcon()}
          {rank === 1 && (
            <span className="text-[10px] font-bold text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-500/20 px-1.5 py-0.5 rounded">
              {getRankBadge()}
            </span>
          )}
        </div>
      )}

      <div className="relative z-10 flex items-start">
        {/* Icon - 使用通用图标组件 */}
        <div className="mr-4 shrink-0">
          <ResourceIcon 
            url={resource.url}
            name={resource.name}
            iconUrl={resource.iconUrl}
            size={48}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-start gap-2 flex-wrap">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-tight group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors">
              {resource.name}
            </h3>
            {resource.tag && (
              <span className={getTagStyle(resource.tag)}>
                {getTagLabel(resource.tag)}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
            {resource.desc}
          </p>
          
          {/* Star Rating */}
          <div className="flex items-center gap-1 mt-2">
            {renderStars(resource.rating)}
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
              {resource.rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResourcesPage() {
  const [activeCategory, setActiveCategory] = useState<string>(
    resourceCategories[0]?.id || ""
  );

  // Handle smooth scroll and active category detection (Optimized with throttle)
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const sections = resourceCategories
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
            {resourceCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`directory-nav-button ${
                  activeCategory === category.id
                    ? "directory-nav-button-active directory-nav-active"
                    : ""
                }`}
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
                常用导航
              </h1>
              <p className="text-base text-slate-500 dark:text-slate-400">
                精选投资工具和资源，助您做出明智的投资决策
              </p>
            </div>
          </div>

          {/* 2. SCROLLABLE CONTENT */}
          <div className="content-fade-in px-6 md:px-8 pb-20 pt-6">
            {resourceCategories.map((category, index) => (
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
                    {category.items.length} 个资源
                  </p>
                </div>

                {/* Resource Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {category.items.map((resource, resourceIndex) => (
                    <ResourceCard
                      key={`${category.id}-${resourceIndex}`}
                      resource={resource}
                      rank={resourceIndex < 3 ? resourceIndex + 1 : undefined}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>

        </main>

      </div>
    </div>
  );
}

