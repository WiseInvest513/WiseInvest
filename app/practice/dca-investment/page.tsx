"use client";

import { useState, useMemo } from "react";
import { ExternalLink, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// 定投文章数据（按时间倒序排列，最新的在最上面）
const dcaArticles = [
  {
    id: 23,
    title: "BTC/ETH 周定投 10 年致富实盘之第23周🎉🎉",
    date: "2026-01-04",
    tweetLink: "https://x.com/WiseInvest513/status/2007812727771983973",
  },
  {
    id: 22,
    title: "BTC/ETH 周定投 10 年致富实盘之第22周🎉🎉",
    date: "2025-12-29",
    tweetLink: "https://x.com/WiseInvest513/status/2005642317521420341",
  },
  {
    id: 21,
    title: "BTC/ETH 周定投 10 年致富实盘之第21周🎉🎉",
    date: "2025-12-21",
    tweetLink: "https://x.com/WiseInvest513/status/2002623025108451750",
  },
  {
    id: 20,
    title: "BTC/ETH 周定投 10 年致富实盘之第20周🎉🎉",
    date: "2025-12-15",
    tweetLink: "https://x.com/WiseInvest513/status/2000420828580864509",
  },
  {
    id: 19,
    title: "BTC/ETH 周定投 10 年致富实盘之第19周🎉🎉",
    date: "2025-12-07",
    tweetLink: "https://x.com/WiseInvest513/status/1997654557070164425",
  },
  {
    id: 18,
    title: "BTC/ETH 周定投 10 年致富实盘之第18周🎉🎉",
    date: "2025-11-30",
    tweetLink: "https://x.com/WiseInvest513/status/1995475479613276364",
  },
  {
    id: 17,
    title: "BTC/ETH 周定投 10 年致富实盘之第17周🎉🎉",
    date: "2025-11-23",
    tweetLink: "https://x.com/WiseInvest513/status/1992604136911855748",
  },
  {
    id: 16,
    title: "BTC/ETH 周定投 10 年致富实盘之第16周🎉🎉",
    date: "2025-11-16",
    tweetLink: "https://x.com/WiseInvest513/status/1989987551671886064",
  },
  {
    id: 15,
    title: "BTC/ETH 周定投 10 年致富实盘之第15周🎉🎉",
    date: "2025-11-09",
    tweetLink: "https://x.com/WiseInvest513/status/1987422454294188223",
  },
  {
    id: 14,
    title: "BTC/ETH 周定投 10 年致富实盘之第14周🎉🎉",
    date: "2025-11-02",
    tweetLink: "https://x.com/WiseInvest513/status/1984843757402128705",
  },
  {
    id: 13,
    title: "BTC/ETH 周定投 10 年致富实盘之第13周🎉🎉",
    date: "2025-10-26",
    tweetLink: "https://x.com/WiseInvest513/status/1982365681623744839",
  },
  {
    id: 12,
    title: "BTC/ETH 周定投 10 年致富实盘之第12周🎉🎉",
    date: "2025-10-19",
    tweetLink: "https://x.com/WiseInvest513/status/1979745818799452239",
  },
  {
    id: 11,
    title: "BTC/ETH 周定投 10 年致富实盘之第11周🎉🎉",
    date: "2025-10-14",
    tweetLink: "https://x.com/WiseInvest513/status/1978114530786881584",
  },
  {
    id: 10,
    title: "BTC/ETH 周定投 10 年致富实盘之第10周🎉🎉",
    date: "2025-10-06",
    tweetLink: "https://x.com/WiseInvest513/status/1975213127152390333",
  },
  {
    id: 9,
    title: "BTC/ETH 周定投 10 年致富实盘之第9周🎉🎉",
    date: "2025-09-29",
    tweetLink: "https://x.com/WiseInvest513/status/1972684844942696927",
  },
  {
    id: 8,
    title: "BTC/ETH 周定投 10 年致富实盘之第8周🎉🎉",
    date: "2025-09-21",
    tweetLink: "https://x.com/WiseInvest513/status/1969658655357485395",
  },
  {
    id: 7,
    title: "BTC/ETH 周定投 10 年致富实盘之第7周🎉🎉",
    date: "2025-09-14",
    tweetLink: "https://x.com/WiseInvest513/status/1967204762685952497",
  },
  {
    id: 6,
    title: "BTC/ETH 周定投 10 年致富实盘之第6周🎉🎉",
    date: "2025-09-07",
    tweetLink: "https://x.com/WiseInvest513/status/1964640729151815749",
  },
  {
    id: 5,
    title: "BTC/ETH 周定投 10 年致富实盘之第5周🎉🎉",
    date: "2025-08-31",
    tweetLink: "https://x.com/WiseInvest513/status/1961977981007757601",
  },
  {
    id: 4,
    title: "BTC/ETH 周定投 10 年致富实盘之第4周🎉🎉",
    date: "2025-08-24",
    tweetLink: "https://x.com/WiseInvest513/status/1959540416455295334",
  },
  {
    id: 3,
    title: "BTC/ETH 周定投 10 年致富实盘之第3周🎉🎉",
    date: "2025-08-17",
    tweetLink: "https://x.com/WiseInvest513/status/1957063605750493662",
  },
  {
    id: 2,
    title: "BTC/ETH 周定投 10 年致富实盘之第2周🎉🎉",
    date: "2025-08-10",
    tweetLink: "https://x.com/WiseInvest513/status/1954524116968702270",
  },
  {
    id: 1,
    title: "BTC/ETH 周定投 10 年致富实盘之第1周🎉🎉",
    date: "2025-08-03",
    tweetLink: "https://x.com/WiseInvest513/status/1952017101805457420",
  },
];

// 定投数据（根据用户提供的数据）
const dcaData = [
  {
    date: "2025/08/03",
    btcPrice: 114079.05,
    btcHigh: 119794,
    btcLow: 111914,
    btcYield: 0,
    ethPrice: 3494.43,
    ethHigh: 3940,
    ethLow: 3354,
    ethYield: 0,
  },
  {
    date: "2025/08/10",
    btcPrice: 118169.48,
    btcHigh: 118497,
    btcLow: 112892,
    btcYield: 1.79,
    ethPrice: 4210.14,
    ethHigh: 4312,
    ethLow: 3472,
    ethYield: 10.24,
  },
  {
    date: "2025/08/17",
    btcPrice: 118306.94,
    btcHigh: 123881,
    btcLow: 116991,
    btcYield: 1.27,
    ethPrice: 4547.43,
    ethHigh: 4776,
    ethLow: 4167,
    ethYield: 12.72,
  },
  {
    date: "2025/08/24",
    btcPrice: 115010.9,
    btcHigh: 118496,
    btcLow: 112154,
    btcYield: -1.16,
    ethPrice: 4767.21,
    ethHigh: 4850,
    ethLow: 4075,
    ethYield: 13.62,
  },
  {
    date: "2025/08/31",
    btcPrice: 109371.96,
    btcHigh: 115114,
    btcLow: 107443,
    btcYield: -4.81,
    ethPrice: 4453.4,
    ethHigh: 4933,
    ethLow: 4265,
    ethYield: 4.91,
  },
  {
    date: "2025/09/07",
    btcPrice: 111094.47,
    btcHigh: 113223,
    btcLow: 107410,
    btcYield: -2.76,
    ethPrice: 4297.24,
    ethHigh: 4490,
    ethLow: 4255,
    ethYield: 1.03,
  },
  {
    date: "2025/09/14",
    btcPrice: 116065.31,
    btcHigh: 116778,
    btcLow: 110838,
    btcYield: 1.37,
    ethPrice: 4677.65,
    ethHigh: 4759,
    ethLow: 4276,
    ethYield: 8.55,
  },
  {
    date: "2025/09/21",
    btcPrice: 115498.54,
    btcHigh: 117885,
    btcLow: 114686,
    btcYield: 0.76,
    ethPrice: 4476.51,
    ethHigh: 4667,
    ethLow: 4443,
    ethYield: 3.40,
  },
  {
    date: "2025/09/29",
    btcPrice: 112094.17,
    btcHigh: 112355,
    btcLow: 109258,
    btcYield: -1.96,
    ethPrice: 4126.13,
    ethHigh: 4211,
    ethLow: 3839,
    ethYield: -4.18,
  },
  {
    date: "2025/10/06",
    btcPrice: 124763.58,
    btcHigh: 125209,
    btcLow: 112829,
    btcYield: 8.21,
    ethPrice: 4634.36,
    ethHigh: 4675,
    ethLow: 4099,
    ethYield: 6.86,
  },
  {
    date: "2025/10/14",
    btcPrice: 111666.56,
    btcHigh: 124105,
    btcLow: 109765,
    btcYield: -2.86,
    ethPrice: 3970.46,
    ethHigh: 4540,
    ethLow: 3699,
    ethYield: -7.68,
  },
  {
    date: "2025/10/19",
    btcPrice: 106943,
    btcHigh: 115895,
    btcLow: 104542,
    btcYield: -6.39,
    ethPrice: 3872,
    ethHigh: 4290,
    ethLow: 3708,
    ethYield: -9.14,
  },
  {
    date: "2025/10/26",
    btcPrice: 111703,
    btcHigh: 113448,
    btcLow: 107205,
    btcYield: -2.05,
    ethPrice: 3951,
    ethHigh: 4082,
    ethLow: 3743,
    ethYield: -6.72,
  },
  {
    date: "2025/11/02",
    btcPrice: 110074,
    btcHigh: 116044,
    btcLow: 106505,
    btcYield: -3.23,
    ethPrice: 3879,
    ethHigh: 4235,
    ethLow: 3687,
    ethYield: -7.82,
  },
  {
    date: "2025/11/09",
    btcPrice: 101819,
    btcHigh: 111104,
    btcLow: 99571,
    btcYield: -9.79,
    ethPrice: 3407,
    ethHigh: 3906,
    ethLow: 3212,
    ethYield: -17.77,
  },
  {
    date: "2025/11/16",
    btcPrice: 96140,
    btcHigh: 106632,
    btcLow: 94287,
    btcYield: -13.90,
    ethPrice: 3218,
    ethHigh: 3635,
    ethLow: 3109,
    ethYield: -20.93,
  },
  {
    date: "2025/11/23",
    btcPrice: 86752,
    btcHigh: 95589,
    btcLow: 82106,
    btcYield: -20.99,
    ethPrice: 2835,
    ethHigh: 3201,
    ethLow: 2678,
    ethYield: -28.56,
  },
  {
    date: "2025/11/30",
    btcPrice: 91277,
    btcHigh: 92372,
    btcLow: 85802,
    btcYield: -15.93,
    ethPrice: 3010,
    ethHigh: 3074,
    ethLow: 2814,
    ethYield: -22.81,
  },
  {
    date: "2025/12/7",
    btcPrice: 89279,
    btcHigh: 93961,
    btcLow: 84543,
    btcYield: -16.84,
    ethPrice: 3042,
    ethHigh: 3222,
    ethLow: 2730,
    ethYield: -20.83,
  },
  {
    date: "2025/12/15",
    btcPrice: 88999,
    btcHigh: 94199,
    btcLow: 88051,
    btcYield: -16.24,
    ethPrice: 3083,
    ethHigh: 3390,
    ethLow: 3033,
    ethYield: -18.77,
  },
  {
    date: "2025/12/21",
    btcPrice: 88132,
    btcHigh: 90262,
    btcLow: 84446,
    btcYield: -16.25,
    ethPrice: 2975,
    ethHigh: 3780,
    ethLow: 2973,
    ethYield: -20.59,
  },
  {
    date: "2025/12/29",
    btcPrice: 87269,
    btcHigh: 90100,
    btcLow: 86762,
    btcYield: -16.29,
    ethPrice: 2923,
    ethHigh: 3060,
    ethLow: 2901,
    ethYield: -20.98,
  },
  {
    date: "2026/1/4",
    btcPrice: 91205,
    btcHigh: 91554,
    btcLow: 86992,
    btcYield: -11.97,
    ethPrice: 3139,
    ethHigh: 3156,
    ethLow: 2916,
    ethYield: -14.48,
  },
];

type TabType = "articles" | "data" | "chart";

// Custom Tooltip Component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/80 backdrop-blur-md border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-xs text-gray-400 mb-2 font-mono">
          {payload[0]?.payload?.date}
        </p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-300">
                {entry.name}:{" "}
                <span style={{ color: entry.color }} className="font-bold">
                  {entry.value >= 0 ? "+" : ""}
                  {entry.value.toFixed(2)}%
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Format date to MM/DD
const formatDate = (dateStr: string) => {
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    return `${parts[1]}/${parts[2]}`;
  }
  return dateStr;
};

export default function DCAInvestmentPage() {
  const [activeTab, setActiveTab] = useState<TabType>("articles");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // 数据表格分页状态
  const [dataCurrentPage, setDataCurrentPage] = useState(1);
  const [dataPageSize, setDataPageSize] = useState(15);

  // 文章分页逻辑
  const totalPages = Math.ceil(dcaArticles.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedArticles = dcaArticles.slice(startIndex, endIndex);

  // 数据表格分页逻辑
  const dataTotalPages = Math.ceil(dcaData.length / dataPageSize);
  const dataStartIndex = (dataCurrentPage - 1) * dataPageSize;
  const dataEndIndex = dataStartIndex + dataPageSize;
  const paginatedDcaData = dcaData.slice(dataStartIndex, dataEndIndex);

  // 图表数据准备
  const chartData = dcaData.map((item) => ({
    date: item.date.replace(/\//g, "/"),
    btcYield: item.btcYield,
    ethYield: item.ethYield,
  }));

  // 计算计分板数据
  const totalInvestments = dcaData.length;
  // 每次定投：BTC 100U + ETH 100U = 200U
  const investmentPerPeriod = 200; // 美元
  const totalInvested = totalInvestments * investmentPerPeriod; // 4600U (23次 * 200U)
  
  // 使用最后一条数据的收益率（BTC和ETH收益率平均）
  const latestData = dcaData[dcaData.length - 1];
  const totalROI = (latestData.btcYield + latestData.ethYield) / 2;
  
  // 使用最后一条数据的收益率计算当前净值
  const currentValue = totalInvested * (1 + totalROI / 100);
  
  // 计算Y轴域（添加缓冲）
  const maxYield = Math.max(
    ...dcaData.map((item) => Math.max(Math.abs(item.btcYield), Math.abs(item.ethYield)))
  );
  const yAxisDomain = [Math.min(-maxYield * 1.1, -35), Math.max(maxYield * 1.1, 35)];

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
              src="https://cdn.simpleicons.org/bitcoin/F7931A"
              alt="BTC"
              className="w-8 h-8"
            />
            <h1 className="font-serif text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
              BTC/ETH 定投
            </h1>
          </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">
            定投文章记录与实盘数据追踪
          </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("articles")}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === "articles"
                  ? "border-amber-500 text-amber-600 dark:text-amber-400"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              文章
            </button>
            <button
              onClick={() => setActiveTab("data")}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === "data"
                  ? "border-amber-500 text-amber-600 dark:text-amber-400"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              数据
            </button>
            <button
              onClick={() => setActiveTab("chart")}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === "chart"
                  ? "border-amber-500 text-amber-600 dark:text-amber-400"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              图表
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "articles" && (
          <div className="space-y-2">
            {/* Page Size Selector */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">每页显示：</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950"
                >
                  <option value={10}>10 条</option>
                  <option value={20}>20 条</option>
                </select>
              </div>
            </div>

            {/* Articles List - Fixed Height */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="h-[calc(100vh-240px)] min-h-[600px] overflow-y-auto">
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {paginatedArticles.map((article) => (
              <a
                key={article.id}
                href={article.tweetLink}
                target="_blank"
                rel="noopener noreferrer"
                      className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                        {article.date}
                      </span>
                    </div>
                          <h3 className="font-semibold text-base text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {article.title}
                    </h3>
                  </div>
                  <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors shrink-0" />
                </div>
              </a>
            ))}
          </div>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  显示第 {startIndex + 1} - {Math.min(endIndex, dcaArticles.length)} 条，共{" "}
                  {dcaArticles.length} 条
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
        )}

        {activeTab === "data" && (
          <div className="space-y-2">
            {/* Page Size Selector */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">每页显示：</span>
                <select
                  value={dataPageSize}
                  onChange={(e) => {
                    setDataPageSize(Number(e.target.value));
                    setDataCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950"
                >
                  <option value={10}>10 条</option>
                  <option value={15}>15 条</option>
                  <option value={20}>20 条</option>
                  <option value={30}>30 条</option>
                </select>
            </div>
          </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <div className="bg-white dark:bg-slate-900 shadow-sm rounded-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
                <div className="h-[calc(100vh-240px)] min-h-[600px] overflow-y-auto overflow-x-auto">
                  <table className="w-full text-sm table-fixed">
                    <colgroup>
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "15%" }} />
                    </colgroup>
                    <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10">
                      {/* Top Header Row */}
                      <tr>
                        <th className="text-left py-4 px-6" style={{ width: "15%" }}></th>
                        <th
                          colSpan={2}
                          className="text-center py-4 px-6 text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-wider"
                          style={{ width: "35%" }}
                        >
                          Bitcoin Core Data
                    </th>
                        <th
                          colSpan={2}
                          className="text-center py-4 px-6 text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-wider"
                          style={{ width: "35%" }}
                        >
                          Ethereum Core Data
                    </th>
                      </tr>
                      {/* Sub Header Row */}
                      <tr className="border-b border-gray-100 dark:border-slate-800">
                        <th className="text-left py-4 px-6 text-gray-500 dark:text-gray-400 text-sm font-medium" style={{ width: "15%" }}>
                          定投时间
                    </th>
                        <th className="text-right py-4 px-6 text-gray-500 dark:text-gray-400 text-sm font-medium" style={{ width: "20%" }}>
                          定投价格
                    </th>
                        <th className="text-right py-4 px-6 text-gray-500 dark:text-gray-400 text-sm font-medium" style={{ width: "15%" }}>
                          收益率
                    </th>
                        <th className="text-right py-4 px-6 text-gray-500 dark:text-gray-400 text-sm font-medium" style={{ width: "20%" }}>
                          定投价格
                    </th>
                        <th className="text-right py-4 px-6 text-gray-500 dark:text-gray-400 text-sm font-medium" style={{ width: "15%" }}>
                      收益率
                    </th>
                  </tr>
                </thead>
                <tbody>
                      {paginatedDcaData.map((item, index) => (
                    <tr
                          key={index}
                          className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors group bg-white dark:bg-slate-900"
                    >
                          <td className="py-5 px-6 text-gray-400 dark:text-gray-500 font-medium text-sm" style={{ width: "15%" }}>
                        {item.date}
                      </td>
                          <td className="py-5 px-6 text-right" style={{ width: "20%" }}>
                            <div className="font-mono text-gray-900 dark:text-gray-100 text-sm">
                              {item.btcPrice.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              H: {item.btcHigh.toLocaleString()} | L: {item.btcLow.toLocaleString()}
                            </div>
                      </td>
                          <td className="py-5 px-6 text-right" style={{ width: "15%" }}>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium font-mono ${
                                item.btcYield >= 0
                                  ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400"
                                  : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                              }`}
                            >
                              {item.btcYield >= 0 ? "+" : ""}
                              {item.btcYield.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-5 px-6 text-right" style={{ width: "20%" }}>
                            <div className="font-mono text-gray-900 dark:text-gray-100 text-sm">
                              {item.ethPrice.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              H: {item.ethHigh.toLocaleString()} | L: {item.ethLow.toLocaleString()}
                            </div>
                      </td>
                          <td className="py-5 px-6 text-right" style={{ width: "15%" }}>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium font-mono ${
                                item.ethYield >= 0
                                  ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400"
                                  : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                              }`}
                            >
                              {item.ethYield >= 0 ? "+" : ""}
                              {item.ethYield.toFixed(2)}%
                            </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {paginatedDcaData.map((item, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-5 shadow-sm"
                >
                  <div className="text-gray-400 dark:text-gray-500 font-medium text-sm mb-4">
                    {item.date}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">BTC 价格</span>
                      <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                        {item.btcPrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">BTC 收益率</span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium font-mono ${
                          item.btcYield >= 0
                            ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400"
                            : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                        }`}
                      >
                        {item.btcYield >= 0 ? "+" : ""}
                        {item.btcYield.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-800">
                      <span className="text-sm text-gray-500 dark:text-gray-400">ETH 价格</span>
                      <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                        {item.ethPrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">ETH 收益率</span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium font-mono ${
                          item.ethYield >= 0
                            ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400"
                            : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                        }`}
                      >
                        {item.ethYield >= 0 ? "+" : ""}
                        {item.ethYield.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {dataTotalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  显示第 {dataStartIndex + 1} - {Math.min(dataEndIndex, dcaData.length)} 条，共{" "}
                  {dcaData.length} 条
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDataCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={dataCurrentPage === 1}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-slate-500 dark:text-slate-400 px-4">
                    第 {dataCurrentPage} / {dataTotalPages} 页
                  </span>
                  <button
                    onClick={() => setDataCurrentPage((p) => Math.min(dataTotalPages, p + 1))}
                    disabled={dataCurrentPage === dataTotalPages}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "chart" && (
          <div>
            <div className="bg-transparent dark:bg-transparent rounded-xl p-4">
              {/* Header with Title and Legend */}
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-serif font-bold text-gray-100 dark:text-gray-100">
                  收益率趋势图
                </h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#F7931A]" />
                    <span className="text-xs text-gray-400">BTC 收益率</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#627EEA]" />
                    <span className="text-xs text-gray-400">ETH 收益率</span>
                  </div>
                </div>
              </div>

              {/* The Scoreboard */}
              <div className="flex items-center gap-6 mb-4 px-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">总投入</span>
                  <span className="text-base font-mono text-gray-400 dark:text-gray-500">
                    ${totalInvested.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">当前净值</span>
                  <span className="text-lg font-bold font-mono text-gray-900 dark:text-gray-100">
                    ${currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">总收益率</span>
                  <span
                    className={`text-2xl font-bold font-mono ${
                      totalROI >= 0
                        ? "text-green-500 dark:text-green-400"
                        : "text-red-500 dark:text-red-400"
                    }`}
                  >
                    {totalROI >= 0 ? "+" : ""}
                    {totalROI.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="h-[calc(100vh-360px)] min-h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      {/* BTC Gradient */}
                      <linearGradient id="colorBtc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F7931A" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#F7931A" stopOpacity={0} />
                      </linearGradient>
                      {/* ETH Gradient */}
                      <linearGradient id="colorEth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#627EEA" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#627EEA" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#333"
                      vertical={false}
                      horizontal={true}
                    />
                    <XAxis
                      dataKey="date"
                      stroke="#888"
                      tick={{ fontSize: 12, fill: "#888" }}
                      tickFormatter={formatDate}
                      minTickGap={50}
                      height={40}
                    />
                    <YAxis
                      stroke="#888"
                      tick={{ fontSize: 12, fill: "#888" }}
                      tickFormatter={(value) => `${value}%`}
                      width={60}
                      domain={yAxisDomain}
                    />
                    <ReferenceLine
                      y={0}
                      stroke="#666"
                      strokeWidth={2}
                      strokeDasharray=""
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="btcYield"
                      stroke="#F7931A"
                      strokeWidth={2.5}
                      fill="url(#colorBtc)"
                      name="BTC 收益率"
                      dot={false}
                      activeDot={{ r: 8, fill: "#F7931A", stroke: "#fff", strokeWidth: 2 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="ethYield"
                      stroke="#627EEA"
                      strokeWidth={2.5}
                      fill="url(#colorEth)"
                      name="ETH 收益率"
                      dot={false}
                      activeDot={{ r: 8, fill: "#627EEA", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
