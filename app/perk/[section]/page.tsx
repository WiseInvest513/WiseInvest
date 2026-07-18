import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  BookOpen,
  Building2,
  CheckCircle2,
  ExternalLink,
  Globe2,
  Landmark,
  MessageCircle,
  Network,
  ShieldCheck,
  Sparkles,
  Star,
  Ticket,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ResourceIcon } from "@/components/ui/resource-icon";
import {
  getPerks2Section,
  perkSections,
  type Perks2Product,
  type Perks2Section,
  type Perks2Subcategory,
} from "../data";
import { CopyCodeButton } from "./copy-code-button";
import { WechatContactButton } from "./wechat-contact-button";

export const dynamicParams = false;

const sectionIcons: Record<string, LucideIcon> = {
  bank: Landmark,
  crypto: Network,
  broker: Building2,
  ipo: TrendingUp,
  "global-access": Globe2,
  "other-resources": Sparkles,
};

const formatCount = (value: number) =>
  value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);

const learningLinkClass =
  "inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm font-black text-slate-700 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-amber-700 dark:hover:bg-amber-900/20 dark:hover:text-amber-300";

const isExternalUrl = (url: string) => url.startsWith("http://") || url.startsWith("https://");

const witnessHighlights = [
  {
    title: "不用亲赴香港",
    value: "内地网点",
    description: "本人到所在城市的外资银行网点，即可启动香港、新加坡等境外账户申请。",
  },
  {
    title: "核心门槛清晰",
    value: "50万+",
    description: "多数方案需要在国内账户存入 50 万并保持至少 3 个完整自然月，星展通常门槛更高。",
  },
  {
    title: "流程更省时间",
    value: "1趟",
    description: "线下只需本人去网点办理一次，后续通过客户经理、律师视频和国际快递完成。",
  },
];

const witnessBanks = [
  { name: "汇丰", description: "信用卡权益强，适合大额消费和积分需求，但早期转账额度相对低。" },
  { name: "渣打", description: "转账额度和全球转账体验更好，适合资金周转和快进快出。" },
  { name: "东亚", description: "可申请免见证费用，利率较高，但材料要求会更细。" },
  { name: "恒生", description: "家庭账户优势明显，一笔达标资金可覆盖多位直系亲属。" },
  { name: "星展", description: "新加坡账户安全性和私密性更强，更适合高净值需求。" },
];

const witnessSteps = [
  "联系 Wise，对接合适渠道和当地客户经理。",
  "本人前往内地网点，携带身份证和实名手机号完成国内账户流程。",
  "客户经理协助对接律师，后续通过视频见证完成境外账户申请。",
  "等待国际快递收卡并激活，无需本人再跑香港或海外。",
];

const eastWestAdvantages = [
  "美国本土银行，不参与 CRS，账户信息不上报中国税务局",
  "配合盈透证券（IBKR）打造完整美国金融体系",
  "支持 ACH / 电汇，与 IBKR 资金划转顺畅",
];

const eastWestAudience = [
  "希望资产合规出海、规避 CRS 申报的投资者",
  "已持有或计划开设盈透证券账户的用户",
  "需要美国银行账户 + 美券组合的用户",
];

export function generateStaticParams() {
  return perkSections.map((section) => ({ section: section.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ section: string }> }
): Promise<Metadata> {
  const { section: slug } = await params;
  const section = getPerks2Section(slug);
  if (!section) return {};

  return {
    title: `${section.title}福利 - Wise Invest`,
    description: section.summary,
  };
}

function ProductCard({ product, wide = false }: { product: Perks2Product; wide?: boolean }) {
  const stars = Array.from({ length: 5 });
  const score = Math.max(0, Math.min(5, product.recommendation));
  const tutorialIsExternal = product.tutorialLink ? isExternalUrl(product.tutorialLink) : false;
  const isLongCode = (product.code?.length ?? 0) > 10;
  const codePanel = (
    <div
      className={`rounded-xl border border-slate-200/80 bg-slate-50/75 shadow-inner shadow-white/70 dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-none ${
        wide ? "p-2.5" : "p-3"
      }`}
    >
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-black text-slate-400">
        <Ticket className="h-3.5 w-3.5 text-amber-500" />
        邀请码
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <div
          className={`flex min-h-8 min-w-0 flex-1 items-center overflow-hidden rounded-lg border border-dashed border-slate-300/90 bg-white px-2.5 font-mono font-black text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white ${
            isLongCode ? "text-xs tracking-[0.03em]" : "text-[13px] tracking-[0.08em] sm:text-sm"
          }`}
        >
          <span className="truncate whitespace-nowrap">
          {product.code ?? "无需填写"}
          </span>
        </div>
        {product.code && <CopyCodeButton code={product.code} />}
      </div>
    </div>
  );
  const benefitPanel = (
    <div
      className={`rounded-xl border border-amber-200/80 bg-amber-50/90 shadow-inner shadow-white/70 dark:border-amber-800/60 dark:bg-amber-900/20 dark:shadow-none ${
        wide ? "p-2.5" : "p-3"
      }`}
    >
      <div className={`flex flex-col justify-between ${wide ? "min-h-[76px]" : "min-h-[92px]"}`}>
        <div>
          <div className="text-[11px] font-black text-amber-700 dark:text-amber-300">
            {product.benefitLabel ?? "福利权益"}
          </div>
          <div
            className={`mt-2 inline-flex max-w-full items-center rounded-lg border border-amber-200/80 bg-white/75 px-2.5 py-1.5 font-black leading-none text-amber-600 shadow-sm shadow-amber-100/60 dark:border-amber-800/50 dark:bg-slate-950/30 dark:text-amber-300 ${
              wide ? "text-[24px]" : "text-[28px]"
            }`}
          >
            <span className="truncate whitespace-nowrap">{product.highlightValue}</span>
          </div>
        </div>
        <div className="mt-2 line-clamp-2 text-[13px] font-black leading-5 text-slate-800 dark:text-slate-100">
          {product.benefit}
        </div>
      </div>
    </div>
  );
  const renderActions = (stacked = wide) => (
    <div
      className={`flex flex-col gap-2 border-t border-slate-100 pt-3 dark:border-slate-800 ${
        stacked ? "lg:border-l lg:border-t-0 lg:pl-3 lg:pt-0" : "sm:flex-row"
      } ${stacked ? "" : "mt-auto"}`}
    >
      {product.tutorialLink && tutorialIsExternal && (
        <a
          href={product.tutorialLink}
          target="_blank"
          rel="noopener noreferrer"
          className={learningLinkClass}
        >
          <BookOpen className="h-4 w-4" />
          去学习
        </a>
      )}
      {product.tutorialLink && !tutorialIsExternal && (
        <Link
          href={product.tutorialLink}
          className={learningLinkClass}
        >
          <BookOpen className="h-4 w-4" />
          去学习
        </Link>
      )}
      {product.contactWeChat ? (
        <WechatContactButton
          platform={product.title}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-black text-amber-300 shadow-[0_10px_22px_rgba(15,23,42,0.16)] transition-colors hover:bg-amber-400 hover:text-slate-950 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
        >
          {product.registerLabel ?? "联系博主"}
          <MessageCircle className="h-4 w-4" />
        </WechatContactButton>
      ) : (
        <a
          href={product.registerLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-black text-amber-300 shadow-[0_10px_22px_rgba(15,23,42,0.16)] transition-colors hover:bg-amber-400 hover:text-slate-950 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
        >
          {product.registerLabel ?? "去注册"}
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </div>
  );

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.08)] ring-1 ring-white/80 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300/80 hover:shadow-[0_18px_42px_rgba(245,158,11,0.16)] dark:border-slate-800/80 dark:bg-slate-950 dark:ring-white/5 dark:hover:border-amber-700/80 dark:hover:shadow-amber-950/20 ${
        wide ? "min-h-[176px] lg:col-span-2" : "min-h-[244px]"
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-950/80 via-amber-400 to-yellow-300/90 dark:from-amber-500 dark:via-yellow-300 dark:to-amber-500" />

      <div
        className={`flex shrink-0 items-start justify-between gap-4 ${
          wide ? "mb-3 min-h-[58px]" : "mb-4 min-h-[74px]"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <ResourceIcon
            url={product.iconUrl ?? product.registerLink}
            iconUrl={product.iconUrl}
            name={product.title}
            size={44}
            rounded
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-black text-slate-950 dark:text-white">{product.title}</h3>
              {product.badge && (
                <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[11px] font-black text-slate-950 shadow-sm shadow-amber-200/60">
                  {product.badge}
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50/90 px-2.5 py-0.5 text-[11px] font-black text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300">
                <ShieldCheck className="h-3 w-3" />
                {product.recommendationText}
                <span className="mx-0.5 h-3 w-px bg-amber-200 dark:bg-amber-800" />
                {stars.map((_, index) => (
                  <Star
                    key={index}
                    className={`h-3 w-3 ${index < score ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-slate-700"}`}
                  />
                ))}
                {score.toFixed(1)}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {product.description}
            </p>
          </div>
        </div>

        {product.claimedCount && (
          <div className="shrink-0 text-right">
            <div className="flex items-center justify-end gap-1 text-sm font-black text-amber-600 dark:text-amber-400">
              <Users className="h-3.5 w-3.5" />
              {formatCount(product.claimedCount)}
            </div>
            <div className="mt-0.5 text-[10px] font-semibold text-slate-400">已领取</div>
          </div>
        )}
      </div>

      {product.imageUrl ? (
        <div className="flex flex-1 flex-col">
          <div className="mb-4 grid gap-3 md:grid-cols-[11rem_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-amber-50/45 p-2 shadow-inner shadow-white/80 dark:border-slate-800/80 dark:from-slate-900 dark:via-slate-950 dark:to-amber-950/15 dark:shadow-none">
              <div className="relative h-40 w-full md:h-full md:min-h-[154px]">
                <Image
                  src={product.imageUrl}
                  alt={product.imageAlt ?? product.title}
                  fill
                  sizes="(min-width: 1024px) 176px, 100vw"
                  className="object-contain"
                />
              </div>
            </div>
            <div className="grid gap-3">
              {codePanel}
              {benefitPanel}
            </div>
          </div>
          {renderActions(false)}
        </div>
      ) : (
        <div className={wide ? "grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem]" : "flex flex-1 flex-col"}>
          <div className={`${wide ? "grid gap-3 md:grid-cols-2" : "mb-4 grid gap-3 md:grid-cols-2"}`}>
            {codePanel}
            {benefitPanel}
          </div>
          {renderActions(wide)}
        </div>
      )}
    </article>
  );
}

function ProductSlot({
  section,
  subcategory,
  index,
}: {
  section: Perks2Section;
  subcategory: Perks2Subcategory;
  index: number;
}) {
  const displayIndex = `${section.index}-${String(index + 1).padStart(2, "0")}`;

  return (
    <button className="group flex h-full min-h-[244px] flex-col rounded-2xl border border-dashed border-slate-300/90 bg-white/85 p-4 text-left shadow-[0_10px_26px_rgba(15,23,42,0.05)] ring-1 ring-white/70 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300/80 hover:bg-white hover:shadow-[0_16px_36px_rgba(245,158,11,0.12)] dark:border-slate-800/80 dark:bg-slate-950/75 dark:ring-white/5 dark:hover:border-amber-700/80 dark:hover:shadow-amber-950/20">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="rounded-md bg-slate-950 px-2 py-1 font-mono text-[11px] font-black text-amber-300 dark:bg-amber-400 dark:text-slate-950">
          {displayIndex}
        </span>
        <ExternalLink className="h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-amber-500" />
      </div>
      <div className="flex-1">
        <h3 className="text-base font-black text-slate-950 dark:text-white">
          {subcategory.title}产品位 {String(index + 1).padStart(2, "0")}
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          这里会承载产品名称、邀请码、福利权益、学习链接、注册链接和推荐指数。
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {["邀请码 + 复制", "福利权益", "学习链接", "注册链接"].map((item) => (
            <span
              key={item}
              className="rounded-lg border border-slate-200/80 bg-slate-50/80 px-2 py-2 text-xs font-bold text-slate-400 dark:border-slate-800 dark:bg-slate-900"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
        <span className="text-[11px] font-bold text-slate-400">待接入</span>
        <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-500" />
      </div>
    </button>
  );
}

function WitnessAccountBlock({
  section,
  subcategory,
}: {
  section: Perks2Section;
  subcategory: Perks2Subcategory;
}) {
  return (
    <section
      id={subcategory.slug}
      className="scroll-mt-24 overflow-hidden rounded-[26px] border border-slate-200/90 bg-white/95 p-4 shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-white/80 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/95 dark:ring-white/5"
    >
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-black uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
              {section.eyebrow}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-950 dark:text-white">{subcategory.title}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            {subcategory.description}
          </p>
        </div>
        <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300">
          详细方案入口
        </span>
      </div>

      <div className="rounded-[22px] border border-slate-200/80 bg-slate-100/75 p-3 shadow-inner shadow-slate-200/70 dark:border-slate-800/80 dark:bg-slate-950/55 dark:shadow-none md:p-4">
        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] dark:border-amber-900/50 dark:from-amber-950/25 dark:via-slate-950 dark:to-slate-950">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
                Mainland Witness Account Opening
              </p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                在内地完成境外银行卡开户
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                见证开户适合不方便亲自去香港，或者想同时规划香港、新加坡等境外账户的用户。
                它的核心不是远程代办，而是本人在内地外资银行网点完成见证流程，后续由银行客户经理和律师协助推进境外账户申请。
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-right shadow-inner shadow-white/70 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
              <div className="text-3xl font-black text-amber-600 dark:text-amber-300">98%</div>
              <div className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">综合下卡率参考</div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            {witnessHighlights.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80"
              >
                <div className="text-2xl font-black text-slate-950 dark:text-white">{item.value}</div>
                <h4 className="mt-2 text-sm font-black text-slate-950 dark:text-white">{item.title}</h4>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-3 flex items-center gap-2">
              <Landmark className="h-4 w-4 text-amber-500" />
              <h3 className="text-base font-black text-slate-950 dark:text-white">五家主要见证银行</h3>
            </div>
            <div className="grid gap-2">
              {witnessBanks.map((bank) => (
                <div
                  key={bank.name}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/70"
                >
                  <div className="text-sm font-black text-slate-950 dark:text-white">{bank.name}</div>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{bank.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-500" />
              <h3 className="text-base font-black text-slate-950 dark:text-white">办理流程</h3>
            </div>
            <div className="space-y-2">
              {witnessSteps.map((step, index) => (
                <div
                  key={step}
                  className="flex gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/70"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 font-mono text-[11px] font-black text-amber-300 dark:bg-amber-400 dark:text-slate-950">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="text-xs font-semibold leading-6 text-slate-600 dark:text-slate-300">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <a
          href="https://www.wise-witness.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 grid grid-cols-1 overflow-hidden rounded-2xl border border-amber-300 bg-slate-950 shadow-[0_18px_48px_rgba(15,23,42,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-[0_24px_58px_rgba(245,158,11,0.22)] dark:border-amber-700 dark:bg-slate-950"
        >
          <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
            <div>
              <div className="mb-2 inline-flex rounded-full border border-amber-300/60 bg-amber-300/10 px-3 py-1 text-xs font-black text-amber-300">
                见证开户完整页面
              </div>
              <h3 className="text-2xl font-black tracking-tight text-white">
                查看可办理银行、门槛、费用和对接流程
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                需要更详细的银行对比、适合人群、材料准备和后续安排，可以进入独立页面继续看完整方案。
              </p>
            </div>
            <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 shadow-[0_12px_28px_rgba(245,158,11,0.25)] md:w-auto">
              打开详细内容
              <ExternalLink className="h-4 w-4" />
            </span>
          </div>
        </a>
      </div>
    </section>
  );
}

function EastWestBankBlock({
  section,
  subcategory,
}: {
  section: Perks2Section;
  subcategory: Perks2Subcategory;
}) {
  return (
    <section
      id={subcategory.slug}
      className="scroll-mt-24 overflow-hidden rounded-[26px] border border-slate-200/90 bg-white/95 p-4 shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-white/80 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/95 dark:ring-white/5"
    >
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-black uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
              {section.eyebrow}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-950 dark:text-white">{subcategory.title}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            {subcategory.description}
          </p>
        </div>
        <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300">
          联系博主协助
        </span>
      </div>

      <div className="rounded-[22px] border border-slate-200/80 bg-slate-100/75 p-3 shadow-inner shadow-slate-200/70 dark:border-slate-800/80 dark:bg-slate-950/55 dark:shadow-none md:p-4">
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="p-5 md:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <ResourceIcon
                    url="https://www.eastwestbank.com"
                    iconUrl="https://www.eastwestbank.com"
                    name="华美银行"
                    size={52}
                    rounded
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                        华美银行
                      </h3>
                      <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[11px] font-black text-slate-950 shadow-sm shadow-amber-200/60">
                        美国本土银行
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      总部位于加州，专注服务华人社区，适合和盈透证券一起组成美国银行 + 美券账户组合。
                    </p>
                  </div>
                </div>
                <div className="w-fit rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left dark:border-amber-800/60 dark:bg-amber-900/20 sm:text-right">
                  <div className="text-3xl font-black leading-none text-amber-600 dark:text-amber-300">无 CRS</div>
                  <div className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">核心优势</div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                {[
                  { label: "银行属性", value: "US Bank", desc: "美国本土银行账户" },
                  { label: "组合方案", value: "IBKR", desc: "配合盈透资金划转" },
                  { label: "联系方式", value: "WeChat", desc: "备注华美银行对接" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-inner shadow-white/70 dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-none"
                  >
                    <div className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400">
                      {item.label}
                    </div>
                    <div className="mt-2 text-xl font-black text-slate-950 dark:text-white">{item.value}</div>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  { title: "核心优势", items: eastWestAdvantages },
                  { title: "适合人群", items: eastWestAudience },
                ].map((group) => (
                  <div
                    key={group.title}
                    className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
                  >
                    <h4 className="text-sm font-black text-slate-950 dark:text-white">{group.title}</h4>
                    <div className="mt-3 space-y-2">
                      {group.items.map((item) => (
                        <div key={item} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                          <p className="text-xs font-semibold leading-6 text-slate-600 dark:text-slate-300">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-5 text-white dark:border-slate-800 lg:border-l lg:border-t-0 md:p-6">
              <div className="mb-4 inline-flex rounded-full border border-amber-300/50 bg-amber-300/10 px-3 py-1 text-xs font-black text-amber-300">
                联系入口
              </div>
              <h3 className="text-2xl font-black tracking-tight">扫码或点击按钮联系博主</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                华美银行开户需要联系博主协助。添加好友后发送「华美银行」，即可获取开户支持和具体安排。
              </p>

              <WechatContactButton
                platform="华美银行"
                className="group mt-5 block w-full overflow-hidden rounded-2xl border border-amber-300/40 bg-white p-3 text-left shadow-[0_18px_46px_rgba(0,0,0,0.22)] transition-all hover:-translate-y-0.5 hover:border-amber-300"
              >
                <div className="mx-auto max-w-[220px] overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <img src="/images/微信图片520.png" alt="微信二维码" className="block h-auto w-full" />
                </div>
                <div className="mt-3 flex items-center justify-center gap-2 text-sm font-black text-slate-950">
                  点击放大二维码
                  <ExternalLink className="h-4 w-4 text-amber-600 transition-transform group-hover:translate-x-0.5" />
                </div>
              </WechatContactButton>

              <WechatContactButton
                platform="华美银行"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 shadow-[0_12px_28px_rgba(245,158,11,0.25)] transition-colors hover:bg-amber-300"
              >
                <MessageCircle className="h-4 w-4" />
                联系博主
              </WechatContactButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SubcategoryBlock({
  section,
  subcategory,
}: {
  section: Perks2Section;
  subcategory: Perks2Subcategory;
}) {
  const products = subcategory.products ?? [];
  const emptySlots = Math.max(subcategory.slots - products.length, 0);
  const shouldWidenLastProduct = products.length > 0 && emptySlots === 0 && products.length % 2 === 1;

  if (section.slug === "bank" && subcategory.slug === "witness-account") {
    return <WitnessAccountBlock section={section} subcategory={subcategory} />;
  }

  if (section.slug === "bank" && subcategory.slug === "east-west-bank") {
    return <EastWestBankBlock section={section} subcategory={subcategory} />;
  }

  return (
    <section
      id={subcategory.slug}
      className="scroll-mt-24 overflow-hidden rounded-[26px] border border-slate-200/90 bg-white/95 p-4 shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-white/80 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/95 dark:ring-white/5"
    >
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-black uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
              {section.eyebrow}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-950 dark:text-white">{subcategory.title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{subcategory.description}</p>
        </div>
        <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300">
          {subcategory.slots} 个产品位
        </span>
      </div>

      <div className="rounded-[22px] border border-slate-200/80 bg-slate-100/75 p-3 shadow-inner shadow-slate-200/70 dark:border-slate-800/80 dark:bg-slate-950/55 dark:shadow-none md:p-4">
        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              wide={shouldWidenLastProduct && index === products.length - 1}
            />
          ))}
          {Array.from({ length: emptySlots }).map((_, index) => (
            <ProductSlot
              key={`${subcategory.slug}-${index}`}
              section={section}
              subcategory={subcategory}
              index={products.length + index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function Perks2SectionPage(
  { params }: { params: Promise<{ section: string }> }
) {
  const { section: slug } = await params;
  const section = getPerks2Section(slug);
  if (!section) notFound();

  const Icon = sectionIcons[section.slug] ?? Sparkles;
  const slotCount = section.subcategories.reduce((sum, subcategory) => sum + subcategory.slots, 0);

  return (
    <div className="relative min-h-screen bg-slate-50 dot-grid dot-grid-light dark:bg-slate-950">
      <main className="relative z-[1] mx-auto max-w-6xl px-4 py-7 md:px-6 md:py-9">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            href="/perk"
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white/86 px-3 py-2 text-sm font-bold text-slate-600 shadow-sm backdrop-blur transition-colors hover:border-amber-300 hover:text-amber-700 dark:border-slate-800 dark:bg-slate-900/86 dark:text-slate-300 dark:hover:border-amber-700 dark:hover:text-amber-300"
          >
            <ArrowLeft className="h-4 w-4" />
            福利
          </Link>
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300">
            {slotCount} 个产品位
          </div>
        </div>

        <section className="mb-5 overflow-hidden rounded-[24px] border border-slate-200/90 bg-white/95 shadow-[0_18px_54px_rgba(15,23,42,0.07)] ring-1 ring-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 dark:ring-white/5">
          <div className="grid lg:grid-cols-[330px_1fr]">
            <div className="border-b border-slate-200/80 bg-gradient-to-br from-amber-50/95 via-white to-white p-5 dark:border-slate-800 dark:from-amber-900/14 dark:via-slate-900 dark:to-slate-900 lg:border-b-0 lg:border-r">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-amber-300 shadow-sm dark:bg-amber-400 dark:text-slate-950">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="font-mono text-sm font-black text-amber-600 dark:text-amber-300">
                  {section.index}
                </span>
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
                {section.eyebrow}
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                {section.title}
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {section.summary}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {section.subcategories.map((subcategory) => (
                  <a
                    key={subcategory.slug}
                    href={`#${subcategory.slug}`}
                    className="rounded-full border border-amber-200 bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition-colors hover:border-amber-300 hover:text-amber-700 dark:border-amber-800/50 dark:bg-slate-950/70 dark:text-slate-300 dark:hover:text-amber-300"
                  >
                    {subcategory.title}
                  </a>
                ))}
              </div>
            </div>

            <div className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
                    产品矩阵
                  </p>
                  <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">
                    {section.title}产品入口
                  </h2>
                </div>
                <div className="hidden items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 md:flex">
                  <Banknote className="h-3.5 w-3.5 text-amber-500" />
                  {section.subcategories.length} 个方向
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {section.subcategories.map((subcategory) => (
                  <a
                    key={subcategory.slug}
                    href={`#${subcategory.slug}`}
                    className="group rounded-2xl border border-slate-200/90 bg-slate-50/90 p-3 shadow-inner shadow-white/70 transition-all hover:border-amber-300 hover:bg-amber-50/80 dark:border-slate-800 dark:bg-slate-950/70 dark:shadow-none dark:hover:border-amber-700 dark:hover:bg-amber-900/15"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="rounded-md bg-slate-950 px-2 py-1 font-mono text-[11px] font-black text-amber-300 dark:bg-amber-400 dark:text-slate-950">
                        {String(subcategory.slots).padStart(2, "0")}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-500" />
                    </div>
                    <h3 className="text-sm font-black text-slate-950 dark:text-white">{subcategory.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      {subcategory.description}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-4">
          {section.subcategories.map((subcategory) => (
            <SubcategoryBlock
              key={subcategory.slug}
              section={section}
              subcategory={subcategory}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
