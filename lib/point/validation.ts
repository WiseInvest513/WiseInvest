import { PointError } from "./errors";
import type { PointPlan, PointPlanInput } from "./types";

export type PointMutationAction = "draft" | "publish" | "withdraw" | "close";
export type ParsedPointMutation = {
  action: PointMutationAction;
  expectedVersion?: number;
  confirmedSymbol: string;
  reason: string;
  input: PointPlanInput | null;
};

function text(
  value: unknown,
  label: string,
  maximum: number,
  required: boolean,
): string {
  if (value == null && !required) return "";
  if (typeof value !== "string")
    throw new PointError(400, `${label}格式无效。`);
  const result = value.trim();
  if (required && !result) throw new PointError(400, `请填写${label}。`);
  if (Array.from(result).length > maximum)
    throw new PointError(400, `${label}最多 ${maximum} 个字符。`);
  return result;
}

export function pointDecimal(
  value: unknown,
  label: string,
  required = true,
): string {
  const parsed = text(value, label, 24, required);
  if (!parsed && !required) return "";
  // Plain, positive, bounded decimals only: never exponent notation, Infinity, NaN, or floating-point rounding.
  if (
    !/^(?:0|[1-9]\d{0,11})(?:\.\d{1,8})?$/.test(parsed) ||
    decimalUnits(parsed) <= BigInt(0)
  ) {
    throw new PointError(
      400,
      `${label}必须是正数，最多 12 位整数和 8 位小数。`,
    );
  }
  return parsed;
}

function decimalUnits(value: string): bigint {
  const [integer, fraction = ""] = value.split(".");
  return BigInt(integer) * BigInt(100000000) + BigInt(fraction.padEnd(8, "0"));
}

function date(value: unknown, label: string): string {
  const parsed = text(value, label, 40, true);
  // A timezone is mandatory; an admin's timezone must not silently become the server's timezone.
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      parsed,
    ) ||
    !Number.isFinite(Date.parse(parsed))
  ) {
    throw new PointError(400, `${label}必须是含时区的有效时间。`);
  }
  const [year, month, day, hour, minute] = parsed
    .match(/\d+/g)!
    .slice(0, 5)
    .map(Number);
  const calendar = new Date(`${parsed.slice(0, 10)}T00:00:00Z`);
  if (
    calendar.getUTCFullYear() !== year ||
    calendar.getUTCMonth() + 1 !== month ||
    calendar.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59
  )
    throw new PointError(400, `${label}必须是有效的日历时间。`);
  return new Date(parsed).toISOString();
}

export function parsePointMutation(
  body: unknown,
  updating = false,
  now = Date.now(),
): ParsedPointMutation {
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new PointError(400, "请求内容无效。");
  const value = body as Record<string, unknown>;
  const action = value.action;
  if (
    action !== "draft" &&
    action !== "publish" &&
    action !== "withdraw" &&
    action !== "close"
  )
    throw new PointError(400, "操作类型无效。");
  if (!updating && (action === "withdraw" || action === "close"))
    throw new PointError(400, "新点位只能保存草稿或发布。");
  if (
    updating &&
    (!Number.isSafeInteger(value.expectedVersion) ||
      (value.expectedVersion as number) < 1)
  )
    throw new PointError(400, "更新必须携带有效的 expectedVersion。");
  const defaultReason = {
    draft: "保存草稿",
    publish: updating ? "发布更新" : "创建计划",
    withdraw: "撤回计划",
    close: "结束计划",
  }[action];
  const reason =
    text(value.changeReason, "变更原因", 500, false) || defaultReason;
  const confirmedSymbol = text(
    value.confirmedSymbol,
    "确认交易对",
    40,
    action === "publish" || !updating,
  );
  const base: Omit<ParsedPointMutation, "input"> = {
    action,
    expectedVersion: updating ? (value.expectedVersion as number) : undefined,
    confirmedSymbol,
    reason,
  };
  if (action === "withdraw" || action === "close")
    return { ...base, input: null };
  const complete = action === "publish";
  const symbol = text(value.symbol, "交易对", 40, true);
  if (!/^[A-Z0-9_]{2,40}$/.test(symbol))
    throw new PointError(400, "请选择准确的 Binance 交易对。");
  if ((complete || !updating) && confirmedSymbol !== symbol)
    throw new PointError(400, "确认交易对与所选产品不一致。");
  if (value.direction !== "LONG" && value.direction !== "SHORT")
    throw new PointError(400, "请选择做多或做空。");
  const entryPrice = pointDecimal(value.entryPrice, "入场价", complete);
  const entryLower =
    value.entryLower == null || value.entryLower === ""
      ? null
      : pointDecimal(value.entryLower, "入场区间下限");
  const entryUpper =
    value.entryUpper == null || value.entryUpper === ""
      ? null
      : pointDecimal(value.entryUpper, "入场区间上限");
  if ((entryLower === null) !== (entryUpper === null))
    throw new PointError(400, "入场区间上下限必须同时填写。");
  if (
    entryLower &&
    entryUpper &&
    decimalUnits(entryLower) > decimalUnits(entryUpper)
  )
    throw new PointError(400, "入场区间下限不能高于上限。");
  if (
    entryPrice &&
    entryLower &&
    entryUpper &&
    (decimalUnits(entryPrice) < decimalUnits(entryLower) ||
      decimalUnits(entryPrice) > decimalUnits(entryUpper))
  )
    throw new PointError(400, "入场价必须在入场区间内。");
  const stopLoss = pointDecimal(value.stopLoss, "止损价", complete);
  const takeProfit = pointDecimal(value.takeProfit, "止盈价", complete);
  if (entryPrice && stopLoss && takeProfit) {
    const lower = decimalUnits(entryLower ?? entryPrice);
    const upper = decimalUnits(entryUpper ?? entryPrice);
    const sl = decimalUnits(stopLoss);
    const tp = decimalUnits(takeProfit);
    if (
      value.direction === "LONG"
        ? sl >= lower || tp <= upper
        : sl <= upper || tp >= lower
    )
      throw new PointError(
        400,
        value.direction === "LONG"
          ? "做多要求：止损低于入场区间，止盈高于入场区间。"
          : "做空要求：止损高于入场区间，止盈低于入场区间。",
      );
  }
  const validFrom = date(value.validFrom, "生效时间");
  const validUntil = date(value.validUntil, "失效时间");
  if (Date.parse(validFrom) >= Date.parse(validUntil))
    throw new PointError(400, "失效时间必须晚于生效时间。");
  if (complete && Date.parse(validUntil) <= now)
    throw new PointError(400, "已过期的点位不能发布。");
  return {
    ...base,
    input: {
      symbol,
      direction: value.direction,
      entryPrice,
      entryLower,
      entryUpper,
      stopLoss,
      takeProfit,
      rationale: text(value.rationale, "备注", 3000, complete),
      entryCondition: text(value.entryCondition, "入场条件", 1000, false),
      invalidationCondition: text(
        value.invalidationCondition,
        "失效条件",
        1000,
        false,
      ),
      // The simplified editor supplies only a private note. Never derive a
      // public preview from that note, the direction, or any price level.
      publicSummary:
        text(value.publicSummary, "公开摘要", 80, false) ||
        "点位计划详情仅向 VIP 会员开放。",
      validFrom,
      validUntil,
      changeReason: reason,
    },
  };
}

export function assertPointTransition(
  current: PointPlan,
  mutation: ParsedPointMutation,
) {
  if (current.version !== mutation.expectedVersion)
    throw new PointError(409, "该点位已被其他人更新，请刷新后重试。");
  if (current.status === "WITHDRAWN" || current.status === "CLOSED")
    throw new PointError(409, "已撤回或结束的点位为只读历史，请新建计划。");
  if (mutation.action === "draft" && current.status !== "DRAFT")
    throw new PointError(409, "已发布点位不能变回草稿，请发布修订或撤回。");
  if (
    (mutation.action === "withdraw" || mutation.action === "close") &&
    current.status !== "PUBLISHED"
  )
    throw new PointError(409, "只有已发布点位才能撤回或结束。");
  if (
    current.publishedAt &&
    mutation.input &&
    mutation.input.symbol !== current.instrument.symbol
  )
    throw new PointError(409, "已发布点位的交易产品不可更换，请新建计划。");
  if (
    mutation.input &&
    mutation.input.symbol !== current.instrument.symbol &&
    mutation.confirmedSymbol !== mutation.input.symbol
  )
    throw new PointError(400, "更换交易产品后，请重新确认完整交易对。");
}

/** Cookie-authorized mutations must originate from this exact site. */
export function assertPointSameOrigin(
  request: Pick<Request, "url" | "headers">,
) {
  const origin = request.headers.get("origin");
  try {
    if (
      !origin ||
      origin !== new URL(request.url).origin ||
      request.headers.get("sec-fetch-site") === "cross-site"
    )
      throw new Error("origin");
  } catch {
    throw new PointError(403, "仅允许本站发起管理操作。");
  }
  if (
    !/^application\/json(?:\s*;|$)/i.test(
      request.headers.get("content-type") ?? "",
    )
  )
    throw new PointError(415, "请使用 JSON 请求。");
}

export async function readPointMutationBody(
  request: Request,
): Promise<unknown> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 24000) throw new PointError(413, "请求内容过长。");
  const reader = request.body?.getReader();
  if (!reader) throw new PointError(400, "请求内容为空。");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      size += result.value.byteLength;
      if (size > 24000) {
        await reader.cancel();
        throw new PointError(413, "请求内容过长。");
      }
      chunks.push(result.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new PointError(400, "JSON 格式无效。");
  }
}
