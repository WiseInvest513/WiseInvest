import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  Building2,
  CandlestickChart,
  Circle,
  CircleCheck,
  Clock3,
  Crown,
  Link2,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { BindingForm } from "@/app/account/vip/binding-form";
import { ReviewResultDialog } from "@/app/account/vip/review-result-dialog";
import { Button } from "@/components/ui/button";
import { requireWiseUser } from "@/lib/identity/current-user";
import {
  getEntitlementBenefitDisplays,
  getEntitlementDisplay,
  getNextTier,
  getPartnerAccountStatusLabel,
  getPublicTierLabel,
  getTierIndex,
  maskIdentifier,
  membershipJourneyCopy,
  type PublicMembershipTier,
} from "@/lib/vip/display";
import { getEnabledVipPartners, getPartnerDisplayConfig } from "@/lib/vip/partners";
import { partnerTypeLabels } from "@/lib/vip/status";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "VIP 账户 | Wise Invest",
  description: "查看 Wise VIP 资格、合作账户核验状态、会员权益和 SVIP 升级说明。",
  robots: {
    index: false,
    follow: false,
  },
};

const memberUpgradeGuide = [
  ["01", "选择合作渠道", "从下方支持渠道里选择一个适合自己的平台开户或注册。"],
  ["02", "提交账户标识", "提交 UID、Account ID 或必要识别信息，后台只用于资格核验。"],
  ["03", "等待审核通过", "通过后你的 Wise ID 会升级为 Wise VIP，并解锁对应权益。"],
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

type EnabledPartner = {
  slug: string;
  name: string;
  type: keyof typeof partnerTypeLabels;
  referralCode: string | null;
  identifierLabel: string;
  identifierPlaceholder: string;
  vipPlusEligible: boolean;
  vipPlusVolumeThreshold: { toString(): string } | string | null;
  qualificationRules: {
    metricType: string;
    threshold: string | null;
    period: string;
    supportedTradingTypes: string;
    description: string;
  } | null;
};

function partnerFormProps(partners: EnabledPartner[]) {
  return partners.map((partner) => ({
    slug: partner.slug,
    name: partner.name,
    type: partner.type,
    referralCode: partner.referralCode,
    identifierLabel: partner.identifierLabel,
    identifierPlaceholder: partner.identifierPlaceholder,
  }));
}

function getStatusTone(status: string) {
  if (status === "VERIFIED") return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300";
  if (status === "PENDING" || status === "NEEDS_REVIEW") return "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200";
  if (status === "REJECTED") return "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
}

export default async function AccountVipPage() {
  const [user, partners] = await Promise.all([requireWiseUser(), getEnabledVipPartners()]);
  const enabledPartners = partners.map((partner) => ({
    ...partner,
    ...getPartnerDisplayConfig(partner),
  })) as EnabledPartner[];
  const currentTier = user.membershipTier as PublicMembershipTier;
  const currentTierIndex = getTierIndex(currentTier);
  const nextTier = getNextTier(currentTier);
  const verifiedAccounts = user.partnerAccounts.filter((account) => account.status === "VERIFIED");
  const latestRejectedAccount = user.partnerAccounts.find((account) => account.status === "REJECTED");
  const latestNeedsReviewAccount = user.partnerAccounts.find((account) => account.status === "NEEDS_REVIEW");
  const activeEntitlements = user.entitlements.filter((entitlement) => !entitlement.expiresAt || entitlement.expiresAt > new Date());
  const verificationPartners = enabledPartners.filter((partner) => partner.type !== "OTHER");
  const vipPlusPartners = verificationPartners.filter((partner) => partner.vipPlusEligible);
  const hasVipPlusCandidate = user.partnerAccounts.some((account) =>
    vipPlusPartners.some((partner) => partner.slug === account.partner.slug && account.status === "VERIFIED")
  );
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      {latestRejectedAccount && (
        <ReviewResultDialog partnerName={latestRejectedAccount.partner.name} reason={latestRejectedAccount.reviewNote} />
      )}
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <Button asChild variant="outline" className="h-10 rounded-xl border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <Link href="/account">
            <ArrowLeft className="mr-2 h-4 w-4" />
            账户中心
          </Link>
        </Button>

        <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
              <Crown className="h-3.5 w-3.5" />
              {getPublicTierLabel(currentTier)}
            </div>
            <h1 className="font-heading text-3xl font-black leading-tight md:text-4xl">
              {currentTier === "MEMBER"
                ? "当前身份：普通用户"
                : currentTier === "VIP_PLUS"
                  ? "Wise SVIP 已激活"
                  : "Wise VIP 已激活"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
              {currentTier === "MEMBER"
                ? "完成一个符合条件的 Wise Partner Account 验证，即可升级 Wise VIP。"
                : currentTier === "VIP_PLUS"
                  ? "你已达到 Wise SVIP 资格，可以使用当前等级对应权益。"
                  : "你已通过符合条件的合作账户完成资格验证，当前可以使用 Wise VIP 权益。"}
            </p>
            {currentTier === "VIP" && (
              <p className="mt-3 text-xs font-bold text-slate-400">已验证合作账户：{verifiedAccounts.length} 个</p>
            )}
          </div>
          <BindingForm partners={partnerFormProps(verificationPartners)} />
        </section>

        {currentTier === "VIP" || currentTier === "VIP_PLUS" ? (
          <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100">
            <div className="flex gap-3">
              <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-black">你此时已经是 {currentTier === "VIP_PLUS" ? "Wise SVIP" : "Wise VIP"} 用户，可以享受对应权益。</p>
                <p className="mt-1 text-sm leading-6 text-emerald-800/80 dark:text-emerald-100/80">
                  已审核通过的合作账户会持续记录在 Wise ID 下，后续权益会围绕同一个账户发放。
                </p>
              </div>
            </div>
          </section>
        ) : latestNeedsReviewAccount ? (
          <section className="rounded-3xl border border-blue-200 bg-blue-50 p-5 text-blue-900 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-100">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-black">{latestNeedsReviewAccount.partner.name} 需要补充资料。</p>
                <p className="mt-1 text-sm leading-6 text-blue-800/80 dark:text-blue-100/80">
                  {latestNeedsReviewAccount.reviewNote || "请补充账户标识、开户时间或注册渠道后重新提交审核。"}
                </p>
              </div>
            </div>
          </section>
        ) : latestRejectedAccount ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-rose-900 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-100">
            <div className="flex gap-3">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-black">{latestRejectedAccount.partner.name} 的 VIP 审核已驳回。</p>
                <p className="mt-1 text-sm leading-6 text-rose-800/80 dark:text-rose-100/80">
                  {latestRejectedAccount.reviewNote || "请确认是否使用 Wise 合作渠道，并重新提交准确的账户标识。"}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
          <h2 className="text-2xl font-black">会员等级</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            你现在是 {getPublicTierLabel(currentTier)}
            {nextTier ? `，下一步是 ${getPublicTierLabel(nextTier)}。` : "，当前公开等级已经完成。"}
          </p>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {(["MEMBER", "VIP", "VIP_PLUS"] as PublicMembershipTier[]).map((tier, index) => {
              const isDone = index < currentTierIndex;
              const isCurrent = tier === currentTier;
              const Icon = isDone || isCurrent ? CircleCheck : Circle;
              return (
                <div
                  key={tier}
                  className={`rounded-2xl border p-5 ${
                    isCurrent
                      ? "border-amber-300 bg-amber-50/70 dark:border-amber-800/60 dark:bg-amber-950/25"
                      : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
                  }`}
                >
                  <Icon className={`mb-4 h-5 w-5 ${isDone || isCurrent ? "text-amber-500" : "text-slate-300 dark:text-slate-600"}`} />
                  <p className="font-black">{membershipJourneyCopy[tier].label}</p>
                  <p className="mt-1 text-xs font-bold text-slate-400">{membershipJourneyCopy[tier].short}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{membershipJourneyCopy[tier].description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {currentTier === "MEMBER" ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black">升级 Wise VIP</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
                  VIP 群主要面向已经在交易，或准备认真开始交易的朋友。我们设置核验门槛，是为了让群里的策略、点位和复盘能够聊出更多有价值的内容。
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {memberUpgradeGuide.map(([step, title, text]) => (
                <div key={step} className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 font-mono text-xs font-black text-amber-300 dark:bg-white dark:text-slate-950">
                    {step}
                  </div>
                  <h3 className="mt-4 font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{text}</p>
                </div>
              ))}
            </div>
            <div className="mt-7">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-black uppercase text-amber-600 dark:text-amber-300">Choose Your Route</p>
                  <h3 className="mt-1 text-xl font-black">选择你真正会用的交易路径</h3>
                </div>
                <p className="max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                  先完成对应平台开户或注册，再回到账户中心提交账户标识。
                </p>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                {vipRouteOptions.map((route) => {
                  const Icon = route.icon;
                  return (
                    <article
                      key={route.title}
                      className="flex min-h-[280px] flex-col rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:border-amber-300 hover:bg-white dark:border-slate-800 dark:bg-slate-950 dark:hover:border-amber-800 dark:hover:bg-slate-900"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:text-amber-300 dark:ring-slate-800">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
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
                      <Link
                        href={route.href}
                        className="mt-auto inline-flex items-center pt-5 text-sm font-black text-amber-700 transition hover:text-amber-600 dark:text-amber-300"
                      >
                        {route.cta}
                        <ArrowUpRight className="ml-1.5 h-4 w-4" />
                      </Link>
                    </article>
                  );
                })}
              </div>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-amber-300 dark:bg-white dark:text-slate-950">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-black">后续如何成为 Wise SVIP</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                      先成为 Wise VIP。之后会根据合作渠道、有效记录和参与深度判断 SVIP 资格，对应更高等级的资源对接、周边福利和线下见面机会。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300">
                <BadgeCheck className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-black">我的 VIP 权益</h2>
              <div className="mt-5 space-y-3">
                {getEntitlementBenefitDisplays(currentTier, activeEntitlements.map((entitlement) => entitlement.key)).map((display) => (
                  <div key={display.title} className="flex gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    <div>
                      <p className="font-black">{display.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{display.description}</p>
                    </div>
                  </div>
                ))}
                {activeEntitlements
                  .filter((entitlement) => !["vip_group", "vip_plus"].includes(entitlement.key))
                  .map((entitlement) => {
                    const display = getEntitlementDisplay(entitlement.key);
                    return (
                      <div key={entitlement.id} className="flex gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                        <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                        <div>
                          <p className="font-black">{display.title}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{display.description}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-black">{currentTier === "VIP_PLUS" ? "SVIP 状态" : "升级 Wise SVIP"}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
                {currentTier === "VIP_PLUS"
                  ? "你已经达到 Wise SVIP 等级。"
                  : hasVipPlusCandidate
                    ? "当前已有支持 SVIP 资格判断的合作账户，但交易量同步还未接入；接入后会按 Partner 配置规则判断。"
                    : "当前合作账户暂不支持自动交易量统计。绑定支持交易量统计的合作交易所后，系统会根据配置规则判断 SVIP 资格。"}
              </p>
              {vipPlusPartners.length > 0 && currentTier !== "VIP_PLUS" && (
                <div className="mt-4 space-y-2">
                  {vipPlusPartners.map((partner) => (
                    <details key={partner.slug} className="rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-950">
                      <summary className="cursor-pointer list-none font-bold text-slate-900 dark:text-slate-100">
                        {partner.name}
                        <span className="float-right text-xs font-black text-amber-700 dark:text-amber-300">查看升级规则</span>
                      </summary>
                      {partner.qualificationRules && (
                        <div className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-xs leading-6 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                          <p>指标：{partner.qualificationRules.metricType}</p>
                          <p>门槛：{partner.qualificationRules.threshold ? `读取 Partner 配置：${partner.qualificationRules.threshold}` : "按 Partner 配置"}</p>
                          <p>周期：{partner.qualificationRules.period}</p>
                          <p>{partner.qualificationRules.description}</p>
                        </div>
                      )}
                    </details>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black">我的合作账户</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">账户标识默认隐藏，只展示审核所需状态。</p>
            </div>
            <p className="text-sm font-bold text-slate-400">{user.partnerAccounts.length} 个账户</p>
          </div>
          <div className="mt-6 space-y-3">
            {user.partnerAccounts.length > 0 ? (
              user.partnerAccounts.map((account) => {
                const Icon =
                  account.status === "VERIFIED"
                    ? CircleCheck
                    : account.status === "PENDING"
                      ? Clock3
                      : account.status === "REJECTED"
                        ? XCircle
                        : Link2;
                return (
                  <div
                    key={account.id}
                    className={`grid gap-3 rounded-2xl border p-4 text-sm md:grid-cols-[1fr_auto_auto] md:items-center ${
                      account.status === "REJECTED"
                        ? "border-rose-200 bg-rose-50/60 dark:border-rose-900/50 dark:bg-rose-950/20"
                        : account.status === "NEEDS_REVIEW"
                          ? "border-blue-200 bg-blue-50/60 dark:border-blue-900/50 dark:bg-blue-950/20"
                          : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                      <div>
                        <p className="font-black">{account.partner.name}</p>
                        <p className="mt-1 text-xs font-bold text-slate-400">{partnerTypeLabels[account.partner.type]}</p>
                        {account.reviewNote && <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">审核备注：{account.reviewNote}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="font-mono font-bold text-slate-500 dark:text-slate-400">{maskIdentifier(account.externalIdentifier)}</p>
                      <details className="text-xs text-slate-500 dark:text-slate-400">
                        <summary className="cursor-pointer font-bold text-amber-700 dark:text-amber-300">查看详情</summary>
                        <p className="mt-2 break-all font-mono">{account.externalIdentifier}</p>
                      </details>
                    </div>
                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${getStatusTone(account.status)}`}>
                      {getPartnerAccountStatusLabel(account.status)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm leading-7 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                当前还没有提交过合作账户。点击“绑定新的合作账户”开始提交审核。
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
