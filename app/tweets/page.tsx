"use client";

import { useState, useMemo } from "react";
import { X, ChevronLeft, ChevronRight, Eye, FileSearch, Network } from "lucide-react";
import { tweets, type Tweet } from "@/lib/data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TweetsPage() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // 知识图谱外部链接 - localhost 地址
  // 外部服务可以通过 http://localhost:3002/api/tweets 获取所有推文数据
  const knowledgeGraphUrl = "http://localhost:3001";

  const topics = ["web3", "美股", "定投", "思考", "基金指数", "AI", "工具分享"];
  const formats = ["干货", "教程", "日常", "资讯"];
  const authors = ["巴菲特", "段永平"]; // 作者分类
  
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);

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
    setSelectedAuthor(null);
    setCurrentPage(1);
  };

  const hasActiveFilters = selectedTopics.length > 0 || selectedFormats.length > 0 || selectedAuthor !== null;

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
      
      // 作者筛选
      const authorMatch =
        selectedAuthor === null ||
        (tweet.author && tweet.author === selectedAuthor);
      
      return topicMatch && formatMatch && authorMatch;
    });
  };

  const filteredTweets = useMemo(() => getFilteredTweets(), [selectedTopics, selectedFormats, selectedAuthor]);

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
    if (firstType === "干货" || firstType === "教程") {
      return "bg-yellow-400 text-black";
    }
    return "bg-slate-100 text-slate-600";
  };

  const getTopicLabel = (topic: string) => {
    // 如果包含多个分类，显示第一个
    const firstCategory = topic.split(",")[0].trim();
    return firstCategory;
  };

  const getFormatLabel = (format: string) => {
    // 如果包含多个类型，显示第一个
    const firstType = format.split(",")[0].trim();
    return firstType;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Main Container */}
      <div className="max-w-[1600px] mx-auto flex items-start relative pt-0">
        
        {/* --- LEFT SIDEBAR --- */}
        <aside className="w-48 shrink-0 sticky top-16 pt-6 self-start max-h-[calc(100vh-64px)] overflow-y-auto border-r border-transparent hidden md:block scrollbar-hide">
          {/* 变化3: 增加内部 px-2 容器，而不是直接加在 aside 上 */}
          <div className="px-2">
            
            {/* Group 1: 推文分类 */}
            <div className="mb-6">
              <h3 className="px-2 text-base font-bold text-slate-900 dark:text-white mb-2 text-center">
                    推文分类
                  </h3>
              <div className="grid grid-cols-2 gap-2">
                    {topics.map((topic) => {
                      const isSelected = selectedTopics.includes(topic);
                      return (
                        <button
                          key={topic}
                          onClick={() => toggleTopic(topic)}
                      className={`w-full text-center py-2 text-xs rounded-md transition-all ${
                            isSelected
                          ? "bg-yellow-400 dark:bg-yellow-500 text-slate-900 dark:text-slate-900 font-bold shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
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
              <h3 className="px-2 text-base font-bold text-slate-900 dark:text-white mb-2 text-center">
                    推文类型
                  </h3>
              <div className="grid grid-cols-2 gap-2">
                    {formats.map((format) => {
                      const isSelected = selectedFormats.includes(format);
                      return (
                        <button
                          key={format}
                          onClick={() => toggleFormat(format)}
                      className={`w-full text-center py-2 text-xs rounded-md transition-all ${
                            isSelected
                          ? "bg-yellow-400 dark:bg-yellow-500 text-slate-900 dark:text-slate-900 font-bold shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
                          }`}
                        >
                          {format}
                        </button>
                      );
                    })}
                  </div>
                </div>

            {/* Group 3: 作者分类 */}
            <div className="mb-6">
              <h3 className="px-2 text-base font-bold text-slate-900 dark:text-white mb-2 text-center">
                    作者分类
                  </h3>
              <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => {
                        setSelectedAuthor(null);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-center py-2 text-xs rounded-md transition-all ${
                        selectedAuthor === null
                          ? "bg-yellow-400 dark:bg-yellow-500 text-slate-900 dark:text-slate-900 font-bold shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
                      }`}
                    >
                      全部
                    </button>
                    {authors.map((author) => {
                      const isSelected = selectedAuthor === author;
                      return (
                        <button
                          key={author}
                          onClick={() => {
                            setSelectedAuthor(author);
                            setCurrentPage(1);
                          }}
                          className={`w-full text-center py-2 text-xs rounded-md transition-all ${
                            isSelected
                              ? "bg-yellow-400 dark:bg-yellow-500 text-slate-900 dark:text-slate-900 font-bold shadow-sm"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
                          }`}
                        >
                          {author}
                        </button>
                      );
                    })}
                  </div>
                </div>

            </div>
          </aside>

        {/* --- RIGHT CONTENT AREA --- */}
        <main className="flex-1 min-w-0 flex flex-col">
          
          {/* 1. HEADER (Sticky) */}
          <div className="sticky top-16 z-20 bg-white/95 dark:bg-slate-950/95 backdrop-blur pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 transition-all">
            <div className="px-8">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Investment Insights
                  </h1>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    找到 <span className="font-semibold text-slate-900 dark:text-slate-50">{filteredTweets.length}</span> 篇文章
                  </span>
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
                    className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-lg shadow-sm hover:shadow-md transition-all"
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
              <div className="mt-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-white dark:bg-slate-950 hover:bg-white dark:hover:bg-slate-950">
                      <TableHead className="w-40 font-semibold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
                        发布日期
                      </TableHead>
                      <TableHead className="w-auto font-semibold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
                        文章标题
                      </TableHead>
                      <TableHead className="w-56 font-semibold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 text-right bg-white dark:bg-slate-950">
                        赛道/类型
                      </TableHead>
                      <TableHead className="w-32 font-semibold text-slate-500 dark:text-slate-400 text-center bg-white dark:bg-slate-950">
                        浏览量
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                </Table>
              </div>
              </div>
            </div>

          {/* 2. SCROLLABLE LIST */}
          <div className="px-8 pb-20 pt-0">
            {/* Table Container - Body Only */}
            <div className="w-full overflow-x-auto scrollbar-hide">
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden min-w-[800px]">
                <Table>
                  <TableBody>
                    {paginatedTweets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="p-0">
                          {/* Premium Empty State */}
                          <div className="bg-slate-50 dark:bg-slate-900/50 py-32 px-8">
                            <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                              {/* Visual Anchor - Circular Icon Container */}
                              <div className="w-20 h-20 bg-yellow-50 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-6">
                                <FileSearch className="w-10 h-10 text-yellow-500 dark:text-yellow-400" />
                              </div>

                              {/* Typography */}
                              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                暂无相关内容
                              </h3>
                              <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto text-sm leading-relaxed text-center">
                                看起来我们还没有发布关于这个话题的洞察。试试切换其他赛道？
                              </p>

                              {/* Action Button */}
                              {hasActiveFilters && (
                                <button
                                  onClick={clearFilters}
                                  className="border border-slate-200 dark:border-slate-700 hover:border-yellow-400 dark:hover:border-yellow-500 hover:text-yellow-600 dark:hover:text-yellow-500 text-slate-600 dark:text-slate-400 px-6 py-2 rounded-full mt-6 transition-all bg-white dark:bg-slate-950 font-medium text-sm"
                                >
                                  重置筛选
                                </button>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedTweets.map((tweet, index) => {
                        const isEven = index % 2 === 0;
                        const handleRowClick = () => {
                          if (tweet.link && tweet.link !== "#") {
                            window.open(tweet.link, "_blank", "noopener,noreferrer");
                          }
                        };
                        return (
                          <TableRow
                            key={tweet.id}
                            onClick={handleRowClick}
                            className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                              isEven ? "bg-white dark:bg-slate-950" : "bg-slate-50/50 dark:bg-slate-900/50"
                            }`}
                          >
                            {/* Date Column */}
                            <TableCell className="w-40 border-r border-slate-200 dark:border-slate-700">
                              <span className="font-mono text-sm text-slate-500 dark:text-slate-400">
                                {tweet.date}
                              </span>
                            </TableCell>

                            {/* Title Column */}
                            <TableCell className="w-auto border-r border-slate-200 dark:border-slate-700">
                              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                                {tweet.title}
                              </h3>
                            </TableCell>

                            {/* Tags Column */}
                            <TableCell className="w-56 border-r border-slate-200 dark:border-slate-700">
                              <div className="flex items-center gap-2 justify-end flex-wrap">
                                {/* Topic Badges - 支持多个分类 */}
                                {tweet.category.split(",").map((cat, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                  >
                                    {cat.trim()}
                                  </span>
                                ))}
                                {/* Format Badges - 支持多个类型 */}
                                {tweet.type.split(",").map((type, idx) => (
                                  <span
                                    key={idx}
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getFormatBadgeStyle(
                                      type.trim()
                                    )}`}
                                  >
                                    {type.trim()}
                                  </span>
                                ))}
                              </div>
                            </TableCell>

                            {/* Views Column */}
                            <TableCell className="w-32 text-center">
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
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  显示第 {startIndex + 1} - {Math.min(endIndex, filteredTweets.length)} 条，共{" "}
                  {filteredTweets.length} 条
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

        </main>

      </div>
    </div>
  );
}