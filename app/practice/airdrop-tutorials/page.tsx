"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, Calendar } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSafeExternalUrl, openSafeExternalUrl } from "@/lib/security/external-links";

// Mock data - 空投系列教程
const airdropTutorialsData = [
  {
    id: 7,
    title: "人生作弊指南介绍",
    date: "2025-10-13",
    tweetLink: "https://x.com/WiseInvest513/status/1977531214195290367",
    description: "如果现在你 22 岁从现在开始购买纳指和标普 ETF 是否有用",
  },
  {
    id: 1,
    title: "Wise 身份认证注册开卡完整教程",
    date: "2025-01-10",
    tweetLink: "https://x.com/WiseInvest513/status/1996859457494737003",
    description: "免费获得 Wise 多币种账户，支持全球转账，详细步骤教程",
  },
  {
    id: 2,
    title: "Gemini 免费白嫖一年完整指南",
    date: "2025-01-05",
    tweetLink: "#",
    description: "通过特定渠道可获得 Gemini Pro 一年免费使用权，包含注册和使用技巧",
  },
  {
    id: 3,
    title: "Bitget 新用户活动参与策略",
    date: "2024-12-28",
    tweetLink: "#",
    description: "每期活动平均可获得 $50-200 等值代币奖励，分享参与技巧和注意事项",
  },
  {
    id: 4,
    title: "空投项目筛选与参与指南",
    date: "2024-12-20",
    tweetLink: "#",
    description: "如何识别优质空投项目，提高获得空投的概率，包含项目评估标准",
  },
  {
    id: 5,
    title: "LayerZero 生态空投完整攻略",
    date: "2024-12-15",
    tweetLink: "#",
    description: "LayerZero 生态项目空投参与指南，包含交互策略和注意事项",
  },
  {
    id: 6,
    title: "Starknet 空投领取教程",
    date: "2024-12-10",
    tweetLink: "#",
    description: "Starknet 空投领取详细步骤，包含钱包设置和验证流程",
  },
];

function normalizeDate(date: string): string {
  const pad = (value: string | number) => String(value).padStart(2, "0");

  const cnMatch = date.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
  if (cnMatch) {
    const [, year, month, day] = cnMatch;
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  const dashMatch = date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (dashMatch) {
    const [, year, month, day] = dashMatch;
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  const slashMatch = date.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (slashMatch) {
    const [, year, month, day] = slashMatch;
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  return date;
}

export default function AirdropTutorialsPage() {
  const [activeRowId, setActiveRowId] = useState<number | null>(null);
  const activeRowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (activeRowTimerRef.current) clearTimeout(activeRowTimerRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/practice"
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-4"
          >
            ← 返回实践主页
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <img
              src="https://cdn.simpleicons.org/gitbook/7C3AED"
              alt="Airdrop"
              className="w-8 h-8"
            />
            <h1 className="font-serif text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
              空投系列教程
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            按照"人生作弊指南"教程，严格领取币安 Alpha/欧易Boost空投，后投入 QQQ
          </p>
        </div>

        {/* Tutorials Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white dark:bg-slate-950 hover:bg-white dark:hover:bg-slate-950 border-b border-gray-100 dark:border-slate-800">
                  <TableHead className="w-40 font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950">
                    日期
                  </TableHead>
                  <TableHead className="w-auto font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950">
                    标题
                  </TableHead>
                  <TableHead className="w-auto font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950">
                    描述
                  </TableHead>
                  <TableHead className="w-28 font-semibold text-slate-500 dark:text-slate-400 text-center bg-white dark:bg-slate-950">
                    推文
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {airdropTutorialsData.map((tutorial, index) => {
                  const isEven = index % 2 === 0;
                  const isActiveRow = activeRowId === tutorial.id;

                  const handleRowClick = () => {
                    if (activeRowTimerRef.current) clearTimeout(activeRowTimerRef.current);
                    setActiveRowId(tutorial.id);
                    activeRowTimerRef.current = setTimeout(() => {
                      setActiveRowId(null);
                    }, 1100);
                    openSafeExternalUrl(tutorial.tweetLink);
                  };

                  return (
                    <TableRow
                      key={tutorial.id}
                      onClick={handleRowClick}
                      className={`group cursor-pointer transition-all duration-200 ${
                        isEven ? "bg-white dark:bg-slate-900" : "bg-slate-50/80 dark:bg-slate-900/70"
                      } ${
                        isActiveRow
                          ? "bg-amber-50/65 dark:bg-amber-900/15 [transform:translateY(-2px)] shadow-[0_12px_26px_-18px_rgba(245,158,11,0.9)]"
                          : "hover:bg-amber-50/40 dark:hover:bg-slate-800/70 hover:[transform:translateY(-2px)] hover:shadow-[0_10px_22px_-16px_rgba(15,23,42,0.45)]"
                      } active:[transform:translateY(-1px)] ${
                        index !== airdropTutorialsData.length - 1 ? "border-b border-slate-200/80 dark:border-slate-800" : ""
                      }`}
                    >
                      <TableCell className="w-40 py-3 border-r border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="font-mono text-sm text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                            {normalizeDate(tutorial.date)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="w-auto py-3 border-r border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold text-[15px] text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                          {tutorial.title}
                        </h3>
                      </TableCell>
                      <TableCell className="w-auto py-3 border-r border-slate-200 dark:border-slate-700">
                        <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                          {tutorial.description}
                        </span>
                      </TableCell>
                      <TableCell className="w-28 py-3 text-center">
                        <a
                          href={getSafeExternalUrl(tutorial.tweetLink)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors group-hover:text-amber-700 dark:group-hover:text-amber-300"
                          onClick={(e) => e.stopPropagation()}
                        >
                          查看
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

