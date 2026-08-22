"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getSafeExternalUrl } from "@/lib/security/external-links";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface DcaDataPoint {
  date: string;
  btcPrice: number;
  btcHigh?: number;
  btcLow?: number;
  btcYield?: number;
  ethPrice: number;
  ethHigh?: number;
  ethLow?: number;
  ethYield?: number;
  executionTime?: string;
  source?: string;
}

interface DcaTimelinePoint extends DcaDataPoint {
  week: number;
  btcYield: number;
  ethYield: number;
  btcQuantity: number;
  ethQuantity: number;
  btcHoldings: number;
  ethHoldings: number;
  totalInvested: number;
  totalValue: number;
  totalProfit: number;
  totalYield: number;
}

// 截至 2026/03/16 的记录来自既有截图，日期、价格与收益率保持原样。
const historicalDcaData: DcaDataPoint[] = [
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
  {
    date: "2026/1/11",
    btcPrice: 90974,
    btcHigh: 94452,
    btcLow: 89775,
    btcYield: -11.69,
    ethPrice: 3115,
    ethHigh: 3295,
    ethLow: 3069,
    ethYield: -14.50,
  },
  {
    date: "2026/1/18",
    btcPrice: 95080,
    btcHigh: 96767,
    btcLow: 90318,
    btcYield: -7.39,
    ethPrice: 3328,
    ethHigh: 3383,
    ethLow: 3089,
    ethYield: -8.31,
  },
  {
    date: "2026/1/25",
    btcPrice: 87816,
    btcHigh: 90595,
    btcLow: 86396,
    btcYield: -13.91,
    ethPrice: 2913,
    ethHigh: 2907,
    ethLow: 2803,
    ethYield: -18.99,
  },
  {
    date: "2026/2/1",
    btcPrice: 78854,
    btcHigh: 90147,
    btcLow: 75417,
    btcYield: -21.86,
    ethPrice: 2442,
    ethHigh: 3035,
    ethLow: 2195,
    ethYield: -30.90,
  },
  {
    date: "2026/2/8",
    btcPrice: 69287,
    btcHigh: 79335,
    btcLow: 60000,
    btcYield: -30.22,
    ethPrice: 2081,
    ethHigh: 2396,
    ethLow: 1744,
    ethYield: -39.64,
  },
  {
    date: "2026/2/15",
    btcPrice: 70421,
    btcHigh: 71464,
    btcLow: 65367,
    btcYield: -28.07,
    ethPrice: 2061,
    ethHigh: 2130,
    ethLow: 1907,
    ethYield: -39.64,
  },
  {
    date: "2026/2/22",
    btcPrice: 64725,
    btcHigh: 68604,
    btcLow: 62956,
    btcYield: -32.76,
    ethPrice: 1856,
    ethHigh: 2019,
    ethLow: 1817,
    ethYield: -43.42,
  },
  {
    date: "2026/3/1",
    btcPrice: 67292,
    btcHigh: 67274,
    btcLow: 65141,
    btcYield: -29.12,
    ethPrice: 2011,
    ethHigh: 2100,
    ethLow: 1815,
    ethYield: -37.45,
  },
  {
    date: "2026/3/10",
    btcPrice: 70331,
    btcHigh: 71110,
    btcLow: 65973,
    btcYield: -25.11,
    ethPrice: 2042,
    ethHigh: 2178,
    ethLow: 1930,
    ethYield: -35.35,
  },
  {
    date: "2026/3/16",
    btcPrice: 71559,
    btcHigh: 73410,
    btcLow: 65793,
    btcYield: -23.08,
    ethPrice: 2097,
    ethHigh: 2100,
    ethLow: 1815,
    ethYield: -32.59,
  },
];

// 从既有最后一条记录之后继续：每周日 20:30（北京时间），BTC 与 ETH 各投入 100U。
// 新增价格采用 OKX BTC-USDT / ETH-USDT 对应 20:30 分钟 K 线开盘价估算。
const continuationDcaData: DcaDataPoint[] = [
  { date: "2026/03/22", btcPrice: 68659.1, ethPrice: 2084.79, executionTime: "周日 20:30", source: "OKX" },
  { date: "2026/03/29", btcPrice: 66777, ethPrice: 2002.95, executionTime: "周日 20:30", source: "OKX" },
  { date: "2026/04/05", btcPrice: 66884.8, ethPrice: 2037.31, executionTime: "周日 20:30", source: "OKX" },
  { date: "2026/04/12", btcPrice: 71411, ethPrice: 2204.84, executionTime: "周日 20:30", source: "OKX" },
  { date: "2026/04/19", btcPrice: 75519.7, ethPrice: 2328.2, executionTime: "周日 20:30", source: "OKX" },
  { date: "2026/04/26", btcPrice: 77958.1, ethPrice: 2331.14, executionTime: "周日 20:30", source: "OKX" },
  { date: "2026/05/03", btcPrice: 78778.5, ethPrice: 2326.96, executionTime: "周日 20:30", source: "OKX" },
  { date: "2026/05/10", btcPrice: 80927.6, ethPrice: 2324.51, executionTime: "周日 20:30", source: "OKX" },
  { date: "2026/05/17", btcPrice: 78432.3, ethPrice: 2193.85, executionTime: "周日 20:30", source: "OKX" },
  { date: "2026/05/24", btcPrice: 77072.7, ethPrice: 2118.41, executionTime: "周日 20:30", source: "OKX" },
  { date: "2026/05/31", btcPrice: 73937, ethPrice: 2023.49, executionTime: "周日 20:30", source: "OKX" },
  { date: "2026/06/07", btcPrice: 61941.4, ethPrice: 1610.89, executionTime: "周日 20:30", source: "OKX" },
  { date: "2026/06/14", btcPrice: 64467.2, ethPrice: 1673.07, executionTime: "周日 20:30", source: "OKX" },
  { date: "2026/06/21", btcPrice: 64022.6, ethPrice: 1719.09, executionTime: "周日 20:30", source: "OKX" },
  { date: "2026/06/28", btcPrice: 60338.9, ethPrice: 1584.51, executionTime: "周日 20:30", source: "OKX" },
  { date: "2026/07/05", btcPrice: 62753.3, ethPrice: 1766.27, executionTime: "周日 20:30", source: "OKX" },
  { date: "2026/07/12", btcPrice: 64065, ethPrice: 1807.56, executionTime: "周日 20:30", source: "OKX" },
  { date: "2026/07/19", btcPrice: 64307.5, ethPrice: 1868.7, executionTime: "周日 20:30", source: "OKX" },
  { date: "2026/07/26", btcPrice: 64576.5, ethPrice: 1890.03, executionTime: "周日 20:30", source: "OKX" },
  { date: "2026/08/02", btcPrice: 63181.9, ethPrice: 1858.4, executionTime: "周日 20:30", source: "OKX" },
  { date: "2026/08/09", btcPrice: 64944.8, ethPrice: 1918.3, executionTime: "周日 20:30", source: "OKX" },
  { date: "2026/08/16", btcPrice: 63017.6, ethPrice: 1880.71, executionTime: "周日 20:30", source: "OKX" },
];

const investmentPerAsset = 100;

function buildDcaTimeline(points: DcaDataPoint[]): DcaTimelinePoint[] {
  let btcHoldings = 0;
  let ethHoldings = 0;

  return points.map((point, index) => {
    btcHoldings += investmentPerAsset / point.btcPrice;
    ethHoldings += investmentPerAsset / point.ethPrice;

    const week = index + 1;
    const investedPerAsset = week * investmentPerAsset;
    const totalInvested = investedPerAsset * 2;
    const btcValue = btcHoldings * point.btcPrice;
    const ethValue = ethHoldings * point.ethPrice;
    const totalValue = btcValue + ethValue;
    const calculatedBtcYield = (btcValue / investedPerAsset - 1) * 100;
    const calculatedEthYield = (ethValue / investedPerAsset - 1) * 100;

    return {
      ...point,
      week,
      btcYield: point.btcYield ?? calculatedBtcYield,
      ethYield: point.ethYield ?? calculatedEthYield,
      btcQuantity: investmentPerAsset / point.btcPrice,
      ethQuantity: investmentPerAsset / point.ethPrice,
      btcHoldings,
      ethHoldings,
      totalInvested,
      totalValue,
      totalProfit: totalValue - totalInvested,
      totalYield: (totalValue / totalInvested - 1) * 100,
    };
  });
}

const dcaData = buildDcaTimeline([
  ...historicalDcaData,
  ...continuationDcaData,
]);
const dcaDataNewestFirst = [...dcaData].reverse();

type TabType = "data" | "chart";

// Custom Tooltip Component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const point = payload[0]?.payload as DcaTimelinePoint | undefined;
    if (!point) return null;

    return (
      <div className="w-[min(260px,calc(100vw-48px))] rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-white">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">第 {point.week} 周</p>
          <p className="font-mono text-[11px] text-slate-400">{point.date}</p>
        </div>

        <div className="mt-3 border-b border-slate-100 pb-3 dark:border-slate-800">
          <p className="text-[11px] text-slate-400">组合累计收益</p>
          <p className={`mt-1 font-mono text-2xl font-black ${point.totalYield >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {point.totalYield >= 0 ? "+" : ""}{point.totalYield.toFixed(2)}%
          </p>
        </div>

        <div className="mt-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400"><span className="h-0.5 w-5 bg-[#F7931A]" />BTC</span>
            <span className="font-mono text-slate-700 dark:text-slate-100">{point.btcYield >= 0 ? "+" : ""}{point.btcYield.toFixed(2)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400"><span className="h-0.5 w-5 bg-[#7C8CE8]" />ETH</span>
            <span className="font-mono text-slate-700 dark:text-slate-100">{point.ethYield >= 0 ? "+" : ""}{point.ethYield.toFixed(2)}%</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-[11px] dark:border-slate-800">
          <div>
            <p className="text-slate-500">累计投入</p>
            <p className="mt-1 font-mono font-semibold text-slate-700 dark:text-slate-200">{point.totalInvested.toLocaleString()}U</p>
          </div>
          <div className="text-right">
            <p className="text-slate-500">组合净值</p>
            <p className="mt-1 font-mono font-semibold text-slate-700 dark:text-slate-200">{point.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}U</p>
          </div>
          <div className="col-span-2 flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-slate-950">
            <span className="text-slate-500">累计盈亏</span>
            <span className={`font-mono font-bold ${point.totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {point.totalProfit >= 0 ? "+" : ""}{point.totalProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}U
            </span>
          </div>
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
  const [activeTab, setActiveTab] = useState<TabType>("chart");
  // 数据表格分页状态
  const [dataCurrentPage, setDataCurrentPage] = useState(1);
  const [dataPageSize, setDataPageSize] = useState(15);

  // 数据表格分页逻辑
  const dataTotalPages = Math.ceil(dcaData.length / dataPageSize);
  const dataStartIndex = (dataCurrentPage - 1) * dataPageSize;
  const dataEndIndex = dataStartIndex + dataPageSize;
  const paginatedDcaData = dcaDataNewestFirst.slice(dataStartIndex, dataEndIndex);

  // 图表数据准备
  const chartData = dcaData.map((item) => ({
    ...item,
    btcYield: item.btcYield,
    ethYield: item.ethYield,
    totalYield: item.totalYield,
  }));

  // 计算计分板数据
  const totalInvestments = dcaData.length;
  const latestData = dcaData[dcaData.length - 1];
  const totalInvested = latestData.totalInvested;
  const totalROI = latestData.totalYield;
  const currentValue = latestData.totalValue;
  const totalProfit = latestData.totalProfit;
  
  // 非对称自适应范围，让主要波动充满画布，同时始终保留 0% 盈亏线。
  const yieldValues = dcaData.flatMap((item) => [
    item.btcYield,
    item.ethYield,
    item.totalYield,
  ]);
  const yAxisMin = Math.floor((Math.min(0, ...yieldValues) - 4) / 10) * 10;
  const yAxisMax = Math.ceil((Math.max(0, ...yieldValues) + 4) / 10) * 10;
  const yAxisDomain: [number, number] = [yAxisMin, yAxisMax];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-2 md:py-3">
        {/* Header - Centered */}
        <div className="mb-2">
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
            BTC / ETH 收益曲线与每周定投明细
          </p>
          </div>
        </div>

        <section className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
                持续定投
              </p>
              <h2 className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                每周定投 200U
              </h2>
            </div>
            <span className="self-start rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
              更新至 {latestData.date}
            </span>
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
            每周末定投 BTC / ETH 各 100U，坚持十年。
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
              <div className="text-xs text-slate-500 dark:text-slate-400">累计投入</div>
              <div className="mt-1 font-mono text-lg font-black text-slate-900 dark:text-white">
                {totalInvested.toLocaleString()}U
              </div>
              <div className="mt-1 text-[11px] text-slate-400">BTC / ETH 各 {(totalInvested / 2).toLocaleString()}U</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
              <div className="text-xs text-slate-500 dark:text-slate-400">截至记录净值</div>
              <div className="mt-1 font-mono text-lg font-black text-slate-900 dark:text-white">
                {currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}U
              </div>
              <div className="mt-1 text-[11px] text-slate-400">按最新定投时点价格估值</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
              <div className="text-xs text-slate-500 dark:text-slate-400">累计盈亏</div>
              <div className={`mt-1 font-mono text-lg font-black ${totalProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {totalProfit >= 0 ? "+" : ""}{totalProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}U
              </div>
              <div className="mt-1 text-[11px] text-slate-400">收益率 {totalROI >= 0 ? "+" : ""}{totalROI.toFixed(2)}%</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
              <div className="text-xs text-slate-500 dark:text-slate-400">已执行</div>
              <div className="mt-1 font-mono text-lg font-black text-slate-900 dark:text-white">
                {totalInvestments} 周
              </div>
              <div className="mt-1 text-[11px] text-slate-400">共 {totalInvestments * 2} 笔买入</div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="mb-4 flex justify-center md:justify-start">
          <div className="grid w-full grid-cols-2 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-900 sm:w-[340px]">
            <button
              onClick={() => setActiveTab("chart")}
              className={`min-h-11 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === "chart"
                  ? "bg-white text-amber-600 shadow-sm ring-1 ring-amber-200 dark:bg-slate-800 dark:text-amber-300 dark:ring-amber-500/30"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              收益曲线
            </button>
            <button
              onClick={() => setActiveTab("data")}
              className={`min-h-11 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === "data"
                  ? "bg-white text-amber-600 shadow-sm ring-1 ring-amber-200 dark:bg-slate-800 dark:text-amber-300 dark:ring-amber-500/30"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              定投明细
            </button>
          </div>
        </div>

        {/* Tab Content */}
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
                  <table className="w-full min-w-[1040px] text-sm">
                    <thead className="sticky top-0 z-10 bg-white dark:bg-slate-900">
                      <tr className="border-b border-gray-100 dark:border-slate-800">
                        <th className="px-5 py-4 text-left font-medium text-gray-500 dark:text-gray-400">周次 / 时间</th>
                        <th className="px-5 py-4 text-right font-medium text-gray-500 dark:text-gray-400">BTC · 每周 100U</th>
                        <th className="px-5 py-4 text-right font-medium text-gray-500 dark:text-gray-400">BTC 累计收益</th>
                        <th className="px-5 py-4 text-right font-medium text-gray-500 dark:text-gray-400">ETH · 每周 100U</th>
                        <th className="px-5 py-4 text-right font-medium text-gray-500 dark:text-gray-400">ETH 累计收益</th>
                        <th className="px-5 py-4 text-right font-medium text-gray-500 dark:text-gray-400">组合净值 / 盈亏</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedDcaData.map((item) => (
                        <tr
                          key={item.week}
                          className="border-b border-gray-100 bg-white transition-colors hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-900 dark:text-white">第 {item.week} 周</div>
                            <div className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">{item.date}</div>
                            <div className="mt-1 text-[11px] text-slate-400">
                              每周定投 200U
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="font-mono text-slate-900 dark:text-slate-100">@ {item.btcPrice.toLocaleString()}U</div>
                            <div className="mt-1 font-mono text-[11px] text-slate-400">买入 {item.btcQuantity.toFixed(8)} BTC</div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className={`inline-flex rounded-full px-2 py-1 font-mono text-xs font-medium ${item.btcYield >= 0 ? "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400" : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"}`}>
                              {item.btcYield >= 0 ? "+" : ""}{item.btcYield.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="font-mono text-slate-900 dark:text-slate-100">@ {item.ethPrice.toLocaleString()}U</div>
                            <div className="mt-1 font-mono text-[11px] text-slate-400">买入 {item.ethQuantity.toFixed(6)} ETH</div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className={`inline-flex rounded-full px-2 py-1 font-mono text-xs font-medium ${item.ethYield >= 0 ? "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400" : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"}`}>
                              {item.ethYield >= 0 ? "+" : ""}{item.ethYield.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="font-mono font-semibold text-slate-900 dark:text-white">
                              {item.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}U
                            </div>
                            <div className={`mt-1 font-mono text-xs ${item.totalProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                              {item.totalProfit >= 0 ? "+" : ""}{item.totalProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}U · {item.totalYield >= 0 ? "+" : ""}{item.totalYield.toFixed(2)}%
                            </div>
                            <div className="mt-1 text-[11px] text-slate-400">累计投入 {item.totalInvested.toLocaleString()}U</div>
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
              {paginatedDcaData.map((item) => (
                <div
                  key={item.week}
                  className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">第 {item.week} 周</div>
                      <div className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">{item.date}</div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      每周定投 200U
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">BTC · 100U</div>
                        <div className="mt-1 font-mono text-[11px] text-slate-400">买入 {item.btcQuantity.toFixed(8)} BTC</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm text-slate-900 dark:text-slate-100">@ {item.btcPrice.toLocaleString()}U</div>
                        <div className={`mt-1 font-mono text-xs ${item.btcYield >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                          累计 {item.btcYield >= 0 ? "+" : ""}{item.btcYield.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-800">
                      <div>
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">ETH · 100U</div>
                        <div className="mt-1 font-mono text-[11px] text-slate-400">买入 {item.ethQuantity.toFixed(6)} ETH</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm text-slate-900 dark:text-slate-100">@ {item.ethPrice.toLocaleString()}U</div>
                        <div className={`mt-1 font-mono text-xs ${item.ethYield >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                          累计 {item.ethYield >= 0 ? "+" : ""}{item.ethYield.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>累计投入 {item.totalInvested.toLocaleString()}U</span>
                        <span>组合净值 {item.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}U</span>
                      </div>
                      <div className={`mt-2 text-right font-mono text-sm font-bold ${item.totalProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {item.totalProfit >= 0 ? "+" : ""}{item.totalProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}U · {item.totalYield >= 0 ? "+" : ""}{item.totalYield.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {dataTotalPages > 1 && (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
            <div>
              <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
                    <span className="h-px w-6 bg-amber-500" />
                    DCA · {totalInvestments} 周
                  </div>
                  <h2 className="mt-2 font-serif text-2xl font-black text-slate-900 dark:text-white md:text-3xl">
                    累计收益曲线
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-slate-400 md:text-sm">
                    以每周定投后的累计持仓估值计算，组合收益作为主线。
                  </p>
                </div>

                <div className="flex items-end justify-between gap-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950 md:min-w-[220px] md:justify-end">
                  <div>
                    <p className="text-[11px] text-slate-500">最新组合收益</p>
                    <p className={`mt-1 font-mono text-2xl font-black ${totalROI >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {totalROI >= 0 ? "+" : ""}{totalROI.toFixed(2)}%
                    </p>
                  </div>
                  <div className="pb-1 text-right">
                    <p className="font-mono text-[11px] text-slate-500">{latestData.date}</p>
                    <p className="mt-1 text-[11px] text-slate-400">第 {latestData.week} 周</p>
                  </div>
                </div>
              </header>

              <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 text-[11px] dark:border-slate-700 dark:bg-slate-950 sm:text-xs">
                <div className="flex items-center justify-center gap-2 rounded-lg bg-amber-50 px-2 py-2.5 font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  <span className="h-0.5 w-5 rounded-full bg-[#F4B942]" />
                  组合
                </div>
                <div className="flex items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-slate-600 dark:text-slate-300">
                  <span className="h-0.5 w-5 rounded-full bg-[#F7931A]" />
                  BTC
                </div>
                <div className="flex items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-slate-600 dark:text-slate-300">
                  <span className="h-0.5 w-5 rounded-full bg-[#7C8CE8]" />
                  ETH
                </div>
              </div>

              <div className="mt-3 h-[320px] rounded-xl border border-slate-200 bg-white p-1.5 dark:border-slate-700 dark:bg-slate-950 sm:h-[400px] lg:h-[500px] md:p-3">
                <ResponsiveContainer width="100%" height="100%" minWidth={1}>
                  <ComposedChart data={chartData} margin={{ top: 16, right: 8, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F4B942" stopOpacity={0.24} />
                        <stop offset="100%" stopColor="#F4B942" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 7" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickFormatter={formatDate}
                      minTickGap={58}
                      interval="preserveStartEnd"
                      height={32}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickFormatter={(value) => `${Number(value).toFixed(0)}%`}
                      width={48}
                      domain={yAxisDomain}
                      tickCount={6}
                      allowDecimals={false}
                    />
                    <ReferenceLine
                      y={0}
                      stroke="#64748b"
                      strokeOpacity={0.8}
                      strokeWidth={1.25}
                      label={{ value: "盈亏平衡", position: "insideTopRight", fill: "#94a3b8", fontSize: 10 }}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ stroke: "#f59e0b", strokeOpacity: 0.35, strokeDasharray: "3 4" }}
                    />
                    <Area
                      type="linear"
                      dataKey="totalYield"
                      stroke="#F4B942"
                      strokeWidth={3.2}
                      strokeLinecap="round"
                      fill="url(#colorPortfolio)"
                      name="组合收益率"
                      dot={false}
                      activeDot={{ r: 6, fill: "#F4B942", stroke: "#ffffff", strokeWidth: 3 }}
                    />
                    <Line
                      type="linear"
                      dataKey="btcYield"
                      stroke="#F7931A"
                      strokeWidth={1.6}
                      strokeOpacity={0.82}
                      strokeLinecap="round"
                      name="BTC 收益率"
                      dot={false}
                      activeDot={{ r: 4, fill: "#F7931A", stroke: "#ffffff", strokeWidth: 2 }}
                    />
                    <Line
                      type="linear"
                      dataKey="ethYield"
                      stroke="#7C8CE8"
                      strokeWidth={1.6}
                      strokeOpacity={0.82}
                      strokeLinecap="round"
                      name="ETH 收益率"
                      dot={false}
                      activeDot={{ r: 4, fill: "#7C8CE8", stroke: "#ffffff", strokeWidth: 2 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <footer className="mt-3 flex flex-col gap-1 text-[11px] leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <span>金色为 BTC / ETH 等额组合；橙色与靛蓝为单资产累计收益。</span>
                <span className="font-mono">{totalInvestments} 个数据节点 · 最新净值 {currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}U</span>
              </footer>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                我现在的 BTC / ETH 定投是在 Bitget 里执行的。大家如果也想用同样的入口，可以先看开户教程，再通过注册链接创建账号。
                <div className="mt-2 flex flex-wrap gap-2">
                  <a
                    href="/articles/crypto/k3RVVcw4"
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:border-amber-300 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    Bitget 教程
                  </a>
                  <a
                    href={getSafeExternalUrl("https://partner.bitget.cafe/bg/8ax9wf4r")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-bold text-amber-700 transition-colors hover:border-amber-300 hover:bg-amber-50 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-300"
                  >
                    Bitget 注册账号
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
