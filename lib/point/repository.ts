import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";
import { getBinanceInstrument, getBinanceQuotes } from "./binance";
import {
  getFixedPointPreview,
  isPublishedPoint,
  selectPointList,
  sortPoints,
  type PointListOptions,
} from "./access";
import { PointError } from "./errors";
import {
  commitPointPreviewRevision,
  getPointPreviewInstruments,
  getPointPreviewQuotes,
  getPointPreviewStore,
} from "./preview-store";
import {
  assertPointTransition,
  parsePointMutation,
  type ParsedPointMutation,
} from "./validation";
import type {
  PointDetailResponse,
  PointInstrument,
  PointListResponse,
  PointPlan,
  PointPreview,
  PointRevision,
  PointViewer,
} from "./types";

function assertPreviewSafety(viewer: PointViewer) {
  if (viewer.previewMode && process.env.NODE_ENV === "production")
    throw new PointError(403, "生产环境不允许演示会话。");
}

function assertAdmin(viewer: PointViewer) {
  assertPreviewSafety(viewer);
  if (!viewer.isAdmin || !viewer.userId)
    throw new PointError(403, "仅管理员可管理点位。");
  if (!viewer.previewMode && !isDatabaseConfigured())
    throw new PointError(503, "点位数据库尚未配置。");
}

function storedPlan(snapshot: Prisma.JsonValue): PointPlan {
  // Stored values are only produced by validated, allowlisted mutations below.
  if (
    !snapshot ||
    typeof snapshot !== "object" ||
    Array.isArray(snapshot) ||
    typeof snapshot.id !== "string" ||
    !snapshot.instrument
  )
    throw new PointError(503, "点位数据暂时不可用。");
  return snapshot as unknown as PointPlan;
}

const publishedWhere: Prisma.PointPlanWhereInput = {
  status: { not: "DRAFT" },
  publishedAt: { not: null },
};
const publishedOrder: Prisma.PointPlanOrderByWithRelationInput[] = [
  { publishedAt: "desc" },
  { id: "desc" },
];

function previewPlans(viewer: PointViewer): PointPlan[] {
  return structuredClone([...getPointPreviewStore(viewer).plans.values()]);
}

/** Public reads never materialize the append-forever collection, even on the server. */
async function fixedPreview(viewer: PointViewer): Promise<PointPreview[]> {
  if (viewer.previewMode) return getFixedPointPreview(previewPlans(viewer));
  if (!isDatabaseConfigured()) return [];
  const rows = await getPrisma().pointPlan.findMany({
    where: publishedWhere,
    orderBy: publishedOrder,
    take: 3,
    select: { snapshot: true },
  });
  return getFixedPointPreview(rows.map((row) => storedPlan(row.snapshot)));
}

function listWhere(options: PointListOptions): Prisma.PointPlanWhereInput {
  const now = new Date();
  const query = (options.q ?? "").trim().slice(0, 80);
  return {
    ...publishedWhere,
    ...(options.scope !== "all"
      ? {
          status: "PUBLISHED",
          validFrom: { lte: now },
          validUntil: { gt: now },
        }
      : {}),
    ...(options.category && options.category !== "ALL"
      ? { category: options.category }
      : {}),
    ...(options.direction === "LONG" || options.direction === "SHORT"
      ? { snapshot: { path: ["direction"], equals: options.direction } }
      : {}),
    ...(query
      ? {
          OR: [
            { symbol: { contains: query, mode: "insensitive" } },
            {
              snapshot: {
                path: ["instrument", "name"],
                string_contains: query,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };
}

export async function getPointList(
  viewer: PointViewer,
  options: PointListOptions = {},
): Promise<PointListResponse> {
  assertPreviewSafety(viewer);
  try {
    if (viewer.previewMode)
      return selectPointList(previewPlans(viewer), viewer, options);
    if (!isDatabaseConfigured())
      return { ...selectPointList([], viewer, options), unavailable: true };
    if (viewer.access === "preview") {
      const items = await fixedPreview(viewer);
      return {
        access: "preview",
        items,
        total: items.length,
        page: 1,
        pageSize: 3,
        previewMode: false,
      };
    }
    const where = listWhere(options);
    const prisma = getPrisma();
    const total = await prisma.pointPlan.count({ where });
    const pageSize = 12;
    const requestedPage =
      typeof options.page === "number" && Number.isSafeInteger(options.page)
        ? options.page
        : 1;
    const page = Math.max(
      1,
      Math.min(requestedPage, Math.max(1, Math.ceil(total / pageSize))),
    );
    const rows = await prisma.pointPlan.findMany({
      where,
      orderBy: publishedOrder,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { snapshot: true },
    });
    return {
      access: "vip",
      items: rows.map((row) => storedPlan(row.snapshot)),
      total,
      page,
      pageSize,
      previewMode: false,
    };
  } catch {
    return { ...selectPointList([], viewer, options), unavailable: true };
  }
}

export async function getPointDetail(
  viewer: PointViewer,
  id: string,
): Promise<PointDetailResponse | null> {
  assertPreviewSafety(viewer);
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) return null;
  if (viewer.access === "preview") {
    const plan = (await fixedPreview(viewer)).find((item) => item.id === id);
    return plan
      ? { access: "preview", plan, previewMode: viewer.previewMode }
      : null;
  }
  if (!viewer.previewMode && !isDatabaseConfigured()) return null;
  const plans = viewer.previewMode ? previewPlans(viewer) : [];
  const row = viewer.previewMode
    ? null
    : await getPrisma().pointPlan.findUnique({
        where: { id },
        select: { snapshot: true },
      });
  const plan = viewer.previewMode
    ? plans.find((item) => item.id === id)
    : row
      ? storedPlan(row.snapshot)
      : null;
  if (!plan || (!viewer.isAdmin && !isPublishedPoint(plan))) return null;
  let revisions: PointRevision[];
  let related: PointPlan[];
  if (viewer.previewMode) {
    revisions = structuredClone(
      getPointPreviewStore(viewer).revisions.get(id) ?? [],
    );
    related = sortPoints(
      plans.filter(
        (item) =>
          item.id !== id &&
          isPublishedPoint(item) &&
          item.instrument.symbol === plan.instrument.symbol,
      ),
    ).slice(0, 4);
  } else {
    const prisma = getPrisma();
    const [rows, relatedRows] = await Promise.all([
      prisma.pointRevision.findMany({
        where: {
          planId: id,
          ...(!viewer.isAdmin
            ? { action: { in: ["PUBLISHED", "WITHDRAWN", "CLOSED"] as const } }
            : {}),
        },
        orderBy: { version: "desc" },
        select: {
          id: true,
          planId: true,
          version: true,
          action: true,
          reason: true,
          createdAt: true,
          snapshot: true,
        },
      }),
      prisma.pointPlan.findMany({
        where: {
          ...publishedWhere,
          id: { not: id },
          symbol: plan.instrument.symbol,
        },
        orderBy: publishedOrder,
        take: 4,
        select: { snapshot: true },
      }),
    ]);
    revisions = rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      snapshot: storedPlan(row.snapshot),
    }));
    related = relatedRows.map((item) => storedPlan(item.snapshot));
  }
  // A draft may contain internal notes. Publishing a plan must not retroactively expose those draft snapshots.
  if (!viewer.isAdmin)
    revisions = revisions.filter((revision) =>
      isPublishedPoint(revision.snapshot),
    );
  revisions.sort((a, b) => b.version - a.version);
  return {
    access: "vip",
    plan,
    revisions,
    related,
    previewMode: viewer.previewMode,
  };
}

export async function listPointAdmin(viewer: PointViewer): Promise<{
  items: PointPlan[];
  previewMode: boolean;
  unavailable?: boolean;
}> {
  assertAdmin(viewer);
  try {
    // Management intentionally includes every record; do not silently hide old plans.
    const items = viewer.previewMode
      ? previewPlans(viewer)
      : (
          await getPrisma().pointPlan.findMany({
            orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
            select: { snapshot: true },
          })
        ).map((row) => storedPlan(row.snapshot));
    items.sort(
      (a, b) =>
        b.updatedAt.localeCompare(a.updatedAt) || b.id.localeCompare(a.id),
    );
    return { items, previewMode: viewer.previewMode };
  } catch {
    return { items: [], previewMode: viewer.previewMode, unavailable: true };
  }
}

/** Restricts the quote proxy to products visible to this viewer, never arbitrary symbols. */
export async function getPointQuoteSymbols(
  viewer: PointViewer,
): Promise<string[]> {
  assertPreviewSafety(viewer);
  if (viewer.access === "preview")
    return [
      ...new Set((await fixedPreview(viewer)).map((plan) => plan.symbol)),
    ];
  if (viewer.previewMode)
    return [
      ...new Set(
        previewPlans(viewer)
          .filter(isPublishedPoint)
          .map((plan) => plan.instrument.symbol),
      ),
    ];
  if (!isDatabaseConfigured()) return [];
  // GROUP BY is database-side distinct; only symbol scalars cross the DB boundary.
  const rows = await getPrisma().pointPlan.groupBy({
    by: ["symbol"],
    where: publishedWhere,
  });
  return rows.map((row) => row.symbol);
}

async function resolveInstrument(
  viewer: PointViewer,
  symbol: string,
): Promise<PointInstrument> {
  let instrument: PointInstrument;
  if (viewer.previewMode) {
    const demo = getPointPreviewInstruments().find(
      (item) => item.symbol === symbol,
    );
    if (!demo) throw new PointError(400, "演示模式仅允许选择 DEMO 产品。");
    instrument = demo;
  } else {
    try {
      instrument = await getBinanceInstrument(symbol);
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error.code === "INVALID_SYMBOL" ||
          error.code === "UNSUPPORTED_INSTRUMENT")
      )
        throw new PointError(400, "请选择 Binance 当前可交易的完整产品代码。");
      throw new PointError(
        503,
        "无法核验 Binance 产品，暂不可保存或发布，请稍后重试。",
      );
    }
  }
  if (
    instrument.symbol !== symbol ||
    instrument.provider !== "BINANCE" ||
    instrument.market !== "USD_M_FUTURES" ||
    instrument.status !== "TRADING"
  )
    throw new PointError(400, "该产品不在 Binance 当前可交易产品目录中。");
  return instrument;
}

async function referencePrice(
  viewer: PointViewer,
  symbol: string,
): Promise<string | null> {
  try {
    const quote = (
      viewer.previewMode
        ? getPointPreviewQuotes([symbol])
        : await getBinanceQuotes([symbol])
    )[0];
    return quote && (viewer.previewMode || quote.status === "fresh")
      ? quote.price
      : null;
  } catch {
    return null;
  }
}

function buildPlan(
  id: string,
  mutation: ParsedPointMutation,
  instrument: PointInstrument,
  price: string | null,
  current?: PointPlan,
): PointPlan {
  const now = new Date().toISOString();
  if (!mutation.input) {
    if (!current) throw new PointError(400, "点位不存在。");
    return {
      ...current,
      version: current.version + 1,
      status: mutation.action === "withdraw" ? "WITHDRAWN" : "CLOSED",
      updatedAt: now,
    };
  }
  const { symbol: _symbol, changeReason: _reason, ...content } = mutation.input;
  if (
    mutation.action === "publish" &&
    Date.parse(content.validUntil) <= Date.now()
  )
    throw new PointError(400, "已过期的点位不能发布。");
  return {
    ...content,
    id,
    instrument,
    status: mutation.action === "publish" ? "PUBLISHED" : "DRAFT",
    version: (current?.version ?? 0) + 1,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
    publishedAt:
      current?.publishedAt ?? (mutation.action === "publish" ? now : null),
    // This price belongs to the original publishedAt, not to a later revision.
    // An unavailable first-publish quote (null) must never be backfilled with a later price.
    publishedReferencePrice: current?.publishedAt
      ? current.publishedReferencePrice
      : mutation.action === "publish"
        ? price
        : null,
  };
}

function makeRevision(
  plan: PointPlan,
  mutation: ParsedPointMutation,
  creating: boolean,
): PointRevision {
  const action =
    mutation.action === "withdraw"
      ? "WITHDRAWN"
      : mutation.action === "close"
        ? "CLOSED"
        : mutation.action === "publish"
          ? "PUBLISHED"
          : creating
            ? "CREATED"
            : "UPDATED";
  return {
    id: randomUUID(),
    planId: plan.id,
    version: plan.version,
    action,
    reason:
      mutation.reason ||
      (mutation.action === "publish" ? "首次发布" : "创建草稿"),
    createdAt: plan.updatedAt,
    snapshot: structuredClone(plan),
  };
}

function planData(plan: PointPlan) {
  return {
    symbol: plan.instrument.symbol,
    category: plan.instrument.category,
    status: plan.status,
    version: plan.version,
    snapshot: plan as unknown as Prisma.InputJsonValue,
    publishedAt: plan.publishedAt ? new Date(plan.publishedAt) : null,
    validFrom: new Date(plan.validFrom),
    validUntil: new Date(plan.validUntil),
    updatedAt: new Date(plan.updatedAt),
  };
}

function revisionData(revision: PointRevision, actorUserId: string) {
  return {
    id: revision.id,
    planId: revision.planId,
    version: revision.version,
    action: revision.action,
    reason: revision.reason,
    actorUserId,
    snapshot: revision.snapshot as unknown as Prisma.InputJsonValue,
    createdAt: new Date(revision.createdAt),
  };
}

function databaseConflict(error: unknown): never {
  if (error instanceof PointError) throw error;
  const code =
    error && typeof error === "object" && "code" in error ? error.code : null;
  if (code === "P2034" || code === "P2002")
    throw new PointError(409, "该点位已被其他人更新，请刷新后重试。");
  throw new PointError(503, "保存失败，点位数据库暂时不可用。");
}

export async function createPointPlan(
  viewer: PointViewer,
  body: unknown,
): Promise<PointPlan> {
  assertAdmin(viewer);
  const mutation = parsePointMutation(body);
  const instrument = await resolveInstrument(viewer, mutation.input!.symbol);
  const price =
    mutation.action === "publish"
      ? await referencePrice(viewer, instrument.symbol)
      : null;
  const plan = buildPlan(randomUUID(), mutation, instrument, price);
  const revision = makeRevision(plan, mutation, true);
  if (viewer.previewMode) {
    commitPointPreviewRevision(getPointPreviewStore(viewer), plan, revision);
    return plan;
  }
  try {
    await getPrisma().$transaction(async (tx) => {
      await tx.pointPlan.create({
        data: {
          id: plan.id,
          ...planData(plan),
          createdAt: new Date(plan.createdAt),
        },
      });
      await tx.pointRevision.create({
        data: revisionData(revision, viewer.userId!),
      });
    });
    return plan;
  } catch (error) {
    return databaseConflict(error);
  }
}

export async function updatePointPlan(
  viewer: PointViewer,
  id: string,
  body: unknown,
): Promise<PointPlan> {
  assertAdmin(viewer);
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id))
    throw new PointError(404, "未找到该点位。");
  const mutation = parsePointMutation(body, true);
  const current = viewer.previewMode
    ? getPointPreviewStore(viewer).plans.get(id)
    : await getPrisma()
        .pointPlan.findUnique({ where: { id }, select: { snapshot: true } })
        .then((row) => (row ? storedPlan(row.snapshot) : null));
  if (!current) throw new PointError(404, "未找到该点位。");
  assertPointTransition(current, mutation);
  let instrument = current.instrument;
  if (
    mutation.input &&
    (mutation.action === "publish" ||
      mutation.input.symbol !== current.instrument.symbol)
  ) {
    const verified = await resolveInstrument(viewer, mutation.input.symbol);
    if (
      current.publishedAt &&
      ["contractType", "baseAsset", "quoteAsset", "marginAsset"].some(
        (key) =>
          verified[key as keyof PointInstrument] !==
          current.instrument[key as keyof PointInstrument],
      )
    )
      throw new PointError(409, "产品合约信息已变更，请新建计划。");
    instrument = current.publishedAt ? current.instrument : verified;
  }
  const price =
    mutation.action === "publish"
      ? await referencePrice(viewer, instrument.symbol)
      : null;
  const plan = buildPlan(id, mutation, instrument, price, current);
  const revision = makeRevision(plan, mutation, false);
  if (viewer.previewMode) {
    commitPointPreviewRevision(
      getPointPreviewStore(viewer),
      plan,
      revision,
      mutation.expectedVersion,
    );
    return plan;
  }
  try {
    await getPrisma().$transaction(async (tx) => {
      // SQL compare-and-swap and append occur atomically. Concurrent stale writers cannot overwrite history.
      const updated = await tx.pointPlan.updateMany({
        where: { id, version: mutation.expectedVersion },
        data: planData(plan),
      });
      if (updated.count !== 1)
        throw new PointError(409, "该点位已被其他人更新，请刷新后重试。");
      await tx.pointRevision.create({
        data: revisionData(revision, viewer.userId!),
      });
    });
    return plan;
  } catch (error) {
    return databaseConflict(error);
  }
}
