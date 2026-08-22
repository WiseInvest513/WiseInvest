"use client";

import { useEffect, useState, useRef } from "react";
import { Twitter, Youtube, Video, Instagram, MessageCircle, ArrowUpRight, TrendingUp, Bitcoin, BookOpen, Target, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { getSafeExternalUrl } from "@/lib/security/external-links";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const socialCounts = {
  twitter: 47500,
  youtube: 3130,
  bilibili: 12873,
  xiaohongshu: 28159,
} as const;

const totalFollowers = Object.values(socialCounts).reduce((sum, count) => sum + count, 0);

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
  { month: "26/05", twitter: 36363,youtube: 2310,bilibili: 12873,xiaohongshu: 19528},
  { month: "26/06", twitter: 42670,youtube: 2490,bilibili: 12873,xiaohongshu: 28159},
  { month: "26/08", ...socialCounts },
];

// ─── 社媒数据 ──────────────────────────────────────────────
const socials = [
  { name: "Twitter / X",    count: socialCounts.twitter, label: "Followers",          Icon: Twitter,        pngPath: "https://cdn.simpleicons.org/x/000000",          color: "hover:border-slate-500 hover:shadow-slate-200",  cardTone: "border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/40",    text: "text-slate-900 dark:text-slate-100", bg: "bg-slate-100 dark:bg-slate-800",       link: "https://x.com/WiseInvest513" },
  { name: "Little Red Book",count: socialCounts.xiaohongshu, label: "Followers",          Icon: Instagram,      pngPath: "https://cdn.simpleicons.org/xiaohongshu/FF2442", color: "hover:border-rose-500 hover:shadow-rose-100",    cardTone: "border-rose-100 dark:border-rose-800/40 bg-rose-50/35 dark:bg-rose-900/10",       text: "text-rose-500",                      bg: "bg-rose-50",                           link: "https://www.xiaohongshu.com/user/profile/6373a8ba0000000024014988" },
  { name: "YouTube",         count: socialCounts.youtube,  label: "Subscribers",        Icon: Youtube,        pngPath: "https://cdn.simpleicons.org/youtube/FF0000",     color: "hover:border-red-500 hover:shadow-red-100",      cardTone: "border-red-100 dark:border-red-800/40 bg-red-50/35 dark:bg-red-900/10",           text: "text-red-600",                       bg: "bg-red-50",                            link: "https://www.youtube.com/@WiseInvest513" },
  { name: "Bilibili",        count: socialCounts.bilibili, label: "Fans",               Icon: Video,          pngPath: "https://cdn.simpleicons.org/bilibili/00A1D6",    color: "hover:border-blue-400 hover:shadow-blue-100",    cardTone: "border-blue-100 dark:border-blue-800/40 bg-blue-50/35 dark:bg-blue-900/10",       text: "text-blue-500",                      bg: "bg-blue-50 dark:bg-blue-900/20",       link: "https://space.bilibili.com/347066091" },
  { name: "Douyin",          count: 0,     displayValue: "Follow Me",   label: "Fans · 抖音",Icon: Video,          pngPath: "https://cdn.simpleicons.org/tiktok/000000",     color: "hover:border-slate-700 hover:shadow-slate-200",  cardTone: "border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/40",    text: "text-slate-900 dark:text-slate-100", bg: "bg-slate-100 dark:bg-slate-800",       link: "https://v.douyin.com/WfJLuLqm9k8" },
  { name: "WeChat Group",    count: 0,     displayValue: "Join Group",  label: "Official Community", Icon: MessageCircle, pngPath: "https://cdn.simpleicons.org/wechat/07C160", color: "hover:border-green-500 hover:shadow-green-100",  cardTone: "border-green-100 dark:border-green-800/40 bg-green-50/35 dark:bg-green-900/10",    text: "text-green-600",                     bg: "bg-green-50",                          isModal: true },
] as const;

// ─── 坚持的事 ─────────────────────────────────────────────
type CommitmentChartLine = {
  key: string;
  name: string;
  color: string;
};

type CommitmentItem = {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  title: string;
  since: string;
  desc: string;
  stats: { label: string; value: string }[];
  href: string;
  chart?: {
    label: string;
    data: Record<string, string | number>[];
    lines: CommitmentChartLine[];
  };
};

const commitments: CommitmentItem[] = [
  {
    icon: Target,
    color: "from-slate-700 to-slate-950",
    bgColor: "bg-slate-50 dark:bg-slate-900/70",
    borderColor: "border-slate-200 dark:border-slate-700",
    title: "持续 DCA",
    since: "日线持续更新",
    desc: "跟踪 BTC、ETH 与 QQQ 距离 52 周高点的回撤，判断当前处于常规定投、击球区还是深度击球区。基础定投不停，回撤到线后再决定是否启用备用资金。",
    stats: [
      { label: "跟踪产品", value: "BTC · ETH · QQQ" },
      { label: "击球区", value: "回撤 10%" },
      { label: "深度区", value: "回撤 20%" },
    ],
    href: "/DCA",
  },
  {
    icon: Bitcoin,
    color: "from-orange-400 to-amber-500",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    borderColor: "border-orange-200 dark:border-orange-800/40",
    title: "BTC / ETH 定投",
    since: "2025 年 08 月起",
    desc: "BTC / ETH 是已经开始执行的长期定投记录，不择时、不预测，用时间换收益。记录每一笔买入，公开持仓与盈亏，和大家一起穿越牛熊。",
    stats: [
      { label: "产品", value: "BTC · ETH" },
      { label: "定投周期", value: "12+ 个月" },
      { label: "记录", value: "全程公开" },
    ],
    href: "/practice/dca-investment",
    chart: {
      label: "BTC / ETH 累计执行节奏",
      data: [
        { month: "25/08", btc: 1, eth: 1 },
        { month: "25/11", btc: 4, eth: 4 },
        { month: "26/02", btc: 7, eth: 7 },
        { month: "26/05", btc: 10, eth: 10 },
        { month: "26/08", btc: 13, eth: 13 },
      ],
      lines: [
        { key: "btc", name: "BTC", color: "#f59e0b" },
        { key: "eth", name: "ETH", color: "#6366f1" },
      ],
    },
  },
  {
    icon: TrendingUp,
    color: "from-yellow-400 to-indigo-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    borderColor: "border-yellow-200 dark:border-yellow-800/40",
    title: "BNB / QQQ 定投",
    since: "计划启动",
    desc: "BNB 和 QQQ 放在同一个定投入口里，进入后再选择查看 BNB 还是 QQQ。两套逻辑独立展示，后续有真实数据后再分别接入。",
    stats: [
      { label: "产品", value: "BNB · QQQ" },
      { label: "曲线", value: "分开展示" },
      { label: "状态", value: "计划启动" },
    ],
    href: "/practice/binance-dca",
    chart: {
      label: "BNB / QQQ 计划入口",
      data: [
        { month: "准备", bnb: 0, qqq: 0 },
        { month: "第 1 期", bnb: 1, qqq: 1 },
        { month: "第 2 期", bnb: 2, qqq: 2 },
        { month: "第 3 期", bnb: 3, qqq: 3 },
      ],
      lines: [
        { key: "bnb", name: "BNB", color: "#f0b90b" },
        { key: "qqq", name: "QQQ", color: "#4f46e5" },
      ],
    },
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
  const [chartsMounted, setChartsMounted] = useState(false);

  const [wechatGroupOpen, setWechatGroupOpen] = useState(false);

  useEffect(() => {
    setChartsMounted(true);
  }, []);

  const handleWechatGroupClose = (noShowToday: boolean) => {
    if (noShowToday) {
      const today = new Date().toDateString();
      localStorage.setItem("wechatGroupNoShow", today);
    }
    setWechatGroupOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-x-hidden dot-grid dot-grid-light">

      {/* ══ 微信群聊弹窗 ════════════════════════════════════ */}
      <Dialog open={wechatGroupOpen} onOpenChange={setWechatGroupOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
          {/* 头部 */}
          <DialogHeader className="px-6 pt-6 pb-0">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-green-600 mb-1">WISEINVEST 社区</p>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
              欢迎加入官方微信群聊
            </DialogTitle>
          </DialogHeader>

          {/* 内容 */}
          <div className="px-6 pb-6 flex flex-col items-center text-center">
            <img
              src="/群聊.png"
              alt="微信群聊二维码"
              className="w-full rounded-xl mb-4 object-contain"
            />

            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
              扫码加入群聊，与志同道合的投资者一起交流
            </p>

            <button
              onClick={() => handleWechatGroupClose(false)}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              进入平台
            </button>

            <button
              onClick={() => handleWechatGroupClose(true)}
              className="mt-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              今日不再提示
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ SECTION 1: Hero ══════════════════════════════════ */}
      <section className="min-h-[60vh] md:min-h-[80vh] flex items-center">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-20 w-full">
          <div
            ref={heroFade.ref}
            className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center transition-all duration-1000 ${heroFade.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            {/* 左：图片区域 */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-52 h-52 sm:w-72 sm:h-72 lg:w-96 lg:h-96">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 rotate-6" />
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-400/10 to-orange-500/10 -rotate-3" />
                <div className="relative w-full h-full rounded-3xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-2xl shadow-amber-200/30 dark:shadow-amber-900/20">
                  <img
                    src="/images/profile/avatar.png"
                    alt="Wise Invest"
                    className="w-full h-full object-cover"
                    onError={e => { e.currentTarget.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=WiseInvest"; }}
                  />
                </div>
                <div className="absolute -bottom-3 -left-2 md:-bottom-4 md:-left-4 bg-white dark:bg-slate-900 rounded-2xl px-3 py-2 md:px-4 md:py-2.5 shadow-lg border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <span className="text-lg">🚀</span>
                  <div>
                    <div className="text-[10px] md:text-xs text-slate-400">内容创作</div>
                    <div className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100">从 2025.08 开始</div>
                  </div>
                </div>
                <div className="absolute -top-3 -right-2 md:-top-4 md:-right-4 bg-white dark:bg-slate-900 rounded-2xl px-3 py-2 md:px-4 md:py-2.5 shadow-lg border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <span className="text-lg">📈</span>
                  <div>
                    <div className="text-[10px] md:text-xs text-slate-400">全网粉丝</div>
                    <div className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100">{totalFollowers.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 右：文字介绍 */}
            <div className="space-y-6">
              <div>
                <p className="text-amber-500 font-semibold text-sm tracking-widest uppercase mb-2">Web3 & Investment Creator</p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-4">
                  Wise<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Invest</span>
                </h1>
                <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
                  2025 年 8 月从零开始，专注 Web3 与港美股投资的独立内容创作者。
                </p>
              </div>

              <div className="space-y-3 text-slate-600 dark:text-slate-400 leading-relaxed">
                <p className="text-sm md:text-base">在全网 5 个平台持续输出高质量投资内容，分享理性的投资逻辑、实用的出入金工具，以及 Web3 的前沿机会。</p>
                <p className="text-sm md:text-base">坚信<strong className="text-slate-800 dark:text-slate-200">「普通人也可以通过结构化优势在市场中找到自己的阿尔法」</strong>，并用实盘数据证明这一点。</p>
              </div>

              <div className="grid grid-cols-3 gap-2 md:gap-4 pt-2">
                {[
                  { value: "8", unit: "个月", label: "从零到万粉" },
                  { value: "5", unit: "个平台", label: "同步更新" },
                  { value: totalFollowers.toLocaleString(), unit: "", label: "全网粉丝" },
                ].map((stat, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 rounded-xl p-2.5 md:p-4 border border-slate-100 dark:border-slate-800 text-center shadow-sm">
                    <div className="text-lg md:text-2xl font-black text-slate-900 dark:text-white">{stat.value}<span className="text-sm font-medium text-slate-400 ml-0.5">{stat.unit}</span></div>
                    <div className="text-[10px] md:text-xs text-slate-400 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 md:gap-3 pt-2">
                <a href={getSafeExternalUrl("https://x.com/WiseInvest513")} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 md:px-6 md:py-2.5 rounded-xl font-semibold text-xs md:text-sm hover:bg-amber-500 hover:text-white transition-all shadow-md">
                  <Twitter className="w-4 h-4" /> 关注我
                </a>
                <button
                  onClick={() => setWechatGroupOpen(true)}
                  className="inline-flex items-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 md:px-6 md:py-2.5 rounded-xl font-semibold text-xs md:text-sm hover:border-green-400 hover:text-green-600 transition-all">
                  <MessageCircle className="w-4 h-4" /> 加入社群
                </button>
                <Link
                  href="/resources"
                  className="inline-flex items-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 md:px-6 md:py-2.5 rounded-xl font-semibold text-xs md:text-sm hover:border-amber-400 hover:text-amber-600 transition-all">
                  <BookOpen className="w-4 h-4" /> 资料库
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 2: 增长曲线 ══════════════════════════════ */}
      <section className="py-10 md:py-20 bg-white dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div
            ref={growthFade.ref}
            className={`transition-all duration-1000 ${growthFade.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="mb-6 md:mb-10">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                <span className="text-amber-500 font-semibold text-sm tracking-widest uppercase">Growth Story</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-3">从零开始的增长轨迹</h2>
              <p className="text-slate-500 dark:text-slate-400">2025 年 8 月从零粉丝起步，目前全网累计 {totalFollowers.toLocaleString()} 位关注者</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
              {chartsMounted ? (
                <ResponsiveContainer width="100%" height={260} minWidth={1}>
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
              ) : (
                <div className="h-[260px]" aria-hidden="true" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              {[
                { month: "25/09", event: "首月破三千", icon: "🎯" },
                { month: "25/10", event: "Twitter 破万", icon: "🔥" },
                { month: "25/12", event: "Twitter 破两万", icon: "⚡" },
                { month: "26/08", event: "全网突破 9 万", icon: "🚀" },
              ].map((m, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 flex items-center gap-3">
                  <span className="text-xl">{m.icon}</span>
                  <div>
                    <div className="text-xs text-slate-400">{m.month}</div>
                    <div className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100">{m.event}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 3: 在坚持的事 ════════════════════════════ */}
      <section className="py-10 md:py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div
            ref={commitFade.ref}
            className={`transition-all duration-1000 ${commitFade.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="mb-6 md:mb-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-500 font-semibold text-sm tracking-widest uppercase">Commitments</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-3">一直在坚持的事</h2>
              <p className="text-slate-500 dark:text-slate-400">不只是内容，更是真实的实践——所有数据全程公开</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3 md:gap-4">
              {commitments.map((item, i) => {
                const Icon = item.icon;
                return (
                  <Link key={i} href={item.href}
                    className={`group relative flex h-full w-full flex-col rounded-3xl border ${item.borderColor} ${item.bgColor} p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden`}
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">{item.since}</div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white md:text-lg">{item.title}</h3>
                      </div>
                      <ArrowUpRight className="ml-auto h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-amber-500 dark:text-slate-600" />
                    </div>
                    <p className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.desc}</p>
                    {item.chart && (
                      <div className="mb-4 rounded-2xl border border-white/80 bg-white/70 p-3 shadow-inner shadow-white/70 dark:border-slate-800 dark:bg-slate-950/55 dark:shadow-none">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="text-[11px] font-black text-slate-400">{item.chart.label}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-400 dark:bg-slate-900">独立展示</span>
                        </div>
                        <div className="h-[62px]">
                          {chartsMounted ? (
                            <ResponsiveContainer width="100%" height="100%" minWidth={1}>
                              <LineChart data={item.chart.data} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
                                <XAxis dataKey="month" hide />
                                <YAxis hide domain={["dataMin", "dataMax"]} />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }} />
                                {item.chart.lines.map((line) => (
                                  <Line
                                    key={line.key}
                                    type="monotone"
                                    dataKey={line.key}
                                    name={line.name}
                                    stroke={line.color}
                                    strokeWidth={2.5}
                                    dot={false}
                                    activeDot={{ r: 4 }}
                                  />
                                ))}
                              </LineChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full" aria-hidden="true" />
                          )}
                        </div>
                      </div>
                    )}
                    <div className="mt-auto">
                      <div className="grid grid-cols-3 gap-2">
                        {item.stats.map((stat, j) => (
                          <div key={j} className="rounded-lg bg-white/80 p-2 text-center dark:bg-slate-950/80 md:p-3">
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 md:text-sm">{stat.value}</div>
                            <div className="mt-0.5 text-[10px] text-slate-400 md:text-[11px]">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 4: 社媒数字 ══════════════════════════════ */}
      <section className="py-10 md:py-20 bg-white dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div
            ref={socialFade.ref}
            className={`transition-all duration-1000 ${socialFade.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="mb-6 md:mb-10">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-3">全网社媒分布</h2>
              <p className="text-slate-500 dark:text-slate-400">点击任意平台卡片，直接访问对应主页</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {socials.map((item, idx) => {
                const isModal = "isModal" in item && item.isModal;
                const cardClass = `group relative overflow-hidden p-5 md:p-8 rounded-3xl border ${item.cardTone} transition-all duration-300 hover:-translate-y-1 ${item.color} shadow-sm hover:shadow-xl w-full text-left`;

                const cardInner = (
                  <>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-5 md:mb-8">
                        <div className={`p-3 rounded-2xl transition-colors ${item.bg} ${item.text}`}>
                          <item.Icon className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-2">
                          {item.name === "WeChat Group" && (
                            <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/40 px-2 py-0.5 text-[10px] font-bold tracking-wide text-green-700 dark:text-green-300">LIVE</span>
                          )}
                          <ArrowUpRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                          {"displayValue" in item && item.displayValue ? (
                            <span className="text-2xl md:text-3xl">{item.displayValue}</span>
                          ) : (
                            <AnimatedNumber value={item.count} />
                          )}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                          {item.label}
                          {item.name === "WeChat Group" ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-semibold">微信扫码进群</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">{item.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {item.pngPath && (
                      <img src={item.pngPath} alt="" className="absolute -bottom-12 -right-12 w-48 h-48 opacity-[0.08] rotate-12 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:opacity-[0.12] z-0 pointer-events-none grayscale group-hover:grayscale-0" />
                    )}
                  </>
                );

                if (isModal) {
                  return (
                    <button key={idx} onClick={() => setWechatGroupOpen(true)} className={cardClass}>
                      {cardInner}
                    </button>
                  );
                }

                return (
                  <a key={idx} href={getSafeExternalUrl((item as any).link)} target="_blank" rel="noopener noreferrer" className={cardClass}>
                    {cardInner}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 5: 美股投资教程 ══════════════════════════ */}
      <section className="py-10 md:py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="mb-6 md:mb-10">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-amber-500" />
              <span className="text-amber-500 font-semibold text-sm tracking-widest uppercase">US Stock Guide</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-3">美股投资教程</h2>
            <p className="text-slate-500 dark:text-slate-400">先选一条适合你的资金路线，再进入学习路线查看完整产品与操作方案</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                step: "01",
                tag: "传统方式",
                tagColor: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
                title: "传统美股：通过中转卡入金券商",
                desc: "适合习惯使用传统券商的人。先解决资金中转，再把资金汇入美股券商账户。",
                flow: ["国内资金", "中转卡 / 港卡 / 美卡", "美股券商"],
                href: "/roadmap?route=traditional-us-stocks",
                accent: "from-amber-400 to-orange-500",
                border: "border-amber-200 dark:border-amber-800/40",
                bg: "bg-amber-50/50 dark:bg-amber-900/10",
              },
              {
                step: "02",
                tag: "链上方式",
                tagColor: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
                title: "链上美股：从法币入金到链上产品",
                desc: "适合已经使用加密平台的人。通过 OTC / C2C 完成入金，再选择链上美股产品。",
                flow: ["支付宝 / 微信", "币安 / 欧易 OTC · C2C", "链上美股产品"],
                href: "/roadmap?route=onchain-us-stocks",
                accent: "from-blue-400 to-sky-500",
                border: "border-blue-200 dark:border-blue-800/40",
                bg: "bg-blue-50/50 dark:bg-blue-900/10",
              },
            ].map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className={`group relative rounded-3xl border ${item.border} ${item.bg} p-5 md:p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden`}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className={`text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br ${item.accent} opacity-20 select-none leading-none`}>
                    {item.step}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${item.tagColor}`}>{item.tag}</span>
                </div>
                <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white leading-snug mb-3 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                  {item.desc}
                </p>
                <div className="flex flex-wrap items-center gap-2 mb-6" aria-label={`${item.title}资金流程`}>
                  {item.flow.map((flowStep, flowIndex) => (
                    <div key={flowStep} className="contents">
                      <span className="rounded-full border border-white/80 dark:border-slate-700 bg-white/75 dark:bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm">
                        {flowStep}
                      </span>
                      {flowIndex < item.flow.length - 1 && (
                        <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">→</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400">
                  <span>查看完整学习路线</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECTION 6: 联系 ══════════════════════════════════ */}
      <section className="py-10 md:py-20 bg-white dark:bg-slate-900/50">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
          <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 mb-3">想要建立商务合作？</h3>
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
