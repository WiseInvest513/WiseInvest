"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Eye, FileSearch, Network, Search } from "lucide-react";
import { tweets, type Tweet } from "@/lib/data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";

export default function TweetsPage() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRowId, setActiveRowId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const activeRowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // 知识图谱外部链接 - localhost 地址
  // 外部服务可以通过 http://localhost:3002/api/tweets 获取所有推文数据
  const knowledgeGraphUrl = "http://localhost:3001";

  const topics = ["web3", "美股", "定投", "思考", "基金指数", "AI", "工具分享"];
  const formats = ["干货", "教程", "日常", "资讯"];

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
    setCurrentPage(1);
  };

  const toggleFormat = (format: string) => {
    setSelectedFormats((prev) =>
      prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format]
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedTopics([]);
    setSelectedFormats([]);
    setSearchQuery("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    selectedTopics.length > 0 || selectedFormats.length > 0 || searchQuery.trim().length > 0;

  const getFilteredTweets = (): Tweet[] => {
    return tweets.filter((tweet) => {
      // 支持多个分类（逗号分隔）
      const tweetCategories = tweet.category.split(",").map((c) => c.trim());
      const topicMatch =
        selectedTopics.length === 0 ||
        selectedTopics.some((topic) => tweetCategories.includes(topic));
      
      // 支持多个类型（逗号分隔）
      const tweetTypes = tweet.type.split(",").map((t) => t.trim());
      const formatMatch =
        selectedFormats.length === 0 ||
        selectedFormats.some((format) => tweetTypes.includes(format));

      const searchMatch =
        searchQuery.trim().length === 0 ||
        tweet.title.toLowerCase().includes(searchQuery.trim().toLowerCase());
      
      return topicMatch && formatMatch && searchMatch;
    });
  };

  const filteredTweets = useMemo(
    () => getFilteredTweets(),
    [selectedTopics, selectedFormats, searchQuery]
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredTweets.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTweets = filteredTweets.slice(startIndex, endIndex);

  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const getFormatBadgeStyle = (type: string) => {
    // 如果包含多个类型，使用第一个类型判断
    const firstType = type.split(",")[0].trim();
    if (firstType === "干货") {
      return "bg-yellow-400/95 text-black dark:bg-yellow-400 dark:text-black";
    }
    if (firstType === "教程") {
      return "bg-amber-300/95 text-amber-950 dark:bg-amber-300 dark:text-amber-950";
    }
    if (firstType === "资讯") {
      return "bg-sky-100 text-sky-700 dark:bg-sky-900/35 dark:text-sky-300";
    }
    return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  };

  const getTopicLabel = (topic: string) => {
    // 如果包含多个分类，显示第一个
    const firstCategory = topic.split(",")[0].trim();
    return firstCategory;
  };

  const getTopicBadgeStyle = (topic: string) => {
    const firstCategory = topic.split(",")[0].trim();
    if (firstCategory === "web3" || firstCategory === "基金指数") {
      return "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300";
    }
    if (firstCategory === "美股") {
      return "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300";
    }
    if (firstCategory === "定投") {
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    }
    return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  };

  const getFormatLabel = (format: string) => {
    // 如果包含多个类型，显示第一个
    const firstType = format.split(",")[0].trim();
    return firstType;
  };

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const renderHighlightedTitle = (title: string) => {
    const keyword = searchQuery.trim();
    if (!keyword) return title;

    const regex = new RegExp(`(${escapeRegExp(keyword)})`, "ig");
    const parts = title.split(regex);

    return parts.map((part, idx) => {
      const isMatch = part.toLowerCase() === keyword.toLowerCase();
      if (!isMatch) {
        return <span key={idx}>{part}</span>;
      }
      return (
        <mark
          key={idx}
          className="bg-yellow-200/80 dark:bg-yellow-500/30 text-inherit px-0.5 rounded-sm"
        >
          {part}
        </mark>
      );
    });
  };

  useEffect(() => {
    return () => {
      if (activeRowTimerRef.current) {
        clearTimeout(activeRowTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
      {/* Main Container */}
      <div className="max-w-[1520px] mx-auto flex items-start gap-4 relative px-4 md:px-6 pt-2">
        
        {/* --- LEFT SIDEBAR --- */}
        <aside className="w-52 shrink-0 sticky top-20 pt-6 self-start max-h-[calc(100vh-80px)] overflow-y-auto hidden md:block scrollbar-hide">
          <div className="px-2 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            
            {/* Group 1: 推文分类 */}
            <div className="mb-6">
              <h3 className="px-2 text-sm font-bold tracking-wide text-slate-900 dark:text-white mb-2 text-center">
                    推文分类
                  </h3>
              <div className="grid grid-cols-2 gap-2">
                    {topics.map((topic) => {
                      const isSelected = selectedTopics.includes(topic);
                      return (
                        <button
                          key={topic}
                          onClick={() => toggleTopic(topic)}
                      className={`w-full text-center py-2 text-xs rounded-md transition-all duration-200 ${
                            isSelected
                          ? "bg-yellow-400/95 dark:bg-yellow-500 text-slate-900 dark:text-slate-900 font-bold shadow-[0_10px_18px_-12px_rgba(245,158,11,0.95)] ring-1 ring-yellow-300/90 [transform:translateY(-2px)]"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 hover:[transform:translateY(-2px)] hover:shadow-[0_10px_18px_-12px_rgba(15,23,42,0.55)]"
                          }`}
                        >
                          {topic}
                        </button>
                      );
                    })}
                  </div>
                </div>

            {/* Group 2: 推文类型 */}
            <div className="mb-6">
              <h3 className="px-2 text-sm font-bold tracking-wide text-slate-900 dark:text-white mb-2 text-center">
                    推文类型
                  </h3>
              <div className="grid grid-cols-2 gap-2">
                    {formats.map((format) => {
                      const isSelected = selectedFormats.includes(format);
                      return (
                        <button
                          key={format}
                          onClick={() => toggleFormat(format)}
                      className={`w-full text-center py-2 text-xs rounded-md transition-all duration-200 ${
                            isSelected
                          ? "bg-yellow-400/95 dark:bg-yellow-500 text-slate-900 dark:text-slate-900 font-bold shadow-[0_10px_18px_-12px_rgba(245,158,11,0.95)] ring-1 ring-yellow-300/90 [transform:translateY(-2px)]"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 hover:[transform:translateY(-2px)] hover:shadow-[0_10px_18px_-12px_rgba(15,23,42,0.55)]"
                          }`}
                        >
                          {format}
                        </button>
                      );
                    })}
                  </div>
                </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-yellow-400 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                清除筛选
              </button>
            )}
            </div>
          </aside>

        {/* --- RIGHT CONTENT AREA --- */}
        <main className="flex-1 min-w-0 flex flex-col">
          
          {/* 1. HEADER (Sticky) */}
          <div className="pt-6 pb-3 transition-all">
            <div className="px-0 md:px-2">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="px-5 md:px-6 py-3.5 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Investment Insights
                  </h1>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    找到 <span className="font-semibold text-slate-900 dark:text-slate-50">{filteredTweets.length}</span> 篇文章
                  </span>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="检索文章标题..."
                      className="h-8 w-52 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 pl-8 pr-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    />
                  </div>
                  {/* Clear Filter Button */}
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 px-2 py-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>清除筛选</span>
                    </button>
                  )}
                  {/* Knowledge Graph Button - External Link */}
                  <a
                    href={knowledgeGraphUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-md shadow-sm transition-all"
                  >
                    <Network className="w-4 h-4" />
                    <span>知识图谱</span>
                  </a>
                </div>
                
                {/* Page Size Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">每页显示：</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-colors"
                  >
                    <option value={10}>10 条</option>
                    <option value={20}>20 条</option>
                  </select>
                </div>
              </div>

              {/* Table Header - Static */}
              <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-40 font-semibold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 bg-transparent">
                        发布日期
                      </TableHead>
                      <TableHead className="w-auto font-semibold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 bg-transparent">
                        文章标题
                      </TableHead>
                      <TableHead className="w-56 font-semibold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 text-right bg-transparent">
                        赛道/类型
                      </TableHead>
                      <TableHead className="w-32 font-semibold text-slate-500 dark:text-slate-400 text-center bg-transparent">
                        浏览量
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                </Table>
              </div>
              </div>
            </div>
          </div>

          {/* 2. SCROLLABLE LIST */}
          <div className="px-0 md:px-2 pb-20 pt-0">
            {/* Table Container - Body Only */}
            <div className="w-full overflow-x-auto scrollbar-hide">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden min-w-[800px]">
                <Table>
                  <TableBody>
                    {paginatedTweets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="p-0">
                          <EmptyState
                            icon={FileSearch}
                            title="暂无相关内容"
                            description="看起来我们还没有发布关于这个话题的洞察。试试切换其他赛道？"
                            action={hasActiveFilters ? { label: "重置筛选", onClick: clearFilters } : undefined}
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedTweets.map((tweet, index) => {
                        const isEven = index % 2 === 0;
                        const isActiveRow = activeRowId === tweet.id;
                        const handleRowClick = () => {
                          if (activeRowTimerRef.current) {
                            clearTimeout(activeRowTimerRef.current);
                          }
                          setActiveRowId(tweet.id);
                          activeRowTimerRef.current = setTimeout(() => {
                            setActiveRowId(null);
                          }, 1100);
                          if (tweet.link && tweet.link !== "#") {
                            window.open(tweet.link, "_blank", "noopener,noreferrer");
                          }
                        };
                        return (
                          <TableRow
                            key={tweet.id}
                            onClick={handleRowClick}
                            className={`group cursor-pointer transition-all duration-200 ${
                              isEven ? "bg-white dark:bg-slate-900" : "bg-slate-50/80 dark:bg-slate-900/70"
                            } ${
                              isActiveRow
                                ? "bg-amber-50/65 dark:bg-amber-900/15 [transform:translateY(-2px)] shadow-[0_12px_26px_-18px_rgba(245,158,11,0.9)]"
                                : "hover:bg-amber-50/40 dark:hover:bg-slate-800/70 hover:[transform:translateY(-2px)] hover:shadow-[0_10px_22px_-16px_rgba(15,23,42,0.45)]"
                            } active:[transform:translateY(-1px)] ${
                              index !== paginatedTweets.length - 1 ? "border-b border-slate-200/80 dark:border-slate-800" : ""
                            }`}
                          >
                            {/* Date Column */}
                            <TableCell className="w-40 py-3 border-r border-slate-200 dark:border-slate-700">
                              <span className="font-mono text-sm text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                                {tweet.date}
                              </span>
                            </TableCell>

                            {/* Title Column */}
                            <TableCell className="w-auto py-3 border-r border-slate-200 dark:border-slate-700">
                              <h3 className="font-semibold text-[15px] text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                                {renderHighlightedTitle(tweet.title)}
                              </h3>
                            </TableCell>

                            {/* Tags Column */}
                            <TableCell className="w-56 py-3 border-r border-slate-200 dark:border-slate-700">
                              <div className="flex items-center gap-2 justify-end flex-wrap">
                                {/* Topic Badges - 支持多个分类 */}
                                {tweet.category.split(",").map((cat, idx) => (
                                  <span
                                    key={idx}
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${getTopicBadgeStyle(
                                      cat.trim()
                                    )}`}
                                  >
                                    {cat.trim()}
                                  </span>
                                ))}
                                {/* Format Badges - 支持多个类型 */}
                                {tweet.type.split(",").map((type, idx) => (
                                  <span
                                    key={idx}
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${getFormatBadgeStyle(
                                      type.trim()
                                    )}`}
                                  >
                                    {type.trim()}
                                  </span>
                                ))}
                              </div>
                            </TableCell>

                            {/* Views Column */}
                            <TableCell className="w-32 py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Eye className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                  {tweet.views >= 1000
                                    ? `${(tweet.views / 1000).toFixed(1)}k`
                                    : tweet.views}
                                </span>
                                {tweet.views > 2000 && (
                                  <span className="text-xs">🔥</span>
                                )}
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  显示第 {startIndex + 1} - {Math.min(endIndex, filteredTweets.length)} 条，共{" "}
                  {filteredTweets.length} 条
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-slate-500 dark:text-slate-400 px-4">
                    第 {currentPage} / {totalPages} 页
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </main>

      </div>
    </div>
  );
}