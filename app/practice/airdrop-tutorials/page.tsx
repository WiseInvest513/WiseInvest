"use client";

import Link from "next/link";
import { ExternalLink, Calendar } from "lucide-react";

// Mock data - 空投系列教程
const airdropTutorialsData = [
  {
    id: 1,
    title: "Wise 身份认证注册开卡完整教程",
    category: "工具",
    date: "2025-01-10",
    tweetLink: "https://x.com/WiseInvest513/status/1996859457494737003",
    description: "免费获得 Wise 多币种账户，支持全球转账，详细步骤教程",
  },
  {
    id: 2,
    title: "Gemini 免费白嫖一年完整指南",
    category: "生产力",
    date: "2025-01-05",
    tweetLink: "#",
    description: "通过特定渠道可获得 Gemini Pro 一年免费使用权，包含注册和使用技巧",
  },
  {
    id: 3,
    title: "Bitget 新用户活动参与策略",
    category: "Web3",
    date: "2024-12-28",
    tweetLink: "#",
    description: "每期活动平均可获得 $50-200 等值代币奖励，分享参与技巧和注意事项",
  },
  {
    id: 4,
    title: "空投项目筛选与参与指南",
    category: "Web3",
    date: "2024-12-20",
    tweetLink: "#",
    description: "如何识别优质空投项目，提高获得空投的概率，包含项目评估标准",
  },
  {
    id: 5,
    title: "LayerZero 生态空投完整攻略",
    category: "Web3",
    date: "2024-12-15",
    tweetLink: "#",
    description: "LayerZero 生态项目空投参与指南，包含交互策略和注意事项",
  },
  {
    id: 6,
    title: "Starknet 空投领取教程",
    category: "Web3",
    date: "2024-12-10",
    tweetLink: "#",
    description: "Starknet 空投领取详细步骤，包含钱包设置和验证流程",
  },
];

export default function AirdropTutorialsPage() {
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
              src="https://cdn.simpleicons.org/ethereum/627EEA"
              alt="Crypto"
              className="w-8 h-8"
            />
            <h1 className="font-serif text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
              空投系列教程
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            空投项目教程与推文记录，分享优质空投机会和参与方法
          </p>
        </div>

        {/* Tutorials Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                    日期
                  </th>
                  <th className="text-left py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                    分类
                  </th>
                  <th className="text-left py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                    标题
                  </th>
                  <th className="text-left py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                    描述
                  </th>
                  <th className="text-center py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                    推文
                  </th>
                </tr>
              </thead>
              <tbody>
                {airdropTutorialsData.map((tutorial) => (
                  <tr
                    key={tutorial.id}
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                          {tutorial.date}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium">
                        {tutorial.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {tutorial.title}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {tutorial.description}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <a
                        href={tutorial.tweetLink}
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
      </div>
    </div>
  );
}

