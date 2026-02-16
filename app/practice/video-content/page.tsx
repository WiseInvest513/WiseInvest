"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { Calendar, ExternalLink, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { getSafeExternalUrl, openSafeExternalUrl } from "@/lib/security/external-links";

// 视频分类（根据实际数据提取）
const videoCategories = ["赚钱", "投资", "虚拟 U 卡", "出入金", "alpha", "港卡", "美股", "券商"];

// 视频数据
interface Video {
  id: number;
  title: string;
  date: string;
  youtubeLink: string;
  category: string; // 支持多个分类，用逗号分隔
}

const videoData: Video[] = [
  {
    id: 16,
    title: "2026 年全网最全最详细致富证券开户教程、国内用户仅凭身份证即可完成开户、国内用户可使用的香港券商，成立 46 年，46年港资零售券商No.1！",
    date: "2026-02-15",
    youtubeLink: "https://youtu.be/pCsQo_aIrWk?si=-4ePntuEPlUEGWAb",
    category: "券商",
  },
  {
    id: 13,
    title: "2026 年全网最全最详细 SafePal 入金盈透、众安入金盈透、入金盈透教程、虚拟 U 卡入金盈透、港卡入金盈透教程，无港卡入金最全解决方案，再不用担心无法投资美股了",
    date: "2026-01-11",
    youtubeLink: "https://youtu.be/6NoGmOejUsI?si=AZi1IyDsQgSHWJdi",
    category: "出入金",
  },
  {
    id: 14,
    title: "2026 年全网最全最详细 港卡绑定微信在国内消费、港卡绑定、港卡国内消费、众安绑定微信支付、众安绑卡、出金详细教程、港卡出金详细流程、超低手续费完成港卡中资金的国内消费、港卡消费教程！",
    date: "2026-01-20",
    youtubeLink: "https://youtu.be/GG5qdaUgScc?si=LAKhCsdqxmh1NJ2a",
    category: "出入金",
  },
  {
    id: 15,
    title: "2026 年全网最全最详细 Bitget 虚拟 U 卡入金盈透教程｜盈透入金教程｜虚拟 U 卡入金盈透｜券商入金教程，最快四小时即可到账、没有港卡入金盈透最佳选择、加密入金券商最佳选择！",
    date: "2026-02-08",
    youtubeLink: "https://youtu.be/9ji8KUh9ojs?si=VwFzDGHpX4nxMMP4",
    category: "出入金",
  },
  {
    id: 1,
    title: "2026 年全网最新最全领取推特创作者激励｜X 认证｜Stripe 认证｜X 开通创作收益｜推特创作者收益｜领取推特创作者收益｜推特创作者收益计划",
    date: "2026-01-15",
    youtubeLink: "https://youtu.be/h50rjDBiTIg",
    category: "赚钱",
  },
  {
    id: 2,
    title: "2025 年全网最全最详细Wise身份证注册开通教程、Wise 注册+激活全流程、仅凭身份证即可开通港户最全教程、打通我们转账不便的围墙、帮助我们进行快速的资金流转！",
    date: "2026-01-10",
    youtubeLink: "https://youtu.be/BB7KtDfbXsU",
    category: "投资",
  },
  {
    id: 3,
    title: "2025 年全网最全最详细 SafePal 出金国内银行卡教程、帮助我们打通 web2 和 web3 的不便捷性，SafaPal出金国内银行卡，SafePal出金教程！",
    date: "2026-01-05",
    youtubeLink: "https://youtu.be/WWZiufXWkqE",
    category: "虚拟 U 卡,出入金",
  },
  {
    id: 4,
    title: "2025 年全网最全最详细的 SafePal 虚拟 U卡开设教程｜官方认证推荐小白开卡必看视频、开卡即免费赠送价值 350 元冷钱包，无开卡费用与无年费｜币圈/出海/订购海外优秀产品必备神卡",
    date: "2025-12-28",
    youtubeLink: "https://youtu.be/1Lw8VssYFNE",
    category: "虚拟 U 卡",
  },
  {
    id: 5,
    title: "2025 年全网最全最详细的 Bitget 虚拟 U卡开设教程｜全网首个零费率虚拟 U 卡，无开卡费用、无充值与消费手续费、无年费｜币圈/出海/订购海外优秀产品必备神卡，开卡即可领取 5u 空投奖励！",
    date: "2025-12-21",
    youtubeLink: "https://youtu.be/ZxElS0gVpY4",
    category: "虚拟 U 卡",
  },
  {
    id: 6,
    title: "存款小于 20 万&月薪低于 8K 应该如何在 web3通过结构化优势赚钱，我们普通人无法实现财富跃迁的根本原因是什么？如果你想要在 26 年有一个清晰的努力方向，那本期视频或许会给你一个答案！",
    date: "2025-12-14",
    youtubeLink: "https://youtu.be/2_Dar77OX5M",
    category: "赚钱",
  },
  {
    id: 7,
    title: "2025 年全网最全最详细币安 alpha教程、欧易 Boost 教程，币安 alpha 空投教程、欧易 Boost 空投教程，币安 alpha&欧易 Boost 是否真的还能够赚钱？本期视频给你答案",
    date: "2025-12-07",
    youtubeLink: "https://youtu.be/frRapUcAFPI",
    category: "alpha",
  },
  {
    id: 8,
    title: "2025 年全网最详细币安 alpha 刷交易量教程，可通过磨损控制在 2U 的情况下刷到 3w 交易量、币安 alpha 教程、币安、币安alpha、币安空投、币安教程、刷 alpha 教程。",
    date: "2025-11-30",
    youtubeLink: "https://youtu.be/bRWxDaZepJQ",
    category: "alpha",
  },
  {
    id: 9,
    title: "2025 年全网最全最详细开通天星、众安、蚂蚁银行教程，港美股投资推荐、实体卡&虚拟卡需别、你为什么需要一张虚拟港卡、天星银行开卡、众安银行开卡、蚂蚁银行开卡教程，汇丰银行、中银香港银行开卡教程",
    date: "2025-11-23",
    youtubeLink: "https://youtu.be/wqMChW__dyk",
    category: "港卡",
  },
  {
    id: 10,
    title: "2025 年全网最全最详细开通汇丰银行、中银香港银行教程，港美股投资推荐、入港最全最详细教程，一站式解决你从无到有开港卡教程，小白办理港卡教程，最详细的开港卡教程，汇丰香港开户，中银香港开户教程。",
    date: "2025-11-16",
    youtubeLink: "https://youtu.be/8zzn-IHIBIk",
    category: "港卡",
  },
  {
    id: 11,
    title: "2025 年全网最全最详细Ifast入金盈透，Ifast 入金长桥，Ifast 入金盈立最全教程，可无损入金长桥盈透&盈立，无港卡投资港美股的最佳选择，大陆用户仅身份证即可开设投资港美股盈立证券",
    date: "2025-11-09",
    youtubeLink: "https://youtu.be/o94W7r8M2kY",
    category: "投资,美股",
  },
  {
    id: 12,
    title: "2025 年全网最全最详细 0 门槛英国 Ifast数字银行开户教程，替代港卡的最佳选择，支持大陆银行卡无痕入金。兴业银行入金 Ifast 最全最详细教程，可无损入金港美股券商。港美股券商入金首选",
    date: "2025-11-02",
    youtubeLink: "https://youtu.be/2LcPWwwMSqw",
    category: "投资",
  },
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // 按时间倒序排列

export default function VideoContentPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeRowId, setActiveRowId] = useState<number | null>(null);
  const activeRowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (activeRowTimerRef.current) clearTimeout(activeRowTimerRef.current);
    };
  }, []);

  // 筛选逻辑（支持多分类）
  const filteredVideos = useMemo(() => {
    return videoData.filter((video) => {
      const matchesSearch =
        searchQuery === "" ||
        video.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 支持多分类筛选（用逗号分隔）
      const videoCategories = video.category.split(",").map((c) => c.trim());
      const matchesCategory =
        selectedCategory === null || videoCategories.includes(selectedCategory);
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // 分页逻辑
  const totalPages = Math.ceil(filteredVideos.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedVideos = filteredVideos.slice(startIndex, endIndex);

  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery !== "" || selectedCategory !== null;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-2 md:py-3">
        {/* Header - Centered */}
        <div className="mb-2">
          <Link
            href="/practice"
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-2"
          >
            ← 返回实践主页
          </Link>
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-1">
              <img
                src="https://cdn.simpleicons.org/youtube/FF0000"
                alt="YouTube"
                className="w-8 h-8"
              />
              <h1 className="font-serif text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
                视频内容
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">
              每周一期的 YouTube 视频内容，分享投资策略、市场分析和实战经验
            </p>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-4 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索视频标题..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-600 dark:text-slate-400">分类筛选：</span>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                selectedCategory === null
                  ? "bg-yellow-400/95 dark:bg-yellow-500 text-slate-900 dark:text-slate-900 font-bold shadow-[0_10px_18px_-12px_rgba(245,158,11,0.95)] ring-1 ring-yellow-300/90 [transform:translateY(-2px)]"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 hover:[transform:translateY(-2px)] hover:shadow-[0_10px_18px_-12px_rgba(15,23,42,0.55)]"
              }`}
            >
              全部
            </button>
            {videoCategories.map((category) => {
              const isSelected = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? "bg-yellow-400/95 dark:bg-yellow-500 text-slate-900 dark:text-slate-900 font-bold shadow-[0_10px_18px_-12px_rgba(245,158,11,0.95)] ring-1 ring-yellow-300/90 [transform:translateY(-2px)]"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 hover:[transform:translateY(-2px)] hover:shadow-[0_10px_18px_-12px_rgba(15,23,42,0.55)]"
                  }`}
                >
                  {category}
                </button>
              );
            })}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 px-2 py-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                <span>清除筛选</span>
              </button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            找到 <span className="font-semibold text-slate-900 dark:text-slate-50">{filteredVideos.length}</span> 个视频
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">每页显示：</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors"
            >
              <option value={10}>10 条</option>
              <option value={20}>20 条</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white dark:bg-slate-950 hover:bg-white dark:hover:bg-slate-950 border-b border-gray-100 dark:border-slate-800">
                  <TableHead className="w-32 font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950">
                    发布日期
                  </TableHead>
                  <TableHead className="w-auto font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950">
                    视频标题
                  </TableHead>
                  <TableHead className="w-32 font-semibold text-slate-500 dark:text-slate-400 text-center bg-white dark:bg-slate-950">
                    分类
                  </TableHead>
                  <TableHead className="w-32 font-semibold text-slate-500 dark:text-slate-400 text-center bg-white dark:bg-slate-950">
                    操作
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedVideos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="p-0">
                      <EmptyState
                        icon={Search}
                        title="暂无相关内容"
                        description="没有找到匹配的视频，试试切换其他分类或修改搜索关键词？"
                        action={hasActiveFilters ? { label: "重置筛选", onClick: clearFilters } : undefined}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedVideos.map((video, index) => {
                    const isEven = index % 2 === 0;
                    const isActiveRow = activeRowId === video.id;
                    const handleRowClick = () => {
                      if (activeRowTimerRef.current) {
                        clearTimeout(activeRowTimerRef.current);
                      }
                      setActiveRowId(video.id);
                      activeRowTimerRef.current = setTimeout(() => {
                        setActiveRowId(null);
                      }, 1100);
                      openSafeExternalUrl(video.youtubeLink);
                    };
                    return (
                      <TableRow
                        key={video.id}
                        onClick={handleRowClick}
                        className={`group cursor-pointer transition-all duration-200 ${
                          isEven ? "bg-white dark:bg-slate-900" : "bg-slate-50/80 dark:bg-slate-900/70"
                        } ${
                          isActiveRow
                            ? "bg-amber-50/65 dark:bg-amber-900/15 [transform:translateY(-2px)] shadow-[0_12px_26px_-18px_rgba(245,158,11,0.9)]"
                            : "hover:bg-amber-50/40 dark:hover:bg-slate-800/70 hover:[transform:translateY(-2px)] hover:shadow-[0_10px_22px_-16px_rgba(15,23,42,0.45)]"
                        } active:[transform:translateY(-1px)] ${
                          index !== paginatedVideos.length - 1 ? "border-b border-slate-200/80 dark:border-slate-800" : ""
                        }`}
                      >
                        {/* Date Column */}
                        <TableCell className="w-32 py-3 border-r border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="font-mono text-sm text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                              {video.date}
                            </span>
                          </div>
                        </TableCell>

                        {/* Title Column */}
                        <TableCell className="w-auto py-3 border-r border-slate-200 dark:border-slate-700">
                          <h3 className="font-semibold text-[15px] text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                            {video.title}
                          </h3>
                        </TableCell>

                        {/* Category Column */}
                        <TableCell className="w-32 py-3 border-r border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            {video.category.split(",").map((cat, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                              >
                                {cat.trim()}
                              </span>
                            ))}
                          </div>
                        </TableCell>

                        {/* Action Column */}
                        <TableCell className="w-32 py-3">
                          <div className="flex items-center justify-center">
                            <a
                              href={getSafeExternalUrl(video.youtubeLink)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors group-hover:text-amber-700 dark:group-hover:text-amber-300"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>观看</span>
                            </a>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              显示第 {startIndex + 1} - {Math.min(endIndex, filteredVideos.length)} 条，共{" "}
              {filteredVideos.length} 条
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-500 dark:text-slate-400 px-4">
                第 {currentPage} / {totalPages} 页
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
