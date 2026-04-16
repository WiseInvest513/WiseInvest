"use client";

import { useEffect, useState, useRef } from "react";
import { Twitter, Youtube, Video, Instagram, MessageCircle, ArrowUpRight, Send, TrendingUp, Zap, Bitcoin, BookOpen } from "lucide-react";
import Link from "next/link";
import { getSafeExternalUrl } from "@/lib/security/external-links";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

// ─── 数字滚动动画 ──────────────────────────────────────────
const AnimatedNumber = ({ value }: { value: number }) => {
  const [count, setCount] = useState(0);
  const [trigger, setTrigger] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => { setCount(0); setTrigger(t => t + 1); }, 8000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const duration = 2000;
    const startTime = performance.now();
    setCount(0);
    const animate = (currentTime: number) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeOut * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, trigger]);
  return <>{count.toLocaleString()}</>;
};

// ─── 社媒增长数据（从 25年8月 开始） ──────────────────────
const growthData = [
  { month: "25/08", twitter: 0,    youtube: 0,   bilibili: 0,    xiaohongshu: 0    },
  { month: "25/09", twitter: 3000, youtube: 80,  bilibili: 500,  xiaohongshu: 1200 },
  { month: "25/10", twitter: 10000,youtube: 280, bilibili: 1800, xiaohongshu: 4500 },
  { month: "25/11", twitter: 15000,youtube: 520, bilibili: 4200, xiaohongshu: 8000 },
  { month: "25/12", twitter: 20000,youtube: 890, bilibili: 6500, xiaohongshu: 11000},
  { month: "26/01", twitter: 24000,youtube: 1300,bilibili: 8800, xiaohongshu: 13800},
  { month: "26/02", twitter: 30000,youtube: 1650,bilibili: 10500,xiaohongshu: 15800},
  { month: "26/03", twitter: 32000,youtube: 1900,bilibili: 12000,xiaohongshu: 17500},
  { month: "26/04", twitter: 34020,youtube: 2040,bilibili: 12873,xiaohongshu: 18302},
];

// ─── 社媒数据 ──────────────────────────────────────────────
const socials = [
  { name: "Twitter / X", count: 34020, label: "Followers", Icon: Twitter, pngPath: "https://cdn.simpleicons.org/x/000000", color: "hover:border-slate-500 hover:shadow-slate-200", cardTone: "border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/40", text: "text-slate-900 dark:text-slate-100", bg: "bg-slate-100 dark:bg-slate-800", link: "https://x.com/WiseInvest513" },
  { name: "Little Red Book", count: 18302, label: "Followers", Icon: Instagram, pngPath: "https://cdn.simpleicons.org/xiaohongshu/FF2442", color: "hover:border-rose-500 hover:shadow-rose-100", cardTone: "border-rose-100 dark:border-rose-800/40 bg-rose-50/35 dark:bg-rose-900/10", text: "text-rose-500", bg: "bg-rose-50", link: "https://www.xiaohongshu.com/user/profile/6373a8ba0000000024014988" },
  { name: "YouTube", count: 2040, label: "Subscribers", Icon: Youtube, pngPath: "https://cdn.simpleicons.org/youtube/FF0000", color: "hover:border-red-500 hover:shadow-red-100", cardTone: "border-red-100 dark:border-red-800/40 bg-red-50/35 dark:bg-red-900/10", text: "text-red-600", bg: "bg-red-50", link: "https://www.youtube.com/@WiseInvest513" },
  { name: "Bilibili", count: 12873, label: "Fans", Icon: Video, pngPath: "https://cdn.simpleicons.org/bilibili/00A1D6", color: "hover:border-blue-400 hover:shadow-blue-100", cardTone: "border-blue-100 dark:border-blue-800/40 bg-blue-50/35 dark:bg-blue-900/10", text: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20", link: "https://space.bilibili.com/347066091" },
  { name: "WeChat", count: 4382, label: "Readers", Icon: MessageCircle, pngPath: "https://cdn.simpleicons.org/wechat/07C160", color: "hover:border-green-500 hover:shadow-green-100", cardTone: "border-green-100 dark:border-green-800/40 bg-green-50/35 dark:bg-green-900/10", text: "text-green-600", bg: "bg-green-50", link: "https://mp.weixin.qq.com/s/TY05tsqsUgoBNDgsKCiSag" },
  { name: "Telegram", count: 0, displayValue: "Join Group", label: "Official Community", Icon: Send, pngPath: "https://cdn.simpleicons.org/telegram/26A5E4", color: "hover:border-sky-500 hover:shadow-sky-100", cardTone: "border-sky-100 dark:border-sky-800/40 bg-sky-50/40 dark:bg-sky-900/10", text: "text-sky-600", bg: "bg-sky-50", link: "https://t.me/WiseInvest513Chat" },
];

// ─── 坚持的事 ─────────────────────────────────────────────
const commitments = [
  {
    icon: Bitcoin,
    color: "from-orange-400 to-amber-500",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    borderColor: "border-orange-200 dark:border-orange-800/40",
    title: "BTC / ETH 定投",
    since: "2024 年 01 月起",
    desc: "每月固定定投 BTC 与 ETH，不择时、不预测，用时间换收益。记录每一笔买入，公开持仓与盈亏，和大家一起穿越牛熊。",
    stats: [
      { label: "定投周期", value: "15+ 个月" },
      { label: "策略", value: "每月固定" },
      { label: "记录", value: "全程公开" },
    ],
    href: "/practice/dca-investment",
  },
  {
    icon: Zap,
    color: "from-violet-400 to-purple-500",
    bgColor: "bg-violet-50 dark:bg-violet-900/20",
    borderColor: "border-violet-200 dark:border-violet-800/40",
    title: "Alpha 空投实战",
    since: "2025 年 06 月起",
    desc: "持续参与币安 Alpha、欧易 Boost 等主流平台空投，严格执行「人生作弊指南」策略，所得收益全部转投 QQQ。",
    stats: [
      { label: "参与平台", value: "币安 / 欧易" },
      { label: "收益去向", value: "全投 QQQ" },
      { label: "记录", value: "每期公开" },
    ],
    href: "/practice/airdrop-tutorials",
  },
];

// ─── 使用 IntersectionObserver 触发入场动画 ────────────────
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ─── 自定义 Tooltip ───────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500 dark:text-slate-400">{p.name}:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-100">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export default function AboutMe() {
  const heroFade = useFadeIn();
  const growthFade = useFadeIn();
  const commitFade = useFadeIn();
  const socialFade = useFadeIn();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-x-hidden dot-grid dot-grid-light">
      

      {/* ══ SECTION 1: Hero ══════════════════════════════════ */}
      <section className="min-h-[80vh] flex items-center">
        <div className="max-w-6xl mx-auto px-6 py-20 w-full">
          <div
            ref={heroFade.ref}
            className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center transition-all duration-1000 ${heroFade.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            {/* 左：图片区域 */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-72 h-72 lg:w-96 lg:h-96">
                {/* 背景装饰圆 */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 rotate-6" />
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-400/10 to-orange-500/10 -rotate-3" />
                {/* 头像 */}
                <div className="relative w-full h-full rounded-3xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-2xl shadow-amber-200/30 dark:shadow-amber-900/20">
                  <img
                    src="/images/profile/avatar.png"
                    alt="Wise Invest"
                    className="w-full h-full object-cover"
                    onError={e => { e.currentTarget.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=WiseInvest"; }}
                  />
                </div>
                {/* 浮动徽章 */}
                <div className="absolute -bottom-4 -left-4 bg-white dark:bg-slate-900 rounded-2xl px-4 py-2.5 shadow-lg border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <span className="text-lg">🚀</span>
                  <div>
                    <div className="text-xs text-slate-400">内容创作</div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100">从 2025.08 开始</div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 bg-white dark:bg-slate-900 rounded-2xl px-4 py-2.5 shadow-lg border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <span className="text-lg">📈</span>
                  <div>
                    <div className="text-xs text-slate-400">全网粉丝</div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100">70,000+</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 右：文字介绍 */}
            <div className="space-y-6">
              <div>
                <p className="text-amber-500 font-semibold text-sm tracking-widest uppercase mb-2">Web3 & Investment Creator</p>
                <h1 className="text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-4">
                  Wise<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Invest</span>
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
                  2025 年 8 月从零开始，专注 Web3 与港美股投资的独立内容创作者。
                </p>
              </div>

              <div className="space-y-3 text-slate-600 dark:text-slate-400 leading-relaxed">
                <p>在全网 5 个平台持续输出高质量投资内容，分享理性的投资逻辑、实用的出入金工具，以及 Web3 的前沿机会。</p>
                <p>坚信<strong className="text-slate-800 dark:text-slate-200">「普通人也可以通过结构化优势在市场中找到自己的阿尔法」</strong>，并用实盘数据证明这一点。</p>
              </div>

              {/* 核心数据 */}
              <div className="grid grid-cols-3 gap-4 pt-2">
                {[
                  { value: "8", unit: "个月", label: "从零到万粉" },
                  { value: "5", unit: "个平台", label: "同步更新" },
                  { value: "70K+", unit: "", label: "全网粉丝" },
                ].map((stat, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 text-center shadow-sm">
                    <div className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}<span className="text-sm font-medium text-slate-400 ml-0.5">{stat.unit}</span></div>
                    <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex items-center gap-3 pt-2">
                <a href={getSafeExternalUrl("https://x.com/WiseInvest513")} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-amber-500 hover:text-white transition-all shadow-md">
                  <Twitter className="w-4 h-4" /> 关注我
                </a>
                <a href={getSafeExternalUrl("https://t.me/WiseInvest513Chat")} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl font-semibold text-sm hover:border-amber-400 hover:text-amber-600 transition-all">
                  <Send className="w-4 h-4" /> 加入社群
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 2: 增长曲线 ══════════════════════════════ */}
      <section className="py-20 bg-white dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <div
            ref={growthFade.ref}
            className={`transition-all duration-1000 ${growthFade.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                <span className="text-amber-500 font-semibold text-sm tracking-widest uppercase">Growth Story</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3">从零开始的增长轨迹</h2>
              <p className="text-slate-500 dark:text-slate-400">2025 年 8 月从零粉丝起步，8 个月内全网突破 70,000 粉丝</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={growthData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${v/1000}K` : v} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
                  <Line type="monotone" dataKey="twitter" name="Twitter/X" stroke="#0f172a" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="xiaohongshu" name="小红书" stroke="#ff2442" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="bilibili" name="Bilibili" stroke="#00a1d6" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="youtube" name="YouTube" stroke="#ff0000" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 里程碑 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {[
                { month: "25/09", event: "首月破三千", icon: "🎯" },
                { month: "25/10", event: "Twitter 破万", icon: "🔥" },
                { month: "25/12", event: "Twitter 破两万", icon: "⚡" },
                { month: "26/04", event: "全网突破 7 万", icon: "🚀" },
              ].map((m, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 flex items-center gap-3">
                  <span className="text-2xl">{m.icon}</span>
                  <div>
                    <div className="text-xs text-slate-400">{m.month}</div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{m.event}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 3: 在坚持的事 ════════════════════════════ */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div
            ref={commitFade.ref}
            className={`transition-all duration-1000 ${commitFade.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-500 font-semibold text-sm tracking-widest uppercase">Commitments</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3">一直在坚持的两件事</h2>
              <p className="text-slate-500 dark:text-slate-400">不只是内容，更是真实的实践——所有数据全程公开</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {commitments.map((item, i) => {
                const Icon = item.icon;
                return (
                  <a key={i} href={item.href}
                    className={`group relative rounded-3xl border ${item.borderColor} ${item.bgColor} p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden`}
                  >
                    <div className="flex items-start gap-4 mb-6">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg shrink-0`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">{item.since}</div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">{item.title}</h3>
                      </div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6 text-sm">{item.desc}</p>
                    <div className="grid grid-cols-3 gap-3">
                      {item.stats.map((stat, j) => (
                        <div key={j} className="bg-white/60 dark:bg-slate-900/40 rounded-xl p-3 text-center">
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{stat.value}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="absolute bottom-6 right-6">
                      <ArrowUpRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 4: 社媒数字 ══════════════════════════════ */}
      <section className="py-20 bg-white dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <div
            ref={socialFade.ref}
            className={`transition-all duration-1000 ${socialFade.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="mb-10">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3">全网社媒分布</h2>
              <p className="text-slate-500 dark:text-slate-400">点击任意平台卡片，直接访问对应主页</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {socials.map((item, idx) => (
                <a key={idx} href={getSafeExternalUrl(item.link)} target="_blank" rel="noopener noreferrer"
                  className={`group relative overflow-hidden p-8 rounded-3xl border ${item.cardTone} transition-all duration-300 hover:-translate-y-1 ${item.color} shadow-sm hover:shadow-xl`}
                >
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                      <div className={`p-3 rounded-2xl transition-colors ${item.bg} ${item.text}`}>
                        <item.Icon className="w-6 h-6" />
                      </div>
                      <div className="flex items-center gap-2">
                        {item.name === "Telegram" && (
                          <span className="inline-flex items-center rounded-full bg-sky-100 dark:bg-sky-900/40 px-2 py-0.5 text-[10px] font-bold tracking-wide text-sky-700 dark:text-sky-300">LIVE</span>
                        )}
                        <ArrowUpRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                        {"displayValue" in item && item.displayValue ? (
                          <span className="text-2xl md:text-3xl">{item.displayValue}</span>
                        ) : (
                          <AnimatedNumber value={item.count} />
                        )}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                        {item.label}
                        {item.name === "Telegram" ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 font-semibold">Join on Telegram</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">{item.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {item.pngPath && (
                    <img src={item.pngPath} alt="" className="absolute -bottom-12 -right-12 w-48 h-48 opacity-[0.08] rotate-12 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:opacity-[0.12] z-0 pointer-events-none grayscale group-hover:grayscale-0" />
                  )}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 5: 精选教程 ══════════════════════════════ */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-amber-500" />
              <span className="text-amber-500 font-semibold text-sm tracking-widest uppercase">Latest Tutorials</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3">最新系列教程</h2>
            <p className="text-slate-500 dark:text-slate-400">复星证券系列 — 手把手带你完成开户与入金全流程</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                step: "01",
                tag: "新手必看",
                tagColor: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
                title: "2026 年复星券商开户详细教程",
                desc: "复星证券完整开户教程，含费率对比、福利政策、入金方式详解。46 年港资零售券商 No.1，仅凭身份证即可完成开户。",
                href: "/articles/broker/sQSbLRe8",
                accent: "from-amber-400 to-orange-500",
                border: "border-amber-200 dark:border-amber-800/40",
                bg: "bg-amber-50/50 dark:bg-amber-900/10",
              },
              {
                step: "02",
                tag: "进阶操作",
                tagColor: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
                title: "众安 & Ifast 银行入金复星最全教程",
                desc: "详解如何通过众安银行与 Ifast 数字银行向复星证券入金，无港卡用户的最佳入金选择，最快四小时即可到账。",
                href: "/articles/broker/myu8sVmc",
                accent: "from-blue-400 to-sky-500",
                border: "border-blue-200 dark:border-blue-800/40",
                bg: "bg-blue-50/50 dark:bg-blue-900/10",
              },
            ].map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className={`group relative rounded-3xl border ${item.border} ${item.bg} p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden`}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className={`text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br ${item.accent} opacity-20 select-none leading-none`}>
                    {item.step}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${item.tagColor}`}>{item.tag}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug mb-3 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                  {item.desc}
                </p>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400">
                  <span>立即阅读</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECTION 6: 联系 ══════════════════════════════════ */}
      <section className="py-20 bg-white dark:bg-slate-900/50">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-black text-slate-900 dark:text-slate-50 mb-4">想要建立商务合作？</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-8">无论是项目推广、工具开发还是深度投研，欢迎随时通过推特联系我</p>
          <a href={getSafeExternalUrl("https://x.com/WiseInvest513")} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-full font-bold hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 transition-all shadow-lg hover:shadow-amber-200">
            <Twitter className="w-4 h-4" />
            <span>推特联系我</span>
          </a>
        </div>
      </section>

    </div>
  );
}
