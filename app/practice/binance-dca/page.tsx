"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bitcoin, CalendarDays, ListChecks, TrendingUp } from "lucide-react";
import { getSafeExternalUrl } from "@/lib/security/external-links";

type PlanKey = "bnb" | "qqq";

const plans = {
  bnb: {
    title: "BNB 定投",
    asset: "BNB",
    subtitle: "币安生态资产，单独记录平台币周期",
    color: "#f0b90b",
    icon: Bitcoin,
    status: "计划启动",
    platform: "Binance 币安",
    cadence: "已记录第 1 期",
    description:
      "BNB 和 BTC / ETH 不是同一套逻辑，所以不放进 BTC / ETH 的组合曲线里。这里单独记录 BNB 的定投执行价格和后续真实买入数据。",
    focus: ["BNB 生态", "平台币周期", "币安账户执行"],
    records: [
      { period: "第 1 期", date: "2026/08/23", price: 694 },
    ],
  },
  qqq: {
    title: "QQQ 定投",
    asset: "QQQ",
    subtitle: "纳斯达克 100 ETF，和加密资产分开记录",
    color: "#4f46e5",
    icon: TrendingUp,
    status: "计划启动",
    platform: "Binance 币安",
    cadence: "已记录第 1 期",
    description:
      "QQQ 属于美股指数 ETF，交易逻辑、估值逻辑和加密资产不同，所以单独展示。这里先记录第一期执行价格，等后续期数足够后再接入收益曲线。",
    focus: ["纳斯达克 100", "美股 ETF", "长期指数配置"],
    records: [
      { period: "第 1 期", date: "2026/08/23", price: 712 },
    ],
  },
} satisfies Record<PlanKey, {
  title: string;
  asset: string;
  subtitle: string;
  color: string;
  icon: typeof Bitcoin;
  status: string;
  platform: string;
  cadence: string;
  description: string;
  focus: string[];
  records: { period: string; date: string; price: number }[];
}>;

export default function BinanceDcaPage() {
  const [active, setActive] = useState<PlanKey>("bnb");
  const plan = plans[active];
  const Icon = plan.icon;
  const latestRecord = plan.records[plan.records.length - 1];

  return (
    <main className="min-h-screen bg-slate-50 dot-grid dot-grid-light px-4 py-8 dark:bg-slate-950 md:px-6 md:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5">
          <Link
            href="/aboutme"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/85 px-3 py-2 text-sm font-bold text-slate-600 shadow-sm transition-colors hover:border-amber-300 hover:text-amber-700 dark:border-slate-800 dark:bg-slate-900/85 dark:text-slate-300"
          >
            <ArrowLeft className="h-4 w-4" />
            返回关于我
          </Link>
        </div>

        <section className="overflow-hidden rounded-[28px] border border-yellow-200/80 bg-white/92 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-yellow-900/50 dark:bg-slate-900/92">
          <div className="grid gap-0 lg:grid-cols-[0.88fr_1.12fr]">
            <div className="border-b border-slate-200/80 bg-gradient-to-br from-yellow-50 via-white to-indigo-50 p-6 dark:border-slate-800 dark:from-yellow-900/15 dark:via-slate-900 dark:to-indigo-950/20 lg:border-b-0 lg:border-r md:p-8">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-300">Binance DCA</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">BNB / QQQ 定投</h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                这里是币安定投入口。外层只保留一个入口，进来后再选择查看 BNB 或 QQQ；当前两项都刚开始第一期，所以先记录执行价格，暂不绘制收益曲线。
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2">
                {(Object.keys(plans) as PlanKey[]).map((key) => {
                  const item = plans[key];
                  const SelectedIcon = item.icon;
                  const selected = active === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActive(key)}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        selected
                          ? "border-amber-300 bg-white shadow-lg shadow-amber-100/70 dark:border-amber-700 dark:bg-slate-950 dark:shadow-none"
                          : "border-slate-200 bg-white/60 hover:border-amber-200 dark:border-slate-800 dark:bg-slate-950/45 dark:hover:border-amber-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: item.color }}>
                          <SelectedIcon className="h-4 w-4 text-white" />
                        </span>
                        <span className="font-black text-slate-950 dark:text-white">{item.asset}</span>
                      </div>
                      <div className="mt-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{item.subtitle}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {plan.status}
                  </div>
                  <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white md:text-3xl">{plan.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{plan.description}</p>
                </div>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg" style={{ backgroundColor: plan.color }}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/85 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-xs font-black text-slate-400">执行平台</div>
                  <div className="mt-1 text-base font-black text-slate-950 dark:text-white">{plan.platform}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/85 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-xs font-black text-slate-400">定投产品</div>
                  <div className="mt-1 text-base font-black text-slate-950 dark:text-white">{plan.asset}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/85 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-xs font-black text-slate-400">记录状态</div>
                  <div className="mt-1 text-base font-black text-slate-950 dark:text-white">{plan.cadence}</div>
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50/75 p-4 dark:border-slate-800 dark:bg-slate-950/55">
                <div className="mb-3 flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 text-sm font-black text-slate-700 dark:text-slate-200">
                    <ListChecks className="h-4 w-4" />
                    {plan.asset} 定投明细
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-slate-400 dark:bg-slate-900">第一期</span>
                </div>
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.2fr]">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                    <div className="text-xs font-black text-slate-400">期数</div>
                    <div className="mt-1 text-lg font-black text-slate-950 dark:text-white">{latestRecord.period}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                    <div className="text-xs font-black text-slate-400">执行日期</div>
                    <div className="mt-1 font-mono text-lg font-black text-slate-950 dark:text-white">{latestRecord.date}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                    <div className="text-xs font-black text-slate-400">执行价格</div>
                    <div className="mt-1 font-mono text-lg font-black text-slate-950 dark:text-white">
                      {latestRecord.price.toLocaleString()}U
                    </div>
                  </div>
                </div>
                <p className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-white/80 px-4 py-3 text-xs font-semibold leading-5 text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
                  目前只有第一期记录，没有可比较的收益序列；等后续继续执行后，再单独接入 {plan.asset} 的收益曲线和累计明细。
                </p>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                我计划把 {plan.asset} 定投放在币安里执行。大家如果也想用同样的入口，可以先看开户教程，再通过注册链接创建账号。
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link
                    href="/articles/crypto/GaM38JYk"
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:border-amber-300 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    币安教程
                  </Link>
                  <a
                    href={getSafeExternalUrl("https://www.bsmkweb.cc/register?ref=WISEBNB1")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-bold text-amber-700 transition-colors hover:border-amber-300 hover:bg-amber-50 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-300"
                  >
                    币安注册账号
                  </a>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {plan.focus.map((item) => (
                  <span key={item} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
