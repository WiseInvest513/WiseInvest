import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  CircleHelp,
  Clock3,
  RefreshCcw,
  ShieldCheck,
  UserRoundCheck,
  XCircle,
} from "lucide-react";
import { CopyTextButton } from "@/components/copy-text-button";
import { siteConfig } from "@/lib/config";

const pageUrl = `${siteConfig.url}/guide/exchange-referral`;

export const metadata: Metadata = {
  title: "交易所绑定了他人邀请码怎么办 | Wise Invest",
  description: "币安、Bitget、OKX 邀请码绑定异常处理指南：判断账户状态、查看补绑条件，并了解审核驳回后的处理方式。",
  alternates: { canonical: pageUrl },
  openGraph: {
    title: "交易所绑定了他人邀请码怎么办",
    description: "根据交易所和账户使用状态，判断是否可以补绑、注销后重开或需要更换账户。",
    url: pageUrl,
    type: "article",
  },
};

const binanceRoutes = [
  {
    step: "01",
    title: "新注册且从未使用过账户",
    tag: "注册 30 天内",
    description: "适用于注册后没有交易、充值、持有资产，也没有使用过任何产品的新账户。符合条件时，可尝试直接补绑。",
    condition: "账户无交易、无充值、无资产、无产品使用记录",
    href: "https://www.binance.com/zh-CN/activity/referral/bind-ref",
    action: "打开币安补绑页面",
  },
  {
    step: "02",
    title: "近期有交易但交易量较低",
    tag: "近 3 个月不超过 5,000 美元",
    description: "符合条件的账户可提交补绑申请；绑定后 30 天内需要完成 15 万 U 交易量，达到平台要求后才会正式生效。",
    condition: "补绑后 30 天内完成 15 万 U 交易量",
    href: "https://www.bsmkweb.cc/activity/referral/bind-ref",
    action: "打开补绑申请入口",
  },
  {
    step: "03",
    title: "注册较久但近期完全未使用",
    tag: "注册超过 3 个月",
    description: "适用于最近三个月没有交易，也没有使用任何产品的账户。登录一次下方链接，检查是否可以完成邀请关系补绑。",
    condition: "最近 3 个月无交易、无产品使用记录",
    href: "https://www.binance.com/zh-CN/join?ref=WISEBNB1",
    action: "使用 Wise 邀请链接登录",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "币安账户已经绑定他人邀请码还能修改吗？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "先向币安官方客服核验当前邀请关系和账户使用记录。部分符合条件的账户可以申请补绑；已经确认绑定其他邀请人的账户通常不能直接覆盖原关系。",
      },
    },
    {
      "@type": "Question",
      name: "Bitget 绑定了他人邀请码怎么办？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "可先向 Bitget 官方客服确认账户注销、KYC 释放和重新注册条件，完成注销后再按平台当前规则重新注册。",
      },
    },
    {
      "@type": "Question",
      name: "OKX 邀请关系可以更换吗？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "OKX 的邀请关系通常在注册时确定，完成注册或认证后一般不能修改。操作前应向 OKX 官方客服确认当前规则。",
      },
    },
  ],
};

export default function ExchangeReferralGuidePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dot-grid dot-grid-light dark:bg-slate-950 dark:text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
        <Link
          href="/perk/crypto"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 shadow-sm transition-colors hover:border-amber-300 hover:text-amber-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <ArrowLeft className="h-4 w-4" />
          返回交易所福利
        </Link>

        <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-0 lg:grid-cols-[1fr_330px]">
            <div className="p-6 md:p-9">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                <CircleHelp className="h-3.5 w-3.5" />
                邀请码绑定异常处理
              </div>
              <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight md:text-5xl">
                交易所绑定了他人邀请码，应该怎么办？
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                先确认交易所、注册时间、近三个月交易情况和当前邀请关系，再选择对应处理方式。不要重复提交随机 UID，也不要在未确认平台规则前注销账户。
              </p>
            </div>
            <aside className="border-t border-slate-200 bg-slate-950 p-6 text-white dark:border-slate-800 lg:border-l lg:border-t-0">
              <ShieldCheck className="h-7 w-7 text-amber-300" />
              <h2 className="mt-4 text-xl font-black">先做一次官方核验</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                不确定是否绑定过邀请码，或不记得交易记录时，先询问交易所官方客服。也可以把 UID 发给 Wise 协助查询合作关系。
              </p>
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-6 text-slate-300">
                平台活动、补绑资格、KYC 与账户注销规则可能变化，最终以平台当前页面和官方客服答复为准。
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-900/50 dark:bg-amber-950/20 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase text-amber-700 dark:text-amber-300">Wise Binance Referral</p>
              <h2 className="mt-1 text-2xl font-black">币安邀请码：WISEBNB1</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">符合活动条件时，可按页面显示享受对应返佣权益。</p>
            </div>
            <CopyTextButton value="WISEBNB1" className="h-11 shrink-0 border-amber-300 px-5">
              复制邀请码
            </CopyTextButton>
          </div>
        </section>

        <section className="mt-9">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200">
              <BadgeCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-amber-600 dark:text-amber-300">Binance</p>
              <h2 className="mt-1 text-2xl font-black">币安：按账户使用状态选择</h2>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            {binanceRoutes.map((route) => (
              <article key={route.step} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
                <div className="grid gap-5 lg:grid-cols-[80px_1fr_230px] lg:items-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 font-mono text-sm font-black text-amber-300 dark:bg-white dark:text-slate-950">
                    {route.step}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black">{route.title}</h3>
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                        {route.tag}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{route.description}</p>
                    <div className="mt-3 flex items-start gap-2 text-xs font-bold leading-6 text-slate-500 dark:text-slate-400">
                      <Clock3 className="mt-1 h-3.5 w-3.5 shrink-0 text-amber-500" />
                      {route.condition}
                    </div>
                  </div>
                  <a
                    href={route.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-amber-300 transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                  >
                    {route.action}
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-9 grid gap-5 md:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <RefreshCcw className="h-6 w-6 text-amber-600 dark:text-amber-300" />
            <p className="mt-4 text-xs font-black uppercase text-amber-600 dark:text-amber-300">Bitget</p>
            <h2 className="mt-1 text-xl font-black">先确认注销与重新注册条件</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              如果 Bitget 账户绑定了其他邀请人，可先联系官方客服确认账户注销、邀请关系释放和 KYC 释放条件。确认完成后，再通过 Wise 邀请渠道重新注册。
            </p>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <XCircle className="h-6 w-6 text-rose-500" />
            <p className="mt-4 text-xs font-black uppercase text-amber-600 dark:text-amber-300">OKX</p>
            <h2 className="mt-1 text-xl font-black">原邀请关系通常无法修改</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              OKX 邀请关系通常在注册时确定，完成注册或认证后一般不能直接更换。是否可以使用其他身份重新认证，应先咨询官方客服并遵守平台规则。
            </p>
          </article>
        </section>

        <section className="mt-6 rounded-3xl border border-rose-200 bg-rose-50/70 p-5 dark:border-rose-900/50 dark:bg-rose-950/20 md:p-6">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-300" />
            <div>
              <h2 className="font-black">已经明确绑定其他邀请人时</h2>
              <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
                不要继续重复填写 UID。先确认平台是否允许补绑、注销或重新注册；无法修改原邀请关系时，只能依据平台当前规则选择新的合规账户方案。Wise 不会要求你的交易所密码、验证码、API Secret、钱包私钥或助记词。
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <UserRoundCheck className="h-6 w-6 text-amber-600 dark:text-amber-300" />
            <h2 className="text-xl font-black">重新提交 VIP 核验前检查</h2>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              "确认选择的是正确交易所",
              "确认 UID 来自本人账户后台",
              "确认账户使用了 Wise 邀请渠道",
              "在补绑正式生效后再重新提交",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 dark:bg-slate-950 dark:text-slate-200">
                <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                {item}
              </div>
            ))}
          </div>
          <Link
            href="/account/vip"
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-amber-300 transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
          >
            返回 VIP 账户中心
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}
