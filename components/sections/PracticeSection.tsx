"use client";

import { useRef, useState } from "react";
import { ExternalLink, TrendingUp, Play, BookOpen, Gift, Calendar, ArrowRight, ChevronDown } from "lucide-react";
import { ParallaxBackground } from "@/components/motion/ParallaxBackground";
import { TitleAnimation } from "@/components/motion/SectionWrapper";
import { getSafeExternalUrl, openSafeExternalUrl } from "@/lib/security/external-links";

// Mock data - 投资实验数据
const investmentLabData = [
  {
    id: 1,
    date: "2025-01-15",
    asset: "BTC",
    cost: 45000,
    currentPrice: 52000,
    roi: 15.56,
    tweetLink: "https://x.com/WiseInvest513/status/1997570298619871243",
  },
  {
    id: 2,
    date: "2025-01-10",
    asset: "ETH",
    cost: 2800,
    currentPrice: 3200,
    roi: 14.29,
    tweetLink: "https://x.com/WiseInvest513/status/1996424028467388817",
  },
  {
    id: 3,
    date: "2025-01-05",
    asset: "BTC",
    cost: 44000,
    currentPrice: 52000,
    roi: 18.18,
    tweetLink: "#",
  },
];

// Mock data - 视频动态
const videoData = [
  {
    id: 1,
    title: "2025年投资策略：如何构建稳健的投资组合",
    description: "深度解析资产配置、风险管理和长期投资策略",
    date: "2025-01-12",
    thumbnail: "/api/placeholder/400/225",
    youtubeLink: "https://youtube.com/watch?v=example1",
  },
  {
    id: 2,
    title: "Web3 投资入门：从零开始理解加密货币",
    description: "适合新手的 Web3 投资指南，涵盖基础知识与实战技巧",
    date: "2025-01-05",
    thumbnail: "/api/placeholder/400/225",
    youtubeLink: "https://youtube.com/watch?v=example2",
  },
  {
    id: 3,
    title: "宏观经济分析：2025年市场展望",
    description: "通胀、利率与资产配置的深度解读",
    date: "2024-12-28",
    thumbnail: "/api/placeholder/400/225",
    youtubeLink: "https://youtube.com/watch?v=example3",
  },
];

// Mock data - 人生作弊指南
const lifeCheatSheetData = [
  {
    id: 1,
    title: "Wise 身份认证注册开卡",
    category: "工具",
    conclusion: "免费获得 Wise 多币种账户，支持全球转账",
    tweetLink: "https://x.com/WiseInvest513/status/1996859457494737003",
  },
  {
    id: 2,
    title: "Gemini 免费白嫖一年",
    category: "生产力",
    conclusion: "通过特定渠道可获得 Gemini Pro 一年免费使用权",
    tweetLink: "#",
  },
  {
    id: 3,
    title: "Bitget 新用户活动参与策略",
    category: "Web3",
    conclusion: "每期活动平均可获得 $50-200 等值代币奖励",
    tweetLink: "#",
  },
];

// Mock data - Bitget 一期一会
const bitgetData = [
  {
    id: 1,
    period: 15,
    keywords: ["新用户", "BTC", "ETH"],
    deadline: "2025-01-31",
    status: "active",
    link: "https://bitget.com/promotion/15",
  },
  {
    id: 2,
    period: 14,
    keywords: ["新用户", "SOL"],
    deadline: "2025-01-15",
    status: "ended",
    link: "#",
  },
  {
    id: 3,
    period: 13,
    keywords: ["新用户", "BNB"],
    deadline: "2024-12-31",
    status: "ended",
    link: "#",
  },
];

export function PracticeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [expandedCheat, setExpandedCheat] = useState<number | null>(null);

  return (
    <section
      id="practice"
      ref={sectionRef}
      className="container mx-auto px-4 py-12 md:py-16 relative isolate w-full"
    >
      {/* Radial Glow Background - 智慧蓝与琥珀金交织 */}
      <div
        className="absolute inset-0 -z-10 opacity-30 dark:opacity-20"
        style={{
          background: `
            radial-gradient(at 20% 30%, rgba(59, 130, 246, 0.3) 0px, transparent 50%),
            radial-gradient(at 80% 70%, rgba(251, 191, 36, 0.4) 0px, transparent 50%),
            radial-gradient(at 50% 50%, rgba(59, 130, 246, 0.2) 0px, transparent 50%)
          `,
        }}
      />

      {/* Grain Texture */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.02] dark:opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      <ParallaxBackground sectionRef={sectionRef} parallaxSpeed={0.15} />

      {/* Section Title - Enhanced Priority */}
      <div className="mb-10 md:mb-12">
        <TitleAnimation>
          <h2 className="font-serif text-4xl md:text-5xl font-extrabold text-center text-slate-900 dark:text-white tracking-tight relative inline-block w-full">
            <span className="relative inline-block">
              实践
              <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-60" />
            </span>
          </h2>
          <p className="text-center text-slate-600 dark:text-slate-400 mt-4 text-sm md:text-base max-w-2xl mx-auto">
            社会性实践实验室 · 展示真实的投资实验、视频更新、人生策略与平台活动
          </p>
        </TitleAnimation>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto relative z-10">
        {/* Module A: 投资实验 (Primary - 最大模块) */}
        <div className="lg:col-span-2 lg:row-span-2">
          <div className="h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-2xl border border-white/20 dark:border-slate-800/50 shadow-xl p-6 md:p-8 hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] relative overflow-hidden group">
            {/* Refraction Effect on Hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-transparent to-blue-500/10" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-slate-900 dark:text-white">
                  投资实验
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: 推文时间轴 */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    实验记录
                  </h4>
                  <div className="space-y-3">
                    {investmentLabData.map((item, index) => (
                      <a
                        key={item.id}
                        href={getSafeExternalUrl(item.tweetLink)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 rounded-lg bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 transition-all duration-200 hover:scale-[1.02] group/item"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                            {item.date}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">
                          定投 {item.asset}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Right: 实盘数据表 */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-4">
                    实盘数据
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-2 px-2 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                            日期
                          </th>
                          <th className="text-left py-2 px-2 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                            资产
                          </th>
                          <th className="text-right py-2 px-2 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                            成本
                          </th>
                          <th className="text-right py-2 px-2 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                            现价
                          </th>
                          <th className="text-right py-2 px-2 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                            收益率
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {investmentLabData.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                            onClick={() => openSafeExternalUrl(item.tweetLink)}
                          >
                            <td className="py-3 px-2 font-mono text-xs text-slate-600 dark:text-slate-400">
                              {item.date.split("-").slice(1).join("/")}
                            </td>
                            <td className="py-3 px-2 font-semibold text-slate-900 dark:text-white">
                              {item.asset}
                            </td>
                            <td className="py-3 px-2 text-right font-mono text-slate-700 dark:text-slate-300">
                              ${item.cost.toLocaleString()}
                            </td>
                            <td className="py-3 px-2 text-right font-mono text-slate-700 dark:text-slate-300">
                              ${item.currentPrice.toLocaleString()}
                            </td>
                            <td
                              className={`py-3 px-2 text-right font-bold font-mono ${
                                item.roi > 0
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-green-600 dark:text-green-400"
                              }`}
                            >
                              {item.roi > 0 ? "+" : ""}
                              {item.roi.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Module B: 视频动态 */}
        <div className="lg:col-span-2">
          <div className="h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-2xl border border-white/20 dark:border-slate-800/50 shadow-xl p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] relative overflow-hidden group">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-transparent to-blue-500/10" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <Play className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white">
                  视频动态
                </h3>
              </div>

              <div className="space-y-4">
                {videoData.map((video) => (
                  <a
                    key={video.id}
                    href={getSafeExternalUrl(video.youtubeLink)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group/video"
                  >
                    <div className="flex gap-4 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 transition-all duration-200 hover:scale-[1.02]">
                      {/* Thumbnail Placeholder */}
                      <div className="w-24 h-16 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center shrink-0 relative overflow-hidden">
                        <Play className="w-6 h-6 text-slate-400 dark:text-slate-500 absolute" />
                        <div className="absolute inset-0 bg-black/20 group-hover/video:bg-black/10 transition-colors" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-1 line-clamp-1">
                          {video.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 line-clamp-1">
                          {video.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                          <Calendar className="w-3 h-3" />
                          <span>{video.date}</span>
                          <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover/video:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Module C: 人生作弊指南 */}
        <div className="lg:col-span-1">
          <div className="h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-2xl border border-white/20 dark:border-slate-800/50 shadow-xl p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] relative overflow-hidden group">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-transparent to-blue-500/10" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white">
                  人生作弊指南
                </h3>
              </div>

              <div className="space-y-3">
                {lifeCheatSheetData.map((item) => (
                  <div
                    key={item.id}
                    className="border border-slate-200/50 dark:border-slate-700/50 rounded-lg overflow-hidden hover:border-amber-400/50 dark:hover:border-amber-500/50 transition-all duration-200"
                  >
                    <button
                      onClick={() =>
                        setExpandedCheat(expandedCheat === item.id ? null : item.id)
                      }
                      className="w-full p-3 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium">
                              {item.category}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                            {item.title}
                          </h4>
                          {expandedCheat === item.id && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                              {item.conclusion}
                            </p>
                          )}
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                            expandedCheat === item.id ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>
                    {expandedCheat === item.id && (
                      <div className="px-3 pb-3">
                        <a
                          href={getSafeExternalUrl(item.tweetLink)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium"
                        >
                          查看详细推文
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Module D: Bitget 一期一会 */}
        <div className="lg:col-span-1">
          <div className="h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-2xl border border-white/20 dark:border-slate-800/50 shadow-xl p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] relative overflow-hidden group">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-transparent to-blue-500/10" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white">
                  Bitget 一期一会
                </h3>
              </div>

              <div className="space-y-3">
                {bitgetData.map((item) => (
                  <a
                    key={item.id}
                    href={getSafeExternalUrl(item.link)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 rounded-lg bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 transition-all duration-200 hover:scale-[1.02] group/item"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-lg font-bold text-slate-900 dark:text-white">
                        第 {item.period} 期
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          item.status === "active"
                            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {item.status === "active" ? "火热进行中" : "已结束"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {item.keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3 h-3" />
                      <span>截止: {item.deadline}</span>
                      <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover/item:opacity-100 transition-opacity" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

