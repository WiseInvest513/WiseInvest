"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Eye, FileSearch, Network, Search, Flame } from "lucide-react";
import { tweets, type Tweet } from "@/lib/data";
import { getSafeExternalUrl, openSafeExternalUrl } from "@/lib/security/external-links";
import { toast } from "sonner";
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

  const handleKnowledgeGraphClick = () => {
    toast.info("知识图谱功能还在开发中，敬请期待…");
  };

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
      const tweetCategories = tweet.category.split(",").map((c) => c.trim());
      const topicMatch =
        selectedTopics.length === 0 ||
        selectedTopics.some((topic) => tweetCategories.includes(topic));

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
    const firstType = type.split(",")[0].trim();
    if (firstType === "干货") {
      return "bg-amber-100 text-amber-800 dark:bg-amber-400/20 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-400/30";
    }
    if (firstType === "教程") {
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-400/20 dark:text-yellow-300 ring-1 ring-yellow-200 dark:ring-yellow-400/30";
    }
    if (firstType === "资讯") {
      return "bg-sky-100 text-sky-700 dark:bg-sky-900/35 dark:text-sky-300 ring-1 ring-sky-200 dark:ring-sky-400/30";
    }
    return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700";
  };

  const getTopicBadgeStyle = (topic: string) => {
    const firstCategory = topic.split(",")[0].trim();
    if (firstCategory === "web3" || firstCategory === "基金指数") {
      return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 ring-1 ring-sky-200 dark:ring-sky-400/30";
    }
    if (firstCategory === "美股") {
      return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-400/30";
    }
    if (firstCategory === "定投") {
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-400/30";
    }
    return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700";
  };

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const renderHighlightedTitle = (title: string) => {
    const keyword = searchQuery.trim();
    if (!keyword) return title;

    const regex = new RegExp(`(${escapeRegExp(keyword)})`, "ig");
    const parts = title.split(regex);

    return parts.map((part, idx) => {
      const isMatch = part.toLowerCase() === keyword.toLowerCase();
      if (!isMatch) return <span key={idx}>{part}</span>;
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
      if (activeRowTimerRef.current) clearTimeout(activeRowTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const maxViews = useMemo(() => Math.max(...tweets.map((t) => t.views)), []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #94a3b8 1.5px, transparent 1.5px)", backgroundSize: "22px 22px", opacity: 0.45 }} />
      <div className="max-w-[1520px] mx-auto flex items-start gap-4 relative px-4 md:px-6 pt-2">

        {/* --- LEFT SIDEBAR --- */}
        <aside className="w-52 shrink-0 sticky top-20 pt-6 self-start max-h-[calc(100vh-80px)] overflow-y-auto hidden md:block scrollbar-hide">
          <div className="px-3 py-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">

            {/* 推文分类 */}
            <div className="mb-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 px-1">
                推文分类
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {topics.map((topic) => {
                  const isSelected = selectedTopics.includes(topic);
                  return (
                    <button
                      key={topic}
                      onClick={() => toggleTopic(topic)}
                      className={`w-full text-center py-1.5 text-xs rounded-full transition-all duration-200 font-medium ${
                        isSelected
                          ? "bg-amber-400 dark:bg-amber-500 text-slate-900 shadow-sm ring-1 ring-amber-300 dark:ring-amber-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 分隔线 */}
            <div className="border-t border-slate-100 dark:border-slate-800 mb-5" />

            {/* 推文类型 */}
            <div className="mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 px-1">
                推文类型
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {formats.map((format) => {
                  const isSelected = selectedFormats.includes(format);
                  return (
                    <button
                      key={format}
                      onClick={() => toggleFormat(format)}
                      className={`w-full text-center py-1.5 text-xs rounded-full transition-all duration-200 font-medium ${
                        isSelected
                          ? "bg-amber-400 dark:bg-amber-500 text-slate-900 shadow-sm ring-1 ring-amber-300 dark:ring-amber-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200"
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
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors"
              >
                <X className="h-3 w-3" />
                清除筛选
              </button>
            )}
          </div>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 min-w-0 flex flex-col">
          <div className="pt-6 pb-20">

            {/* 整合卡片：header + table */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">

              {/* 顶部工具栏 */}
              <div className="px-5 md:px-6 py-4 flex items-center justify-between gap-4 flex-wrap border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 flex-wrap">
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                      Investment Insights
                    </h1>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      共 <span className="font-semibold text-slate-600 dark:text-slate-300">{filteredTweets.length}</span> 篇文章
                    </p>
                  </div>

                  {/* 搜索框 */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="检索文章标题..."
                      className="h-8 w-52 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-8 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                    />
                  </div>

                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 dark:hover:text-red-400 px-2 py-1 rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <X className="h-3 w-3" />
                      清除筛选
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* 知识图谱 — ghost 样式 */}
                  <button
                    type="button"
                    onClick={handleKnowledgeGraphClick}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 hover:border-amber-300 dark:hover:border-amber-600 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  >
                    <Network className="w-3.5 h-3.5" />
                    知识图谱
                  </button>

                  {/* 每页显示 */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400 dark:text-slate-500">每页</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-full text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                    <span className="text-xs text-slate-400 dark:text-slate-500">条</span>
                  </div>
                </div>
              </div>

              {/* 表头 + 表体合并为一个 Table */}
              <div className="w-full overflow-x-auto scrollbar-hide">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-slate-50/80 dark:bg-slate-900/80">
                      <TableHead className="w-36 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                        日期
                      </TableHead>
                      <TableHead className="py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                        文章标题
                      </TableHead>
                      <TableHead className="w-52 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-right border-b border-slate-100 dark:border-slate-800">
                        赛道 / 类型
                      </TableHead>
                      <TableHead className="w-36 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-right pr-6 border-b border-slate-100 dark:border-slate-800">
                        浏览量
                      </TableHead>
                    </TableRow>
                  </TableHeader>
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
                        const isHot = tweet.views > 5000;
                        const isActiveRow = activeRowId === tweet.id;
                        const viewPercent = Math.min(100, Math.round((tweet.views / maxViews) * 100));

                        const handleRowClick = () => {
                          if (activeRowTimerRef.current) clearTimeout(activeRowTimerRef.current);
                          setActiveRowId(tweet.id);
                          activeRowTimerRef.current = setTimeout(() => setActiveRowId(null), 1100);
                          openSafeExternalUrl(tweet.link);
                        };

                        return (
                          <TableRow
                            key={tweet.id}
                            onClick={handleRowClick}
                            className={`group cursor-pointer transition-all duration-200 ${
                              index % 2 === 0
                                ? "bg-white dark:bg-slate-900"
                                : "bg-slate-50/60 dark:bg-slate-900/50"
                            } ${
                              isActiveRow
                                ? "bg-amber-50 dark:bg-amber-900/10"
                                : "hover:bg-amber-50/50 dark:hover:bg-slate-800/60"
                            } ${
                              index !== paginatedTweets.length - 1
                                ? "border-b border-slate-100 dark:border-slate-800/80"
                                : ""
                            } ${isHot ? "border-l-2 border-l-amber-400" : "border-l-2 border-l-transparent"}`}
                          >
                            {/* 日期 */}
                            <TableCell className="w-36 py-4 pl-4">
                              <span className="font-mono text-xs text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                                {tweet.date}
                              </span>
                            </TableCell>

                            {/* 标题 */}
                            <TableCell className="py-4 max-w-0">
                              <span className="block truncate font-semibold text-[15px] text-slate-800 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                                {renderHighlightedTitle(tweet.title)}
                              </span>
                            </TableCell>

                            {/* 标签 */}
                            <TableCell className="w-52 py-4">
                              <div className="flex items-center gap-1.5 justify-end flex-wrap">
                                {tweet.category.split(",").map((cat, idx) => (
                                  <span
                                    key={idx}
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${getTopicBadgeStyle(cat.trim())}`}
                                  >
                                    {cat.trim()}
                                  </span>
                                ))}
                                {tweet.type.split(",").map((type, idx) => (
                                  <span
                                    key={idx}
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${getFormatBadgeStyle(type.trim())}`}
                                  >
                                    {type.trim()}
                                  </span>
                                ))}
                              </div>
                            </TableCell>

                            {/* 浏览量 */}
                            <TableCell className="w-36 py-4 pr-6">
                              <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-1">
                                  {isHot ? (
                                    <Flame className="h-3.5 w-3.5 text-orange-400" />
                                  ) : (
                                    <Eye className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                                  )}
                                  <span className={`text-xs font-mono font-medium ${isHot ? "text-orange-500 dark:text-orange-400" : "text-slate-500 dark:text-slate-400"}`}>
                                    {tweet.views >= 1000
                                      ? `${(tweet.views / 1000).toFixed(1)}k`
                                      : tweet.views}
                                  </span>
                                </div>
                                {/* 进度条 */}
                                <div className="w-16 h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${isHot ? "bg-gradient-to-r from-amber-400 to-orange-400" : "bg-slate-300 dark:bg-slate-600"}`}
                                    style={{ width: `${viewPercent}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="px-5 md:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    第 {startIndex + 1}–{Math.min(endIndex, filteredTweets.length)} 条，共 {filteredTweets.length} 条
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-slate-500 dark:text-slate-400 px-3 tabular-nums">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </main>

      </div>
    </div>
  );
}
