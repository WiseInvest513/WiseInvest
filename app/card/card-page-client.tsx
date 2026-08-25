"use client";

import { useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  BadgeCheck,
  Banknote,
  BookOpen,
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  Info,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { ResourceIcon } from "@/components/ui/resource-icon";
import { cn } from "@/lib/utils";
import { getSafeExternalUrl } from "@/lib/security/external-links";
import { cardStats, virtualCardProducts, type CardAiTone, type CardPaymentSupport, type VirtualCardProduct } from "./data";

type FilterKey = "all" | "ai" | "daily" | "transfer" | "pending";

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "全部卡片" },
  { key: "ai", label: "AI 订阅" },
  { key: "daily", label: "日常消费" },
  { key: "transfer", label: "资金流转" },
  { key: "pending", label: "待补教程" },
];

const aiToneClass: Record<CardAiTone, string> = {
  strong: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300",
  stable: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300",
  usable: "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-300",
  watch: "border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
  pending: "border-slate-200 bg-white text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-500",
};

const statusClass: Record<string, string> = {
  主力使用: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300",
  主力备选: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-300",
  订阅常用: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-300",
  轻量开卡: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-800 dark:bg-fuchsia-900/20 dark:text-fuchsia-300",
  实测推荐: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300",
  热门观察: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-300",
  持续观察: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
  待补教程: "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400",
  待接入: "border-slate-200 bg-white text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-500",
};

const paymentClass: Record<CardPaymentSupport, string> = {
  yes: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300",
  no: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300",
  partial: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300",
  unknown: "border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500",
};

function getPaymentText(value: CardPaymentSupport) {
  if (value === "yes") return "支持";
  if (value === "no") return "不支持";
  if (value === "partial") return "部分";
  return "待核";
}

function isExternalUrl(url: string) {
  return url.startsWith("http://") || url.startsWith("https://");
}

function getHref(url: string | null) {
  if (!url) return null;
  if (isExternalUrl(url)) {
    const safeUrl = getSafeExternalUrl(url);
    return safeUrl === "#" ? null : safeUrl;
  }
  return url;
}

function CopyInviteButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-amber-700 dark:hover:bg-amber-900/20 dark:hover:text-amber-300"
      aria-label="复制邀请码"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function ScoreStars({ score }: { score?: number }) {
  if (!score) {
    return <span className="text-xs font-black text-slate-400">待评分</span>;
  }

  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      ))}
      <span className="ml-1 text-xs font-black text-amber-700 dark:text-amber-300">{score.toFixed(1)}</span>
    </div>
  );
}

function ActionLink({
  href,
  children,
  variant = "light",
}: {
  href: string | null;
  children: ReactNode;
  variant?: "light" | "dark";
}) {
  const resolvedHref = getHref(href);

  if (!resolvedHref) {
    return (
      <span className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
        待接入
      </span>
    );
  }

  return (
    <a
      href={resolvedHref}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-black transition-colors",
        variant === "dark"
          ? "bg-slate-950 text-amber-300 hover:bg-amber-400 hover:text-slate-950 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
          : "border border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-amber-700 dark:hover:bg-amber-900/20 dark:hover:text-amber-300"
      )}
    >
      {children}
    </a>
  );
}

function FeeModal({
  card,
  onClose,
}: {
  card: VirtualCardProduct | null;
  onClose: () => void;
}) {
  if (!card) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[calc(100dvh-3rem)] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.24)] dark:border-slate-800 dark:bg-slate-950">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex min-w-0 items-center gap-3">
            <ResourceIcon
              url={card.issuerUrl}
              iconUrl={card.iconUrl}
              name={card.name}
              size={52}
              className="shrink-0"
              flush
            />
            <div className="min-w-0">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
                Fee Detail
              </div>
              <h2 className="mt-1 truncate text-xl font-black text-slate-950 dark:text-white">{card.name}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-amber-700 dark:hover:bg-amber-900/20 dark:hover:text-amber-300"
            aria-label="关闭费率弹窗"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <p className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm font-semibold leading-6 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            {card.feeSummary}
          </p>

          <div className="mt-4 grid gap-2">
            {card.feeItems.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="text-sm font-black text-slate-700 dark:text-slate-200">{item.label}</div>
                  <div className="text-right text-sm font-black text-slate-950 dark:text-white">{item.value}</div>
                </div>
                {item.note && <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.note}</p>}
              </div>
            ))}
          </div>

          {card.feeSources && card.feeSources.length > 0 && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-black text-slate-700 dark:text-slate-200">官方来源</div>
                {card.feeCheckedAt && (
                  <div className="text-[11px] font-bold text-slate-400">核验于 {card.feeCheckedAt}</div>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {card.feeSources.map((source) => {
                  const href = getHref(source.url);
                  if (!href) return null;

                  return (
                    <a
                      key={`${source.label}-${source.url}`}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-black text-slate-600 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-amber-700 dark:hover:bg-amber-900/20 dark:hover:text-amber-300"
                    >
                      {source.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            费率会随地区、卡种和活动调整。这里优先采用官方公开页面；申请前仍请以 App 或开卡确认页显示的实时费用为准。
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function CardRow({
  card,
  onOpenFee,
}: {
  card: VirtualCardProduct;
  onOpenFee: (card: VirtualCardProduct) => void;
}) {
  return (
    <article className="group grid gap-4 rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.055)] backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300/80 hover:shadow-[0_18px_44px_rgba(245,158,11,0.13)] dark:border-slate-800/80 dark:bg-slate-900/90 dark:hover:border-amber-700/80 lg:grid-cols-[1.24fr_0.92fr_1.08fr_0.98fr_1.34fr_0.72fr_1.02fr] lg:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <ResourceIcon
          url={card.issuerUrl}
          iconUrl={card.iconUrl}
          name={card.name}
          size={58}
          className="shrink-0"
          flush
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-black text-slate-950 dark:text-white">{card.name}</h2>
            <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-black", statusClass[card.status] ?? statusClass["待接入"])}>
              {card.status}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <ScoreStars score={card.score} />
            <span className="text-xs font-bold text-slate-400">{card.ratingLabel}</span>
          </div>
        </div>
      </div>

      <div>
        <div className="text-[11px] font-black text-slate-400 lg:hidden">邀请码</div>
        {card.inviteCode ? (
          <div className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 flex-1 truncate rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm font-black tracking-[0.08em] text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
              {card.inviteCode}
            </span>
            <CopyInviteButton code={card.inviteCode} />
          </div>
        ) : (
          <span className="inline-flex rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-400 dark:border-slate-800 dark:bg-slate-950">
            待补充
          </span>
        )}
      </div>

      <div>
        <div className="text-[11px] font-black text-slate-400 lg:hidden">AI 订阅</div>
        <div className={cn("inline-flex max-w-full items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-black", aiToneClass[card.ai.tone])}>
          <span className="text-sm leading-none">=</span>
          <span className="truncate">{card.ai.label}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{card.ai.detail}</p>
      </div>

      <div>
        <div className="text-[11px] font-black text-slate-400 lg:hidden">支付</div>
        <div className="flex flex-wrap gap-1.5">
          <span className={cn("rounded-lg border px-2 py-1 text-[11px] font-black", paymentClass[card.payment.applePay])}>
            Apple {getPaymentText(card.payment.applePay)}
          </span>
          <span className={cn("rounded-lg border px-2 py-1 text-[11px] font-black", paymentClass[card.payment.googlePay])}>
            Google {getPaymentText(card.payment.googlePay)}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{card.payment.detail}</p>
      </div>

      <div>
        <div className="text-[11px] font-black text-slate-400 lg:hidden">使用感受</div>
        <p className="line-clamp-3 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">{card.usage}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {card.bestFor.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpenFee(card)}
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-black text-amber-700 transition-colors hover:border-amber-300 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/35"
      >
        <FileText className="h-3.5 w-3.5" />
        费率
      </button>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
        <ActionLink href={card.tutorialLink}>
          <BookOpen className="h-3.5 w-3.5" />
          去学习
        </ActionLink>
        <ActionLink href={card.registerLink} variant="dark">
          <ExternalLink className="h-3.5 w-3.5" />
          去注册
        </ActionLink>
      </div>
    </article>
  );
}

function getFeeItemValue(card: VirtualCardProduct, keyword: string) {
  return card.feeItems.find((item) => item.label.includes(keyword))?.value ?? "查看详情";
}

function CardComparisonTable({
  cards,
  open,
  onClose,
}: {
  cards: VirtualCardProduct[];
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm">
      <section className="max-h-[calc(100dvh-3rem)] w-full max-w-6xl overflow-y-auto rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_28px_80px_rgba(15,23,42,0.24)] dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-slate-800 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
              <FileText className="h-3.5 w-3.5" />
              快速对比
            </div>
            <h2 className="mt-3 text-xl font-black text-slate-950 dark:text-white">
              虚拟 U 卡怎么选
            </h2>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">
              先看用途和申请门槛，再看支付绑定、充值费率和教程是否完整。费用以 App 下单页或官方页面为准。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-amber-700 dark:hover:bg-amber-900/20"
            aria-label="关闭对比表"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
              {["卡片", "适合用途", "申请 / KYC", "开卡 / 持有", "充值 / 入金", "支付绑定", "入口"].map((header) => (
                <th key={header} className="border-b border-slate-200 px-3 py-3 dark:border-slate-800">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cards.map((card) => (
              <tr key={card.id} className="align-top">
                <td className="border-b border-slate-100 px-3 py-3 font-black text-slate-950 dark:border-slate-800 dark:text-white">
                  {card.name}
                  <div className="mt-1 text-xs font-bold text-amber-600 dark:text-amber-300">{card.ratingLabel}</div>
                </td>
                <td className="border-b border-slate-100 px-3 py-3 text-xs font-semibold leading-5 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                  {card.bestFor.slice(0, 3).join(" / ")}
                </td>
                <td className="border-b border-slate-100 px-3 py-3 text-xs font-semibold leading-5 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                  {getFeeItemValue(card, "KYC")}
                </td>
                <td className="border-b border-slate-100 px-3 py-3 text-xs font-semibold leading-5 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                  {getFeeItemValue(card, "开卡")}
                </td>
                <td className="border-b border-slate-100 px-3 py-3 text-xs font-semibold leading-5 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                  {getFeeItemValue(card, "充值")}
                </td>
                <td className="border-b border-slate-100 px-3 py-3 text-xs font-semibold leading-5 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                  Apple {getPaymentText(card.payment.applePay)} / Google {getPaymentText(card.payment.googlePay)}
                </td>
                <td className="border-b border-slate-100 px-3 py-3 dark:border-slate-800">
                  <ActionLink href={card.tutorialLink}>
                    <BookOpen className="h-3.5 w-3.5" />
                    教程
                  </ActionLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </section>
    </div>,
    document.body
  );
}

export default function CardPageClient() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [activeFeeCard, setActiveFeeCard] = useState<VirtualCardProduct | null>(null);
  const [comparisonOpen, setComparisonOpen] = useState(false);

  const filteredCards = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return virtualCardProducts.filter((card) => {
      const matchKeyword =
        !keyword ||
        [card.name, card.issuer, card.inviteCode ?? "", card.usage, ...card.bestFor]
          .join(" ")
          .toLowerCase()
          .includes(keyword);

      const matchFilter =
        filter === "all" ||
        (filter === "ai" && ["strong", "stable", "usable"].includes(card.ai.tone)) ||
        (filter === "daily" && card.bestFor.some((tag) => ["日常消费", "支付宝", "微信消费", "GiffGaff"].includes(tag))) ||
        (filter === "transfer" && card.bestFor.some((tag) => ["资金流转", "国内外流通", "盈透入金", "嘉信入金", "转账"].includes(tag))) ||
        (filter === "pending" && (!card.tutorialLink || card.status === "待接入"));

      return matchKeyword && matchFilter;
    });
  }, [filter, query]);

  return (
    <div className="relative min-h-screen bg-slate-50 dot-grid dot-grid-light dark:bg-slate-950">
      <main className="relative z-[1] mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <section className="overflow-hidden rounded-[28px] border border-amber-200/70 bg-white/90 p-5 shadow-[0_18px_52px_rgba(15,23,42,0.07)] backdrop-blur-xl dark:border-amber-900/50 dark:bg-slate-900/90">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                <CreditCard className="h-3.5 w-3.5" />
                WiseInvest Card Library
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-4xl">
                虚拟 U 卡资料库
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                把虚拟 U 卡独立整理出来，重点看大陆用户能不能申请、是否需要境外地址证明、开卡成本、消费 / 换汇费率，以及 Apple Pay / Google Pay 绑定情况。
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {cardStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/75 px-3 py-3 shadow-inner shadow-white/70 dark:border-slate-800 dark:bg-slate-950/60 dark:shadow-none"
                >
                  <div className="text-2xl font-black text-slate-950 dark:text-white">{stat.value}</div>
                  <div className="mt-1 text-[11px] font-semibold text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[28px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_16px_46px_rgba(15,23,42,0.055)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {filters.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-black transition-colors",
                    filter === item.key
                      ? "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
                      : "border-slate-200 bg-white text-slate-500 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-amber-800 dark:hover:bg-amber-900/20 dark:hover:text-amber-300"
                  )}
                >
                  {item.key === "all" && <Sparkles className="h-3.5 w-3.5" />}
                  {item.key === "ai" && <ShieldCheck className="h-3.5 w-3.5" />}
                  {item.key === "daily" && <CreditCard className="h-3.5 w-3.5" />}
                  {item.key === "transfer" && <Banknote className="h-3.5 w-3.5" />}
                  {item.key === "pending" && <BadgeCheck className="h-3.5 w-3.5" />}
                  {item.label}
                </button>
              ))}
            </div>

            <label className="relative block w-full lg:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索卡片、邀请码、场景..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-amber-300 focus:ring-2 focus:ring-amber-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-amber-700 dark:focus:ring-amber-900/30"
              />
            </label>
            <button
              type="button"
              onClick={() => setComparisonOpen(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-black text-amber-700 transition-colors hover:border-amber-300 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/35"
            >
              <FileText className="h-3.5 w-3.5" />
              对比卡片
            </button>
          </div>

          <div className="mt-4 hidden rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400 dark:border-slate-800 dark:bg-slate-950/60 lg:grid lg:grid-cols-[1.24fr_0.92fr_1.08fr_0.98fr_1.34fr_0.72fr_1.02fr] lg:items-center">
            <span>卡片</span>
            <span>邀请码</span>
            <span>AI 订阅</span>
            <span>支付</span>
            <span>使用感受</span>
            <span>费率</span>
            <span>操作</span>
          </div>

          <div className="mt-3 grid gap-3">
            {filteredCards.map((card) => (
              <CardRow key={card.id} card={card} onOpenFee={setActiveFeeCard} />
            ))}
          </div>
        </section>
      </main>

      <FeeModal card={activeFeeCard} onClose={() => setActiveFeeCard(null)} />
      <CardComparisonTable cards={virtualCardProducts} open={comparisonOpen} onClose={() => setComparisonOpen(false)} />
    </div>
  );
}
