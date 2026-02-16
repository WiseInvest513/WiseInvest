"use client";

import Link from "next/link";
import { ExternalLink, Calendar, Info } from "lucide-react";
import { IconService } from "@/lib/icon-service";
import { useState, useEffect } from "react";
import { getSafeExternalUrl } from "@/lib/security/external-links";

// Bitget 一期一会数据（按时间倒序排列，最新的在最上面）
const bitgetCornerData = [
  {
    id: 7,
    period: 7,
    periodName: "第七期",
    keywords: ["新用户"],
    startDate: "2026-01-07",
    deadline: "2026-01-11",
    link: "https://x.com/WiseInvest513/status/2008862730896523731",
    reward: "$5-500",
  },
  {
    id: 6,
    period: 6,
    periodName: "第六期",
    keywords: ["新用户"],
    startDate: "2025-12-12",
    deadline: "2025-12-14",
    link: "https://x.com/WiseInvest513/status/1999307467105403066",
    reward: "$10-888",
  },
  {
    id: 5,
    period: 5,
    periodName: "第五期",
    keywords: ["新用户"],
    startDate: "2025-12-02",
    deadline: "2025-12-07",
    link: "https://x.com/WiseInvest513/status/1995841956358799496",
    reward: "$5-888",
  },
  {
    id: 4,
    period: 4,
    periodName: "第四期",
    keywords: ["新用户"],
    startDate: "2025-11-25",
    deadline: "2025-11-30",
    link: "https://x.com/WiseInvest513/status/1993231164891402484",
    reward: "$10-450",
  },
  {
    id: 3,
    period: 3,
    periodName: "第三期",
    keywords: ["新用户"],
    startDate: "2025-11-17",
    deadline: "2025-11-24",
    link: "https://x.com/WiseInvest513/status/1990431224318562445",
    reward: "$10-30",
  },
  {
    id: 2,
    period: 2,
    periodName: "第二期",
    keywords: ["新用户", "盲盒"],
    startDate: "2025-11-13",
    deadline: "2025-11-18",
    link: "https://x.com/WiseInvest513/status/1990431224318562445",
    reward: "100% 中奖盲盒",
  },
  {
    id: 1,
    period: 1,
    periodName: "第一期",
    keywords: ["新用户"],
    startDate: "2025-11-03",
    deadline: "2025-11-12",
    link: "https://x.com/WiseInvest513/status/1985355228078805381",
    reward: "$10-300",
  },
].map((item) => {
  // 根据截止日期判断状态
  const today = new Date();
  const deadlineDate = new Date(item.deadline);
  const isActive = deadlineDate >= today;
  
  return {
    ...item,
    status: isActive ? "active" : "ended",
  };
});

// Bitget 介绍内容
const bitgetInfo = {
  name: "Bitget",
  description: "Bitget 是全球领先的加密货币交易平台，提供现货、合约、跟单等多种交易服务。",
  features: [
    "全球排名前 10 的加密货币交易所",
    "支持 500+ 种加密货币交易",
    "专业的合约交易功能",
    "跟单交易，复制专业交易员策略",
    "新用户活动奖励丰厚",
  ],
  officialLink: "https://bitget.com",
};

export default function BitgetCornerPage() {
  const [iconUrl, setIconUrl] = useState<string>("");
  const [iconError, setIconError] = useState(false);

  useEffect(() => {
    const iconInfo = IconService.getIconInfo("https://www.bitget.com", "Bitget");
    setIconUrl(iconInfo.iconUrl);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-2 md:py-3">
        {/* Header */}
        <div className="mb-2">
          <Link 
            href="/practice"
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-2"
          >
            ← 返回实践主页
          </Link>
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-1">
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8">
                {iconUrl && !iconError ? (
                  <img
                    src={iconUrl}
                    alt="Bitget"
                    className="w-8 h-8 object-contain"
                    onError={() => setIconError(true)}
                  />
                ) : (
                  <span className="text-slate-600 dark:text-slate-400 font-bold text-xl">B</span>
                )}
              </div>
              <h1 className="font-serif text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
                Bitget 一期一会
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">
              Bitget 新用户活动记录与平台介绍
            </p>
          </div>
        </div>

        {/* Part 1: Bitget 介绍 */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl border border-amber-200 dark:border-amber-800 p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <Info className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {bitgetInfo.name} 平台介绍
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  {bitgetInfo.description}
                </p>
                <ul className="space-y-2 mb-4">
                  {bitgetInfo.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <span className="text-amber-600 dark:text-amber-400 mt-1">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={getSafeExternalUrl(bitgetInfo.officialLink)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium"
                >
                  访问官网
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Part 2: 活动记录表格 */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            活动记录
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                      期数
                    </th>
                    <th className="text-left py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                      关键词
                    </th>
                    <th className="text-left py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                      开始时间
                    </th>
                    <th className="text-left py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                      奖励范围
                    </th>
                    <th className="text-left py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                      截止日期
                    </th>
                    <th className="text-center py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                      状态
                    </th>
                    <th className="text-center py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                      链接
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bitgetCornerData.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {item.periodName}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {item.keywords.map((keyword, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                            {item.startDate}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {item.reward}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                            {item.deadline}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            item.status === "active"
                              ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {item.status === "active" ? "火热进行中" : "已结束"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <a
                          href={getSafeExternalUrl(item.link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                        >
                          查看
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

