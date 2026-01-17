"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Calendar, ExternalLink, ChevronLeft, ChevronRight, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// 抽奖数据
interface Giveaway {
  id: number;
  title: string;
  date: string;
  announcementLink: string;
  resultLink: string;
}

const giveawayData: Giveaway[] = [
  {
    id: 3,
    title: "马斯克的创作者激励&抽奖撒钱大放（三）",
    date: "2026-01-03",
    announcementLink: "https://x.com/WiseInvest513/status/2007378849240359399",
    resultLink: "https://x.com/WiseInvest513/status/2008777245629051055",
  },
  {
    id: 2,
    title: "马斯克的创作者激励&抽奖撒钱大放（二）",
    date: "2025-12-20",
    announcementLink: "https://x.com/WiseInvest513/status/2002244679677718970",
    resultLink: "https://x.com/WiseInvest513/status/2003445526822273499",
  },
  {
    id: 1,
    title: "马斯克的创作者激励&抽奖撒钱大放（一）",
    date: "2025-12-06",
    announcementLink: "https://x.com/WiseInvest513/status/1997191446110302293",
    resultLink: "https://x.com/WiseInvest513/status/1998292343154475354",
  },
];

export default function TwitterGiveawayPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 使用所有数据，不需要筛选
  const filteredGiveaways = giveawayData;

  // 分页逻辑
  const totalPages = Math.ceil(filteredGiveaways.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedGiveaways = filteredGiveaways.slice(startIndex, endIndex);

  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);


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
                src="https://cdn.simpleicons.org/x/000000"
                alt="Twitter/X"
                className="w-8 h-8"
              />
              <h1 className="font-serif text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
                推特创作者激励抽奖
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">
              记录每次抽奖的公布贴和结果贴
            </p>
          </div>
        </div>


        {/* Results Count */}
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            找到 <span className="font-semibold text-slate-900 dark:text-slate-50">{filteredGiveaways.length}</span> 条记录
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
            <Table className="table-fixed">
              <colgroup>
                <col style={{ width: "160px" }} />
                <col style={{ width: "auto" }} />
                <col style={{ width: "160px" }} />
                <col style={{ width: "160px" }} />
              </colgroup>
              <TableHeader>
                <TableRow className="bg-white dark:bg-slate-950 hover:bg-white dark:hover:bg-slate-950 border-b border-gray-100 dark:border-slate-800">
                  <TableHead className="font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950 py-4 px-6" style={{ width: "160px" }}>
                    日期
                  </TableHead>
                  <TableHead className="font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950 py-4 px-6">
                    标题
                  </TableHead>
                  <TableHead className="font-semibold text-slate-500 dark:text-slate-400 text-center bg-white dark:bg-slate-950 py-4 px-6" style={{ width: "160px" }}>
                    公布贴
                  </TableHead>
                  <TableHead className="font-semibold text-slate-500 dark:text-slate-400 text-center bg-white dark:bg-slate-950 py-4 px-6" style={{ width: "160px" }}>
                    抽奖结果
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedGiveaways.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="p-0">
                      <div className="bg-slate-50 dark:bg-slate-900/50 py-32 px-8">
                        <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                          <div className="w-20 h-20 bg-yellow-50 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-6">
                            <Search className="w-10 h-10 text-yellow-500 dark:text-yellow-400" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            暂无记录
                          </h3>
                          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto text-sm leading-relaxed text-center">
                            还没有抽奖记录
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedGiveaways.map((giveaway, index) => {
                    const isEven = index % 2 === 0;
                    return (
                      <TableRow
                        key={giveaway.id}
                        className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors border-b border-gray-100 dark:border-slate-800 ${
                          isEven
                            ? "bg-white dark:bg-slate-950"
                            : "bg-gray-50 dark:bg-white/5"
                        }`}
                      >
                        {/* Date Column */}
                        <TableCell className="py-4 px-6 whitespace-nowrap" style={{ width: "160px" }}>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="font-mono text-sm text-slate-500 dark:text-slate-400">
                              {giveaway.date}
                            </span>
                          </div>
                        </TableCell>

                        {/* Title Column */}
                        <TableCell className="py-4 px-6">
                          <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                            {giveaway.title}
                          </h3>
                        </TableCell>

                        {/* Announcement Link Column */}
                        <TableCell className="py-4 px-6 text-center" style={{ width: "160px" }}>
                          <div className="flex items-center justify-center">
                            <a
                              href={giveaway.announcementLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>查看</span>
                            </a>
                          </div>
                        </TableCell>

                        {/* Result Link Column */}
                        <TableCell className="py-4 px-6 text-center" style={{ width: "160px" }}>
                          <div className="flex items-center justify-center">
                            <a
                              href={giveaway.resultLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>查看</span>
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
              显示第 {startIndex + 1} - {Math.min(endIndex, filteredGiveaways.length)} 条，共{" "}
              {filteredGiveaways.length} 条
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

