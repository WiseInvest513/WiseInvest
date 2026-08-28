import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  Building2,
  CandlestickChart,
  Crown,
  Gift,
  Handshake,
  HelpCircle,
  MessageCircle,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { WISE_DEV_PREVIEW_COOKIE, isDevPreviewCookieValue } from "@/lib/identity/dev-preview";
import { getEnabledVipPartners, getPartnerDisplayConfig } from "@/lib/vip/partners";
import { partnerTypeLabels } from "@/lib/vip/status";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Wise VIP | 如何成为 VIP 用户",
  description: "Wise VIP 是 Wise Invest 的会员权益体系。普通用户可正常使用网站，VIP 可进入社群并使用专属服务，SVIP 可获得更高级资源对接。",
  keywords: ["Wise VIP", "Wise SVIP", "Wise Invest 会员", "VIP 群", "券商开户链接", "交易所邀请码"],
  alternates: {
    canonical: "/vip",
  },
};

const membershipLevels = [
  {
    title: "普通用户",
    badge: "普通用户",
    text: "可以正常阅读网站内容、查看学习路线，并使用公开工具。",
    icon: UserRound,
  },
  {
    title: "VIP 用户",
    badge: "Wise VIP",
    text: "可以进入 VIP 群，获取群内策略，并使用专属服务和专属工具。",
    icon: BadgeCheck,
  },
  {
    title: "SVIP 用户",
    badge: "Wise SVIP",
    text: "可以享受更高级的资源对接、重点项目机会和线下见面等服务。",
    icon: Sparkles,
  },
];

const vipSteps = [
  ["01", "注册 Wise ID", "先拥有一个 Wise 账户。"],
  ["02", "选择合作渠道", "通过 Wise 支持的券商、交易所或服务平台开户。"],
  ["03", "提交账户标识", "填写 UID、Account ID 或必要识别信息。"],
  ["04", "等待人工核验", "通过后自动升级为 Wise VIP。"],
];

const benefits = [
  {
    title: "VIP 群策略",
    text: "进入 VIP 群，跟进市场节奏、策略讨论和重点信息同步。",
    icon: MessageCircle,
  },
  {
    title: "专属服务",
    text: "开户、产品选择、工具使用等问题，可以获得更直接的支持。",
    icon: Handshake,
  },
  {
    title: "专属工具",
    text: "使用面向进阶用户的研究、跟踪和决策辅助工具。",
    icon: Gift,
  },
  {
    title: "开单点位",
    text: "群内同步更明确的观察区间、开单思路和风控提醒。",
    icon: Target,
  },
];

const vipRouteOptions = [
  {
    title: "场内开户",
    badge: "普通证券账户",
    description: "关注场内 ETF、纳指 / 标普定投或 QQQ 替代路径，可以对接银河证券。ETF/LOF 免五，更适合国内人民币账户长期定投。",
    href: "/perk/ipo",
    cta: "查看银河证券",
    icon: Banknote,
    points: ["A 股账户", "ETF/LOF 免五", "纳指 / 标普定投"],
  },
  {
    title: "港美股券商",
    badge: "港资 / 美资券商",
    description: "想直接买美股，可以选择复星、致富、腾达等港资券商；BBAE 等美资券商合作也在持续补充中。完成开户和入金后，后续交流美股才有实际交易场景承接。",
    href: "/perk/broker",
    cta: "查看港美股券商",
    icon: Building2,
    points: ["复星 / 致富 / 腾达", "BBAE 合作中", "美股交易账户"],
  },
  {
    title: "交易所注册",
    badge: "Web3 / Crypto",
    description: "如果对 Web3 / Crypto 感兴趣，可以看 Binance、Bitget、Bybit、OKX、Gate 等交易所。不仅可以交易加密资产，部分平台也在补充美股相关交易入口。",
    href: "/perk/crypto",
    cta: "查看交易所",
    icon: CandlestickChart,
    points: ["Binance / Bitget", "Bybit / OKX / Gate", "提交 UID 核验"],
  },
];

const faqs = [
  ["普通用户能做什么？", "普通用户可以正常使用网站公开内容、学习路线和工具。"],
  ["如何成为 Wise VIP？", "注册 Wise ID 后，绑定一个符合条件的合作账户，并通过资格验证。"],
  ["VIP 有什么用？", "VIP 可以进入社群，使用专属服务和后续开放的专属工具。"],
  ["SVIP 有什么不同？", "SVIP 面向更深度的用户，提供更高级资源对接、重点机会和线下见面等服务。"],
  ["绑定账户就一定能成为 VIP 吗？", "不会。绑定只是提交审核，只有通过 Wise 合作关系核验后才会升级。"],
  ["Wise 会要求我的交易密码吗？", "不会。Wise 不会要求密码、私钥、Seed Phrase、API Secret、2FA Code 或交易密码。"],
];

const partnerTypeHeadings = {
  BROKERAGE: "券商账户",
  EXCHANGE: "交易所",
} as const;

export default async function VipPage() {
  const [session, cookieStore, partners] = await Promise.all([auth(), cookies(), getEnabledVipPartners()]);
  const loggedIn = Boolean(session?.user?.id) || isDevPreviewCookieValue(cookieStore.get(WISE_DEV_PREVIEW_COOKIE)?.value);
  const primaryHref = loggedIn ? "/account/vip" : "/login?callbackUrl=/account/vip";
  const partnersWithDisplay = partners.map((partner) => ({
    ...partner,
    ...getPartnerDisplayConfig(partner),
  }));
  const verificationPartners = partnersWithDisplay.filter((partner) => partner.type !== "OTHER");
  const groupedPartners = verificationPartners.reduce<Record<string, typeof verificationPartners>>((groups, partner) => {
    groups[partner.type] = [...(groups[partner.type] ?? []), partner];
    return groups;
  }, {});

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[1fr_380px] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
              <Crown className="h-4 w-4" />
              Wise VIP
            </div>
            <h1 className="mt-5 font-heading text-4xl font-black leading-tight md:text-5xl">Wise VIP 怎么获得？</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
              注册 Wise ID，绑定符合条件的合作账户，通过核验后即可升级。普通用户能正常使用网站，VIP 和 SVIP 会获得更多服务权益。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="h-12 rounded-xl bg-slate-950 px-5 text-amber-300 hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
                <Link href={primaryHref}>
                  {loggedIn ? "进入我的 VIP 中心" : "登录并申请 VIP"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-xl border-slate-200 bg-white px-5 dark:border-slate-700 dark:bg-slate-900">
                <a href="#how-it-works">查看升级步骤</a>
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20">
            <p className="text-sm font-black text-amber-800 dark:text-amber-200">最简单的理解</p>
            <div className="mt-4 space-y-3">
              {membershipLevels.map((level) => {
                const Icon = level.icon;
                return (
                  <div key={level.title} className="flex gap-3 rounded-2xl border border-white/70 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black">{level.title}</p>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                          {level.badge}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{level.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-amber-600 dark:text-amber-300">Upgrade Path</p>
            <h2 className="mt-2 text-3xl font-black">普通用户如何成为 VIP</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400">
            不是填个邀请码就自动生效，必须提交合作账户并通过后台核验。
          </p>
        </div>

        <div className="mt-7 grid gap-4 lg:grid-cols-4">
          {vipSteps.map(([step, title, text], index) => (
            <article key={step} className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              {index < vipSteps.length - 1 && (
                <div className="absolute left-10 top-10 hidden h-px w-[calc(100%+1rem)] bg-gradient-to-r from-amber-300 to-transparent lg:block" />
              )}
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 font-mono text-sm font-black text-amber-300 dark:bg-white dark:text-slate-950">
                {step}
              </div>
              <h3 className="mt-5 text-lg font-black">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{text}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex md:items-center md:justify-between md:gap-6">
          <div>
            <h3 className="text-xl font-black">现在是普通用户？</h3>
            <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
              先登录 Wise ID，再选择一个合作渠道提交核验。审核通过后，会员状态会在账户中心自动更新。
            </p>
          </div>
          <Button asChild className="mt-4 h-12 rounded-xl bg-slate-950 px-5 text-amber-300 hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 md:mt-0">
            <Link href={primaryHref}>
              开始申请
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-amber-600 dark:text-amber-300">Choose Your Route</p>
              <h3 className="mt-1 text-2xl font-black">选择你真正会用的交易路径</h3>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400">
              VIP 群主要面向已经在交易，或准备认真开始交易的朋友。先选择适合自己的渠道，再登录提交核验。
            </p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {vipRouteOptions.map((route) => {
              const Icon = route.icon;
              return (
                <article
                  key={route.title}
                  className="flex min-h-[270px] flex-col rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-amber-300 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:hover:border-amber-800 dark:hover:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:text-amber-300 dark:ring-slate-800">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-black text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                      {route.badge}
                    </span>
                  </div>
                  <h4 className="mt-5 text-lg font-black">{route.title}</h4>
                  <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">{route.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {route.points.map((point) => (
                      <span key={point} className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500 dark:bg-slate-900 dark:text-slate-300">
                        {point}
                      </span>
                    ))}
                  </div>
                  <Link href={route.href} className="mt-auto inline-flex items-center pt-5 text-sm font-black text-amber-700 transition hover:text-amber-600 dark:text-amber-300">
                    {route.cta}
                    <ArrowUpRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-12 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl border border-amber-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_52%,#fef3c7_100%)] p-6 shadow-lg shadow-amber-950/5 dark:border-amber-900/50 dark:bg-[linear-gradient(135deg,#1f1305_0%,#0f172a_58%,#111827_100%)] md:p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-300 via-orange-300 to-transparent" />
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase text-amber-600 dark:text-amber-300">VIP Access</p>
              <h2 className="mt-2 text-2xl font-black">成为 VIP 后，可以获取什么</h2>
            </div>
            <span className="hidden rounded-full border border-amber-300 bg-white/80 px-3 py-1 text-xs font-black text-amber-700 shadow-sm dark:border-amber-800 dark:bg-white/10 dark:text-amber-200 sm:inline-flex">
              核心权益
            </span>
          </div>
          <div className="mt-6 space-y-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.title}
                  className="group flex gap-4 rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm shadow-amber-950/5 transition hover:border-amber-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:border-amber-700 dark:hover:bg-white/10"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm ring-1 ring-amber-200 transition group-hover:bg-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-800/50">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black">{benefit.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{benefit.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <Button asChild className="mt-7 h-12 rounded-xl bg-slate-950 px-5 text-amber-300 hover:bg-slate-900 dark:bg-amber-300 dark:text-slate-950 dark:hover:bg-amber-200">
            <Link href={primaryHref}>
              先成为 VIP
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-amber-300 bg-[linear-gradient(135deg,#020617_0%,#111827_58%,#78350f_100%)] p-6 text-white shadow-lg shadow-amber-950/10 dark:border-amber-800 md:p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200" />
          <div className="flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-white/10 px-3 py-1 text-xs font-black text-amber-200">
              <Sparkles className="h-3.5 w-3.5" />
              Wise SVIP
            </div>
            <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-black text-slate-950">VIP 后进阶</span>
          </div>
          <h2 className="mt-8 max-w-md text-3xl font-black leading-tight md:text-4xl">SVIP：资源、福利和线下连接</h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
            先完成 VIP 核验，再根据合作账户、有效记录和参与深度判断 SVIP 资格。通过后可获得资源对接、周边福利、线下见面和重点机会沟通。
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["对接资源", "周边福利", "线下见面", "重点机会沟通"].map((item) => (
              <span key={item} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-100">
                {item}
              </span>
            ))}
          </div>
          <Button asChild className="mt-8 h-12 rounded-xl bg-amber-300 px-5 font-black text-slate-950 hover:bg-amber-200">
            <Link href={primaryHref}>
              查看我的资格
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-amber-600 dark:text-amber-300">Partners</p>
              <h2 className="mt-2 text-2xl font-black">可提交核验的合作渠道</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">使用支持渠道后，再回到账户中心提交交易所 UID 或券商账户 ID。</p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {Object.entries(groupedPartners).map(([type, items]) => (
              <div key={type} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <h3 className="font-black">{partnerTypeHeadings[type as keyof typeof partnerTypeHeadings] ?? partnerTypeLabels[type as keyof typeof partnerTypeLabels]}</h3>
                <div className="mt-4 space-y-3">
                  {items.map((partner) => (
                    <div key={partner.slug} className="flex items-center justify-between gap-3 text-sm">
                      <p className="font-bold">{partner.name}</p>
                      <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-black text-amber-700 dark:bg-slate-900 dark:text-amber-300">
                        {partner.type === "BROKERAGE" ? "统一 ID" : partner.vipPlusEligible ? "VIP / SVIP" : "VIP"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
          <div className="mb-6 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-amber-500" />
            <h2 className="text-2xl font-black">常见问题</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {faqs.map(([question, answer]) => (
              <details key={question} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <summary className="cursor-pointer font-black">{question}</summary>
                <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
