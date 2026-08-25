import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Flag,
  Gift,
  Landmark,
  MessageCircle,
  MousePointerClick,
  Route,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { CommunityDialogLauncher } from "./community-dialog-launcher";
import { siteConfig } from "@/lib/config";
import { starterPaths, starterSeoKeywords } from "@/lib/get-started";

export const metadata: Metadata = {
  title: "Wise Invest 行动入口：注册、领取福利、开卡、开户、定投和工具",
  description: "Wise Invest 行动入口页，集中放置交易所注册、虚拟 U 卡申请、港美股券商开户、境外银行、定投实盘、投资工具和社群反馈入口。",
  keywords: ["Wise Invest 行动入口", "Wise Invest 福利", "币安邀请码", "虚拟 U 卡申请", "港美股开户", "境外银行", "BTC 定投", ...starterSeoKeywords],
  alternates: {
    canonical: siteConfig.url("/get"),
  },
  openGraph: {
    title: "Wise Invest 行动入口",
    description: "注册、领取、开卡、开户、定投和工具都从这里进入。",
    url: siteConfig.url("/get"),
    siteName: siteConfig.name,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Wise Invest 行动入口",
    description: "注册、领取、开卡、开户、定投和工具都从这里进入。",
  },
};

const actionGroups = [
  {
    title: "注册和领取",
    description: "适合已经决定要注册交易所、开卡、开户或领取福利的人。",
    items: [
      { label: "交易所返佣福利", href: "/perk/crypto", note: "Binance、OKX、Bybit、Bitget、Gate" },
      { label: "虚拟 U 卡资料库", href: "/card", note: "MPCard、Bitget Wallet、SafePal、BenPay" },
      { label: "港美股券商开户", href: "/perk/broker", note: "盈透、嘉信、复星、长桥等" },
      { label: "境外银行入口", href: "/perk/bank", note: "Wise、香港银行、新加坡银行、见证开户" },
    ],
  },
  {
    title: "学习和实操",
    description: "适合还没有完全确定路径，想先看教程和真实记录的人。",
    items: [
      { label: "新手入门路径", href: "/start", note: "不知道先看什么，从这里开始" },
      { label: "虚拟 U 卡教程", href: "/articles/vcard", note: "开卡、KYC、充值、绑定支付" },
      { label: "交易所注册教程", href: "/articles/crypto", note: "注册、KYC、C2C 入金、买币" },
      { label: "BTC / ETH 定投实盘", href: "/practice/dca-investment", note: "收益曲线和定投明细" },
    ],
  },
  {
    title: "计算和检查",
    description: "适合准备投入资金前，先把金额、仓位、成本和风险算清楚的人。",
    items: [
      { label: "复利计算器", href: "/tools/compound-calculator", note: "测算长期定投和年化收益" },
      { label: "仓位管理", href: "/tools/position-calculator", note: "计算单笔风险和仓位大小" },
      { label: "补仓计算器", href: "/tools/average-down", note: "计算补仓后成本和回本涨幅" },
      { label: "合约计算器", href: "/tools/contract-calculator", note: "计算保证金、盈亏和强平价格" },
    ],
  },
];

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "如何使用 Wise Invest 找到教程、福利和工具",
  description: "按目标选择入口，先阅读教程，再进入对应注册链接或工具页面。",
  step: starterPaths.map((path, index) => ({
    "@type": "HowToStep",
    position: index + 1,
    name: path.title,
    text: path.description,
    url: siteConfig.url(path.href),
  })),
};

const actionSteps = [
  {
    step: "01",
    title: "选入口",
    desc: "交易所、U 卡、券商、银行、定投和工具先分流。",
    href: "/start",
  },
  {
    step: "02",
    title: "看教程",
    desc: "进入对应文章，确认注册、KYC、入金、开卡或开户条件。",
    href: "/articles",
  },
  {
    step: "03",
    title: "去完成",
    desc: "使用站内整理过的链接、邀请码和操作说明。",
    href: "/perk",
  },
  {
    step: "04",
    title: "回头检查",
    desc: "用工具算成本、仓位、收益率，必要时进群反馈。",
    href: "/tools",
  },
];

const heroActions = [
  { label: "交易所福利", href: "/perk/crypto", desc: "买币、USDT、C2C、返佣", icon: ShieldCheck },
  { label: "虚拟 U 卡", href: "/card", desc: "AI 订阅、Apple Pay、消费", icon: Gift },
  { label: "港美股开户", href: "/perk/broker", desc: "美股、ETF、港股", icon: Landmark },
];

export default function GetPage() {
  return (
    <main className="min-h-screen bg-slate-50 dot-grid dot-grid-light dark:bg-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />

      <section className="relative overflow-hidden border-b border-slate-200 bg-white px-4 py-10 dark:border-slate-800 dark:bg-slate-950 md:px-6 md:py-14">
        <div className="absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.18),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(15,23,42,0.08),transparent_30%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.16),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.07),transparent_30%)]" aria-hidden />
        <div className="relative mx-auto max-w-6xl">
          <div className="grid gap-7 lg:grid-cols-[1fr_28rem] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                <Gift className="h-3.5 w-3.5" />
                Wise Invest 领取站
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-slate-950 dark:text-white md:text-6xl">
                先确认路径，再领取链接和邀请码
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">
                这里不做大目录。先把常见动作拆成四步：选入口、看教程、去完成、回头检查。用户知道自己要做什么后，再进入对应产品页。
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/start"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-black text-amber-300 transition-colors hover:bg-amber-400 hover:text-slate-950 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
                >
                  先看路线图
                  <Route className="h-4 w-4" />
                </Link>
                <Link
                  href="/perk"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-amber-700 dark:hover:bg-amber-900/20"
                >
                  直接看福利
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-4 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] dark:border-slate-800">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-black text-amber-300">QUICK ACTION</span>
                <MousePointerClick className="h-4 w-4 text-amber-300" />
              </div>
              <div className="mt-4 grid gap-3">
                {heroActions.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 p-3 transition-colors hover:border-amber-300/60 hover:bg-amber-300/12"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-slate-950">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-black">{item.label}</div>
                        <div className="mt-0.5 text-xs font-semibold text-slate-300">{item.desc}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-300" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <section className="grid gap-4 lg:grid-cols-4">
          {actionSteps.map((item) => (
            <Link
              key={item.step}
              href={item.href}
              className="group relative rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_16px_42px_rgba(15,23,42,0.055)] transition-colors hover:border-amber-300 hover:bg-amber-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-700 dark:hover:bg-amber-900/15"
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="text-xs font-black text-amber-600 dark:text-amber-300">{item.step}</span>
                <Flag className="h-4 w-4 text-slate-300 transition-colors group-hover:text-amber-500" />
              </div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">{item.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">{item.desc}</p>
            </Link>
          ))}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_52px_rgba(15,23,42,0.055)] dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h2 className="text-xl font-black text-slate-950 dark:text-white">按目标拿入口</h2>
            </div>
            <div className="grid gap-3">
              {starterPaths.map((path) => (
                <Link
                  key={path.id}
                  href={path.href}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 transition-colors hover:border-amber-300 hover:bg-amber-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-amber-700 dark:hover:bg-amber-900/15"
                >
                  <div>
                    <div className="text-sm font-black text-slate-950 dark:text-white">{path.title}</div>
                    <div className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">{path.primaryAction}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-500" />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_52px_rgba(15,23,42,0.055)] dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-500" />
              <h2 className="text-xl font-black text-slate-950 dark:text-white">常用动作</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {actionGroups.map((group) => (
                <div key={group.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                  <h3 className="text-sm font-black text-slate-950 dark:text-white">{group.title}</h3>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{group.description}</p>
                  <div className="mt-3 space-y-2">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-amber-50 hover:text-amber-700 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-800 dark:hover:bg-amber-900/20 dark:hover:text-amber-200"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-black text-amber-800 dark:text-amber-200">
                <CheckCircle2 className="h-4 w-4" />
                找不到或者遇到问题
              </div>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
                链接失效、邀请码没绑上、费率变化、开户卡住，直接进群反馈。站内教程会根据实际问题持续更新。
              </p>
            </div>
            <CommunityDialogLauncher>
              <MessageCircle className="h-4 w-4" />
              加入群聊反馈
              <ExternalLink className="h-3.5 w-3.5" />
            </CommunityDialogLauncher>
          </div>
        </section>
      </div>
    </main>
  );
}
