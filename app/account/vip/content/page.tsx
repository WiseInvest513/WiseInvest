import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CandlestickChart,
  Crown,
  FileText,
  LockKeyhole,
  MessageCircle,
  Sparkles,
  Target,
  Wrench,
} from "lucide-react";
import { CommunityDialogButton } from "@/components/community-dialog-button";
import { CopyTextButton } from "@/components/copy-text-button";
import { Button } from "@/components/ui/button";
import { requireWiseUser } from "@/lib/identity/current-user";
import { getPublicTierLabel, type PublicMembershipTier } from "@/lib/vip/display";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "VIP 内容中心 | Wise Invest",
  description: "Wise VIP 用户的策略内容、专属工具、VIP 群联系信息和资源导航。",
  robots: {
    index: false,
    follow: false,
  },
};

const vipContentCards = [
  {
    title: "策略与复盘",
    description: "集中查看群内策略、重点信息同步和后续复盘内容。",
    icon: FileText,
    items: ["市场节奏", "策略讨论", "重点信息同步"],
  },
  {
    title: "开单点位",
    description: "用于承接更明确的观察区间、开单思路和风控提醒。",
    icon: Target,
    items: ["观察区间", "入场思路", "风控提醒"],
  },
  {
    title: "专属工具",
    description: "把研究、跟踪、测算和执行辅助工具放在一个入口里。",
    icon: Wrench,
    items: ["补仓测算", "合约计算", "持仓跟踪"],
  },
];

const toolLinks = [
  {
    title: "BTC / ETH 定投记录",
    description: "查看当前实盘定投成本、收益曲线和明细。",
    href: "/practice/dca-investment",
    icon: CandlestickChart,
  },
  {
    title: "Binance DCA 实盘",
    description: "查看 BNB、QQQ 等后续实盘定投记录。",
    href: "/practice/binance-dca",
    icon: CandlestickChart,
  },
  {
    title: "补仓计算器",
    description: "计算补仓后的平均成本和资金占用。",
    href: "/tools/average-down",
    icon: Wrench,
  },
  {
    title: "合约计算器",
    description: "估算保证金、杠杆、盈亏和强平风险。",
    href: "/tools/contract-calculator",
    icon: Wrench,
  },
  {
    title: "持仓跟踪器",
    description: "用于记录资产配置、仓位和盈亏变化。",
    href: "/tools/portfolio-tracker",
    icon: Wrench,
  },
  {
    title: "纳指投资策略",
    description: "阅读纳指投资策略电子书和目录内容。",
    href: "/book/nasdaq",
    icon: BookOpen,
  },
];

export default async function VipContentPage() {
  const user = await requireWiseUser();
  const currentTier = user.membershipTier as PublicMembershipTier;
  const unlocked = currentTier === "VIP" || currentTier === "VIP_PLUS";

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <Button asChild variant="outline" className="h-10 rounded-xl border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <Link href="/account/vip">
            <ArrowLeft className="mr-2 h-4 w-4" />
            VIP 中心
          </Link>
        </Button>

        <section className="relative overflow-hidden rounded-3xl border border-amber-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_48%,#fef3c7_100%)] p-6 shadow-sm dark:border-amber-900/50 dark:bg-[linear-gradient(135deg,#1f1305_0%,#0f172a_58%,#111827_100%)] md:p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-300 via-orange-300 to-transparent" />
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white/80 px-3 py-1 text-xs font-black text-amber-700 shadow-sm dark:border-amber-800 dark:bg-white/10 dark:text-amber-200">
                <Crown className="h-3.5 w-3.5" />
                {getPublicTierLabel(currentTier)}
              </div>
              <h1 className="font-heading text-3xl font-black leading-tight md:text-4xl">
                {unlocked ? "Wise VIP 内容中心" : "VIP 内容中心暂未解锁"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                {unlocked
                  ? "这里集中放置策略内容、开单点位、专属工具、VIP 群联系信息和后续 SVIP 资源入口。"
                  : "你已经拥有 Wise ID。完成一个合作账户核验后，即可进入 VIP 内容中心。"}
              </p>
            </div>

            {unlocked ? (
              <div className="w-full max-w-sm rounded-2xl border border-amber-200 bg-white/80 p-4 shadow-sm dark:border-amber-800 dark:bg-white/10">
                <div className="flex items-start gap-3">
                  <MessageCircle className="h-4 w-4" />
                  <div>
                    <p className="font-black">VIP 群：要买就买十年</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">如果还没进群，请添加微信 WiseInvest520。</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-3 py-2 dark:bg-amber-950/30">
                  <span className="font-mono text-sm font-black text-amber-800 dark:text-amber-200">WiseInvest520</span>
                  <CopyTextButton value="WiseInvest520" className="h-9 border-amber-200 px-3 py-1.5 text-xs dark:border-amber-800">
                    复制微信号
                  </CopyTextButton>
                </div>
                <Button asChild variant="outline" className="mt-3 h-11 w-full rounded-xl border-amber-200 bg-white/80 px-5 dark:border-amber-800 dark:bg-white/10">
                  <Link href="/book/nasdaq">
                    纳指投资策略
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <Button asChild className="h-12 rounded-xl bg-slate-950 px-5 text-amber-300 hover:bg-slate-900 dark:bg-amber-300 dark:text-slate-950 dark:hover:bg-amber-200">
                <Link href="/account/vip">
                  去完成 VIP 核验
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </section>

        {!unlocked ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black">先成为 Wise VIP</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
                  VIP 内容不是单纯注册后开放，需要提交 Wise 支持的合作账户并通过核验。通过后，群入口和专属内容会自动显示。
                </p>
                <Button asChild className="mt-5 h-11 rounded-xl bg-slate-950 px-5 text-amber-300 hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
                  <Link href="/account/vip">查看可核验渠道</Link>
                </Button>
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              {vipContentCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article
                    key={card.title}
                    className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-amber-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-800"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="mt-5 text-xl font-black">{card.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">{card.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {card.items.map((item) => (
                        <span key={item} className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-500 dark:bg-slate-950 dark:text-slate-300">
                          {item}
                        </span>
                      ))}
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-black uppercase text-amber-600 dark:text-amber-300">VIP Tools</p>
                  <h2 className="mt-1 text-2xl font-black">常用内容和工具入口</h2>
                </div>
                <p className="max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                  先把当前已经稳定可用的内容集中起来，后续新增 VIP 内容时继续放进这里。
                </p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {toolLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-amber-300 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:hover:border-amber-800 dark:hover:bg-slate-900"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:text-amber-300 dark:ring-slate-800">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="font-black">{item.title}</h3>
                          <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-amber-500" />
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.description}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-black">VIP 群联系信息</h2>
                <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                  你的 Wise ID 已经通过合作账户核验。VIP 群名称为“要买就买十年”，如果还没有加入，请添加微信 WiseInvest520 联系进群。
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                  <span className="font-mono text-base font-black text-amber-800 dark:text-amber-200">WiseInvest520</span>
                  <CopyTextButton value="WiseInvest520" className="border-amber-200 dark:border-amber-800">
                    复制微信号
                  </CopyTextButton>
                </div>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <p className="font-black">免费微信群聊</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    免费群对所有用户开放，用于公开教程、网站更新和基础交流。
                  </p>
                  <CommunityDialogButton className="mt-3 h-10 rounded-xl px-4 py-2">
                    <MessageCircle className="h-4 w-4" />
                    打开免费群二维码
                  </CommunityDialogButton>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-3xl border border-amber-300 bg-[linear-gradient(135deg,#020617_0%,#111827_55%,#78350f_100%)] p-6 text-white shadow-sm dark:border-amber-800 md:p-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-white/10 px-3 py-1 text-xs font-black text-amber-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Wise SVIP
                </div>
                <h2 className="mt-5 text-2xl font-black">更高等级资源入口</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  SVIP 会围绕资源对接、周边福利、线下见面和重点机会沟通继续展开。当前先保留入口，后续按资格开放。
                </p>
                <Button asChild className="mt-6 h-11 rounded-xl bg-amber-300 px-5 text-slate-950 hover:bg-amber-200">
                  <Link href="/account/vip">
                    查看我的资格
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
