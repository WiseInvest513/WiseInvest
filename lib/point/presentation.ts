import type { PointPlan, PointQuote } from "./types";

export const POINT_DISCLAIMER =
  "本页点位为发布时的市场观察与大致参考，并非精确成交价格或自动交易指令。行情可能在接近参考位时提前转向，也可能突破后继续运行，触及点位不代表应立即入场。";
export const POINT_RISK_NOTE =
  "请结合实时走势、计划有效期及最新更新具体分析，并根据自身风险承受能力独立决策。内容仅供学习交流，不构成针对个人的投资建议或收益承诺，交易可能造成损失。";

const QUOTE_TTL = 5 * 60_000;
const MAX_STALE_AGE = 24 * 60 * 60_000;

function decimalParts(value: unknown): [string, string] | null {
  if (
    typeof value !== "string" ||
    value.length > 80 ||
    !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)
  )
    return null;
  const [integer, fraction = ""] = value.split(".");
  return [integer, fraction.replace(/0+$/, "")];
}

function positiveDecimal(value: unknown): value is string {
  return decimalParts(value) !== null && /[1-9]/.test(value as string);
}

/** Inputs are validated plain decimals. Compare without IEEE-754 rounding. */
function compareDecimal(a: string, b: string): number {
  const [aInteger, aFraction] = decimalParts(a)!;
  const [bInteger, bFraction] = decimalParts(b)!;
  if (aInteger.length !== bInteger.length)
    return aInteger.length < bInteger.length ? -1 : 1;
  if (aInteger !== bInteger) return aInteger < bInteger ? -1 : 1;
  const digits = Math.max(aFraction.length, bFraction.length);
  const left = aFraction.padEnd(digits, "0");
  const right = bFraction.padEnd(digits, "0");
  return left === right ? 0 : left < right ? -1 : 1;
}

export function pointPrice(value: string | null | undefined): string {
  const parts = decimalParts(value);
  if (!parts) return "—";
  const [integer, fraction] = parts;
  return (
    integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
    (fraction ? `.${fraction}` : "")
  );
}

export function effectivePointQuote(
  quote: PointQuote,
  now?: number,
): PointQuote;
export function effectivePointQuote(
  quote: PointQuote | undefined,
  now?: number,
): PointQuote | undefined;
/** A server's fresh flag ages on the client; cached/failed quotes never become fresh again. */
export function effectivePointQuote(
  quote: PointQuote | undefined,
  now = Date.now(),
): PointQuote | undefined {
  if (!quote) return undefined;
  if (!positiveDecimal(quote.price) || quote.status === "unavailable") {
    return { ...quote, price: null, status: "unavailable" };
  }
  const source = quote.sourceTime ? Date.parse(quote.sourceTime) : NaN;
  const fetched = quote.fetchedAt ? Date.parse(quote.fetchedAt) : NaN;
  // Match the provider service: no future-clock grace or invented source timestamp.
  const validTimes =
    Number.isFinite(now) &&
    Number.isFinite(source) &&
    Number.isFinite(fetched) &&
    source > 0 &&
    source <= fetched &&
    fetched <= now;
  if (!validTimes) {
    // Explicitly stale/no-time DEMO or cached values may be shown, but never classified.
    return {
      ...quote,
      status: "stale",
      message: quote.message ?? "行情时间未通过核验，仅显示参考数据。",
    };
  }
  if (now - source > MAX_STALE_AGE || now - fetched > MAX_STALE_AGE) {
    return {
      ...quote,
      price: null,
      status: "unavailable",
      message: "行情已超过可展示时限，请重新获取。",
    };
  }
  if (
    quote.status !== "fresh" ||
    now - source >= QUOTE_TTL ||
    now - fetched >= QUOTE_TTL
  ) {
    return {
      ...quote,
      status: "stale",
      message: quote.message ?? "行情已延迟，仅显示上次参考数据。",
    };
  }
  return quote;
}

export function pointTime(
  value: string | null | undefined,
  short = false,
): string {
  if (!value || !Number.isFinite(Date.parse(value))) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: short ? undefined : "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function entryLabel(plan: PointPlan): string {
  return plan.entryLower && plan.entryUpper
    ? `${pointPrice(plan.entryLower)} – ${pointPrice(plan.entryUpper)}`
    : `≈ ${pointPrice(plan.entryPrice)}`;
}

export function pointState(
  plan: PointPlan,
  quote?: PointQuote,
  now = Date.now(),
) {
  if (plan.status === "DRAFT")
    return {
      label: "未发布",
      description: "此计划尚未发布。",
      tone: "neutral",
    };
  if (plan.status === "WITHDRAWN")
    return {
      label: "已撤回",
      description: "这条观察已撤回，仅作为历史记录保留。",
      tone: "neutral",
    };
  if (plan.status === "CLOSED")
    return {
      label: "已结束",
      description: "这条观察已由作者结束，不再作为当前参考。",
      tone: "neutral",
    };
  const validFrom = Date.parse(plan.validFrom);
  const validUntil = Date.parse(plan.validUntil);
  if (
    !Number.isFinite(now) ||
    !Number.isFinite(validFrom) ||
    !Number.isFinite(validUntil) ||
    validFrom >= validUntil
  ) {
    return {
      label: "等待计划核验",
      description: "计划有效期无效，请先核对最新版本。",
      tone: "neutral",
    };
  }
  if (now >= validUntil)
    return {
      label: "已过期",
      description: "已超出计划有效期，请查看最新观察，不沿用旧点位。",
      tone: "neutral",
    };
  if (now < validFrom)
    return {
      label: "尚未生效",
      description: "请关注生效时间，当前仅供提前了解。",
      tone: "neutral",
    };
  const currentQuote = effectivePointQuote(quote, now);
  if (!currentQuote?.price || currentQuote.status !== "fresh") {
    return {
      label: "等待行情核验",
      description: "行情暂不可用或已延迟，请先核对交易所当前价格。",
      tone: "neutral",
    };
  }
  const price = currentQuote.price;
  const low = plan.entryLower ?? plan.entryPrice;
  const high = plan.entryUpper ?? plan.entryPrice;
  if (
    !positiveDecimal(low) ||
    !positiveDecimal(high) ||
    !positiveDecimal(plan.stopLoss) ||
    !positiveDecimal(plan.takeProfit) ||
    compareDecimal(low, high) > 0
  ) {
    return {
      label: "等待计划核验",
      description: "参考价格或区间无效，请先核对最新版本。",
      tone: "neutral",
    };
  }
  const short = plan.direction === "SHORT";
  if (
    short
      ? compareDecimal(price, plan.stopLoss) >= 0
      : compareDecimal(price, plan.stopLoss) <= 0
  ) {
    return {
      label: "越过失效参考",
      description:
        "本次报价已越过止损参考，请复核计划是否仍适用；不代表实际止损成交。",
      tone: "caution",
    };
  }
  if (compareDecimal(price, low) >= 0 && compareDecimal(price, high) <= 0)
    return {
      label: "处于观察参考位",
      description: "关注参考位附近的走势，结合条件判断，不代表应立即入场。",
      tone: "gold",
    };
  if (short ? compareDecimal(price, low) < 0 : compareDecimal(price, high) > 0)
    return {
      label: "等待观察机会",
      description:
        "本次报价尚未到观察参考位；请结合走势，不追价、不机械等待精确点位。",
      tone: "gold",
    };
  return {
    label: "已越过观察参考",
    description:
      "本次报价已越过参考位，请重新评估走势与失效条件，不视为成交信号。",
    tone: "caution",
  };
}
