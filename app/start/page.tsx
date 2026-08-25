import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Flag,
  Link2,
  Map,
  Milestone,
  Route,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
import { siteConfig } from "@/lib/config";
import { quickAnswerItems, starterPaths, starterSeoKeywords } from "@/lib/get-started";

export const metadata: Metadata = {
  title: "Wise Invest 新手入门：交易所、虚拟 U 卡、港美股、境外银行和定投路线",
  description: "Wise Invest 新手入门页，按问题引导用户找到交易所注册、虚拟 U 卡、港美股券商、境外银行、BTC/ETH 定投和投资工具入口。",
  keywords: ["Wise Invest 新手入门", "投资学习路线", "虚拟 U 卡教程", "币安注册", "港美股开户", "境外银行开户", "BTC 定投", ...starterSeoKeywords],
  alternates: {
    canonical: siteConfig.url("/start"),
  },
  openGraph: {
    title: "Wise Invest 新手入门",
    description: "不知道先看什么，从这页按问题进入。",
    url: siteConfig.url("/start"),
    siteName: siteConfig.name,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Wise Invest 新手入门",
    description: "按问题找到交易所、U 卡、券商、银行、定投和工具入口。",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: quickAnswerItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

const routeStages = [
  {
    step: "01",
    title: "先判断你要解决的问题",
    desc: "是买币、开卡、买美股、准备银行账户，还是开始长期定投。",
    icon: Compass,
  },
  {
    step: "02",
    title: "进入对应路线",
    desc: "每条路线只保留必要教程、福利入口和常用工具，减少来回找页面。",
    icon: Route,
  },
  {
    step: "03",
    title: "完成第一笔小额操作",
    desc: "注册、KYC、入金、开卡、开户都先小额测试，不直接上复杂玩法。",
    icon: CheckCircle2,
  },
  {
    step: "04",
    title: "用工具和记录长期跟踪",
    desc: "把成本、仓位、收益曲线和问题反馈沉淀下来，后续再优化路径。",
    icon: Target,
  },
];

const flowNodes = [
  {
    pathId: "crypto",
    step: "01",
    phase: "入口",
    label: "先有交易所",
    hint: "注册、KYC、入金、买币",
    x: 7,
    y: 18,
  },
  {
    pathId: "vcard",
    step: "02",
    phase: "支付",
    label: "再接 U 卡",
    hint: "AI 订阅、Apple Pay、日常支付",
    x: 24,
    y: 47,
  },
  {
    pathId: "bank",
    step: "03",
    phase: "账户",
    label: "准备银行",
    hint: "美元、港币、券商入金",
    x: 43,
    y: 28,
  },
  {
    pathId: "broker",
    step: "04",
    phase: "市场",
    label: "进入港美股",
    hint: "券商、ETF、美股、港股",
    x: 61,
    y: 57,
  },
  {
    pathId: "dca",
    step: "05",
    phase: "长期",
    label: "开始定投",
    hint: "BTC、ETH、QQQ 成本跟踪",
    x: 78,
    y: 34,
  },
  {
    pathId: "tools",
    step: "06",
    phase: "复盘",
    label: "用工具校准",
    hint: "仓位、补仓、复利、收益率",
    x: 88,
    y: 70,
  },
];

const featuredPathIds = new Set(["crypto", "vcard"]);

export default function StartPage() {
  const featuredPaths = starterPaths.filter((path) => featuredPathIds.has(path.id));
  const secondaryPaths = starterPaths.filter((path) => !featuredPathIds.has(path.id));

  return (
    <main className="min-h-screen bg-slate-50 dot-grid dot-grid-light dark:bg-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <section className="relative overflow-hidden border-b border-slate-200 bg-slate-950 px-4 pb-10 pt-14 text-white dark:border-slate-800 md:px-6 md:pb-14 md:pt-18">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(245,158,11,0.11)_1px,transparent_1px),linear-gradient(0deg,rgba(245,158,11,0.09)_1px,transparent_1px)] bg-[size:44px_44px] opacity-35" aria-hidden />
        <div className="absolute left-1/2 top-0 h-64 w-[44rem] -translate-x-1/2 rounded-full bg-amber-500/18 blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_25rem] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/35 bg-amber-400/10 px-3 py-1 text-xs font-black text-amber-300">
                <Map className="h-3.5 w-3.5" />
                Wise Invest 路线图
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight text-white md:text-6xl">
                不要先逛菜单，先走一条清晰的投资入门路线
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
                Wise Invest 把交易所、虚拟 U 卡、港美股券商、境外银行和长期定投串成可执行路径。你只需要判断自己在哪一步，然后沿着路线进入教程、产品、邀请码和工具。
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="#route"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-black text-slate-950 transition-colors hover:bg-amber-300"
                >
                  查看四步路线
                  <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  href="/roadmap"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/8 px-6 py-3 text-sm font-black text-white transition-colors hover:bg-white/14"
                >
                  进入学习路线
                </Link>
              </div>
            </div>
            <div className="rounded-[24px] border border-white/12 bg-white/8 p-4 shadow-2xl shadow-black/20 backdrop-blur">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-black text-amber-300">PATH STATUS</span>
                <Sparkles className="h-4 w-4 text-amber-300" />
              </div>
              <div className="mt-4 space-y-3">
                {["识别需求", "选择产品", "完成操作", "长期跟踪"].map((item, index) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-xs font-black text-slate-950">
                      {index + 1}
                    </div>
                    <div className="h-px flex-1 bg-white/12" />
                    <span className="w-20 text-right text-sm font-bold text-slate-200">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm font-semibold leading-6 text-amber-100">
                适合第一次进入网站、不知道先看哪篇教程的人。
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <section id="route" className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_52px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900 md:p-6">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-black text-amber-600 dark:text-amber-300">
                <Link2 className="h-4 w-4" />
                链路地图
              </div>
              <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white md:text-3xl">一条路径，把产品、教程、福利和工具串起来</h2>
            </div>
            <Link href="/get" className="inline-flex items-center gap-2 text-sm font-black text-amber-700 hover:text-amber-600 dark:text-amber-300">
              已经知道要做什么，去行动入口
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative hidden min-h-[500px] rounded-[26px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950 md:block">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(0deg,rgba(148,163,184,0.14)_1px,transparent_1px)] bg-[size:36px_36px]" aria-hidden />
            <div className="absolute left-5 top-5 z-10 rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-black text-amber-700 shadow-sm dark:border-amber-800 dark:bg-slate-900 dark:text-amber-300">
              从资金入口流向长期系统
            </div>
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 1000 500"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path
                d="M72 122 C 178 42 275 248 393 162 C 508 78 555 92 632 236 C 700 364 801 132 878 300 C 910 370 936 386 970 358"
                fill="none"
                stroke="rgba(245,158,11,0.16)"
                strokeWidth="38"
                strokeLinecap="round"
              />
              <path
                d="M72 122 C 178 42 275 248 393 162 C 508 78 555 92 632 236 C 700 364 801 132 878 300 C 910 370 936 386 970 358"
                fill="none"
                stroke="rgba(245,158,11,0.75)"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M72 122 C 178 42 275 248 393 162 C 508 78 555 92 632 236 C 700 364 801 132 878 300 C 910 370 936 386 970 358"
                fill="none"
                stroke="rgba(255,255,255,0.82)"
                strokeDasharray="10 18"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>

            {flowNodes.map((node) => {
              const path = starterPaths.find((item) => item.id === node.pathId);
              if (!path) return null;
              const Icon = path.icon;

              return (
                <Link
                  key={node.pathId}
                  href={path.href}
                  className="group absolute z-20 w-44 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                >
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-slate-950 text-amber-300 shadow-[0_18px_40px_rgba(15,23,42,0.24)] transition-transform group-hover:scale-105 dark:border-slate-900 dark:bg-amber-400 dark:text-slate-950">
                    <div className="text-center">
                      <Icon className="mx-auto h-7 w-7" />
                      <div className="mt-1 text-[11px] font-black">{node.step}</div>
                    </div>
                  </div>
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 text-center shadow-[0_12px_28px_rgba(15,23,42,0.1)] backdrop-blur transition-colors group-hover:border-amber-300 group-hover:bg-amber-50 dark:border-slate-800 dark:bg-slate-900/95 dark:group-hover:border-amber-700 dark:group-hover:bg-amber-900/20">
                    <div className="text-[11px] font-black uppercase text-amber-600 dark:text-amber-300">{node.phase}</div>
                    <h3 className="mt-0.5 text-sm font-black text-slate-950 dark:text-white">{node.label}</h3>
                    <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500 dark:text-slate-400">{node.hint}</p>
                  </div>
                </Link>
              );
            })}

            <div className="absolute bottom-5 left-5 z-10 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              <Milestone className="h-4 w-4 text-amber-500" />
              每个圆点都可以直接进入对应页面
            </div>
          </div>

          <div className="relative rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 md:hidden">
            <div className="absolute bottom-8 left-9 top-8 w-px bg-gradient-to-b from-amber-300 via-slate-300 to-amber-300 dark:from-amber-500 dark:via-slate-700 dark:to-amber-500" aria-hidden />
            <div className="space-y-4">
              {flowNodes.map((node) => {
                const path = starterPaths.find((item) => item.id === node.pathId);
                if (!path) return null;
                const Icon = path.icon;

                return (
                  <Link key={node.pathId} href={path.href} className="group relative flex gap-4">
                    <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-amber-300 ring-4 ring-slate-50 dark:bg-amber-400 dark:text-slate-950 dark:ring-slate-950">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-3 transition-colors group-hover:border-amber-300 group-hover:bg-amber-50 dark:border-slate-800 dark:bg-slate-900 dark:group-hover:border-amber-700 dark:group-hover:bg-amber-900/15">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[11px] font-black text-amber-600 dark:text-amber-300">{node.step} · {node.phase}</span>
                        <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-500" />
                      </div>
                      <h3 className="mt-1 text-sm font-black text-slate-950 dark:text-white">{node.label}</h3>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{node.hint}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {routeStages.map((stage) => {
              const Icon = stage.icon;
              return (
                <div key={stage.step} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-600 dark:text-amber-300">
                    <Icon className="h-4 w-4" />
                    {stage.step}
                  </div>
                  <h3 className="mt-3 text-sm font-black text-slate-950 dark:text-white">{stage.title}</h3>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{stage.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_52px_rgba(15,23,42,0.055)] dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center gap-2">
              <Flag className="h-4 w-4 text-amber-500" />
              <h2 className="text-xl font-black text-slate-950 dark:text-white">优先路线</h2>
            </div>
            <div className="grid gap-3">
              {featuredPaths.map((path, index) => {
                const Icon = path.icon;
                return (
                  <Link
                    key={path.id}
                    href={path.href}
                    className="group grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-amber-300 hover:bg-amber-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-amber-700 dark:hover:bg-amber-900/15 md:grid-cols-[4rem_1fr_auto]"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-amber-300 dark:bg-amber-400 dark:text-slate-950">
                      <Icon className="h-7 w-7" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-amber-600 dark:text-amber-300">主线 {String(index + 1).padStart(2, "0")}</div>
                      <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">{path.title}</h3>
                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">{path.question}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{path.description}</p>
                    </div>
                    <div className="flex items-end justify-end">
                      <ArrowRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-amber-500" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_52px_rgba(15,23,42,0.055)] dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-amber-500" />
              <h2 className="text-xl font-black text-slate-950 dark:text-white">分支路线</h2>
            </div>
            <div className="space-y-3">
              {secondaryPaths.map((path) => {
                const Icon = path.icon;
                return (
                  <Link
                    key={path.id}
                    href={path.href}
                    className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 transition-colors hover:border-amber-300 hover:bg-amber-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-amber-700 dark:hover:bg-amber-900/15"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-amber-300 dark:ring-slate-800">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-black text-slate-950 dark:text-white">{path.title}</h3>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{path.description}</p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-500" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_46px_rgba(15,23,42,0.055)] dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-amber-500" />
            <h2 className="text-xl font-black text-slate-950 dark:text-white">不知道怎么搜时，看这些问题</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {quickAnswerItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.question}
                  href={item.href}
                  className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-amber-300 hover:bg-amber-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-amber-700 dark:hover:bg-amber-900/15"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <div>
                    <h3 className="text-sm font-black text-slate-950 dark:text-white">{item.question}</h3>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{item.answer}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-black text-amber-800 dark:text-amber-200">
                <CheckCircle2 className="h-4 w-4" />
                下一步不是阅读更多，而是完成一个动作
              </div>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
                如果你已经知道自己要注册、领取、开卡、开户或使用工具，就进入行动入口，把路径落到具体页面。
              </p>
            </div>
            <Link
              href="/get"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-amber-300 transition-colors hover:bg-amber-400 hover:text-slate-950 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
            >
              进入行动入口
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
