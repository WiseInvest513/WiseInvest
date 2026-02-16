"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

const practiceCategories = [
  {
    id: "dca-investment",
    label: "BTC/ETH 定投",
    iconUrl: "https://cdn.simpleicons.org/bitcoin/F7931A",
    description: "定投文章列表与实盘数据记录",
    href: "/practice/dca-investment",
  },
  {
    id: "video-content",
    label: "视频内容",
    iconUrl: "https://cdn.simpleicons.org/youtube/FF0000",
    description: "每周一期的 YouTube 视频内容",
    href: "/practice/video-content",
  },
  {
    id: "airdrop-tutorials",
    label: "空投系列教程",
    iconUrl: "https://cdn.simpleicons.org/gitbook/7C3AED",
    description: "按照\"人生作弊指南\"教程，严格领取币安 Alpha/欧易Boost空投，后投入 QQQ",
    href: "/practice/airdrop-tutorials",
  },
  {
    id: "bitget-corner",
    label: "Bitget 一期一会",
    iconUrl: "https://www.bitget.com/favicon.ico",
    description: "Bitget 新用户活动记录与介绍",
    href: "/practice/bitget-corner",
  },
];

export default function PracticePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
            实践
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            社会性实践实验室 · 展示真实的投资实验、视频更新、人生策略与平台活动
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {practiceCategories.map((category) => {
            return (
              <Link
                key={category.id}
                href={category.href}
                className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden"
              >
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* AboutMe 同款背景水印图标 */}
                <img
                  src={category.iconUrl}
                  alt=""
                  className="absolute -bottom-12 -right-12 w-44 h-44 opacity-[0.08] rotate-12 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:opacity-[0.14] z-0 pointer-events-none select-none grayscale group-hover:grayscale-0 object-contain"
                />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 border border-slate-200 dark:border-slate-700 p-2 relative">
                      <>
                        {/* 默认图标：首字母 */}
                        <span className="absolute text-slate-600 dark:text-slate-400 font-bold text-2xl opacity-100 transition-opacity duration-200" id={`fallback-${category.id}`}>
                          {category.label.charAt(0)}
                        </span>
                        {/* 图标图片 */}
                        <img
                          src={category.iconUrl}
                          alt={category.label}
                          className="w-full h-full object-contain relative z-10 opacity-0 transition-opacity duration-200"
                          onLoad={(e) => {
                            e.currentTarget.style.opacity = '1';
                            const fallback = document.getElementById(`fallback-${category.id}`);
                            if (fallback) fallback.style.opacity = '0';
                          }}
                          onError={(e) => {
                            e.currentTarget.style.opacity = '0';
                            const fallback = document.getElementById(`fallback-${category.id}`);
                            if (fallback) fallback.style.opacity = '1';
                          }}
                        />
                      </>
                    </div>
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-1">
                        {category.label}
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium mt-6">
                    <span className="text-sm">查看详情</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
