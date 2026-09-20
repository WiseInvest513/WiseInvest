import type {
  PointListResponse,
  PointPlan,
  PointPreview,
  PointViewer,
} from "./types";

export interface PointListOptions {
  scope?: "active" | "all";
  category?: "ALL" | "CRYPTO" | "EQUITY" | "OTHER";
  direction?: "ALL" | "LONG" | "SHORT";
  q?: string;
  page?: number;
}

export function pointViewerFromUser(
  user: { id: string; role: string; membershipTier: string } | null,
  previewMode = false,
): PointViewer {
  const isAdmin = user?.role === "ADMIN";
  return {
    access:
      isAdmin ||
      user?.membershipTier === "VIP" ||
      user?.membershipTier === "VIP_PLUS"
        ? "vip"
        : "preview",
    isAdmin,
    userId: user?.id ?? null,
    previewMode,
  };
}

/** Public output is a positive allowlist, not a full object with selected keys removed. */
export function toPointPreview(plan: PointPlan): PointPreview {
  return {
    id: plan.id,
    symbol: plan.instrument.symbol,
    name: plan.instrument.name,
    category: plan.instrument.category,
    publicSummary: Array.from(plan.publicSummary).slice(0, 80).join(""),
    publishedAt: plan.publishedAt,
    updatedAt: plan.updatedAt,
    validUntil: plan.validUntil,
  };
}

export function isPublishedPoint(plan: PointPlan) {
  return plan.status !== "DRAFT" && plan.publishedAt !== null;
}

export function isActivePoint(plan: PointPlan, now = Date.now()) {
  return (
    plan.status === "PUBLISHED" &&
    isPublishedPoint(plan) &&
    Date.parse(plan.validFrom) <= now &&
    Date.parse(plan.validUntil) > now
  );
}

export function sortPoints(plans: PointPlan[]): PointPlan[] {
  return [...plans].sort(
    (a, b) =>
      (b.publishedAt ?? b.createdAt).localeCompare(
        a.publishedAt ?? a.createdAt,
      ) || b.id.localeCompare(a.id),
  );
}

/** Choose the window before any user-controlled filter, so pagination/search cannot enumerate history. */
export function getFixedPointPreview(plans: PointPlan[]): PointPreview[] {
  return sortPoints(plans.filter(isPublishedPoint))
    .slice(0, 3)
    .map(toPointPreview);
}

export function selectPointList(
  plans: PointPlan[],
  viewer: PointViewer,
  options: PointListOptions = {},
  now = Date.now(),
): PointListResponse {
  if (viewer.access === "preview") {
    const items = getFixedPointPreview(plans);
    return {
      access: "preview",
      items,
      total: items.length,
      page: 1,
      pageSize: 3,
      previewMode: viewer.previewMode,
    };
  }
  const query = (options.q ?? "").trim().slice(0, 80).toUpperCase();
  const items = sortPoints(
    plans.filter((plan) => {
      if (!isPublishedPoint(plan)) return false;
      if (options.scope !== "all" && !isActivePoint(plan, now)) return false;
      if (
        options.category &&
        options.category !== "ALL" &&
        plan.instrument.category !== options.category
      )
        return false;
      if (
        (options.direction === "LONG" || options.direction === "SHORT") &&
        plan.direction !== options.direction
      )
        return false;
      return (
        !query ||
        `${plan.instrument.symbol} ${plan.instrument.name}`
          .toUpperCase()
          .includes(query)
      );
    }),
  );
  const pageSize = 12;
  const requestedPage =
    typeof options.page === "number" && Number.isSafeInteger(options.page)
      ? options.page
      : 1;
  const page = Math.max(
    1,
    Math.min(requestedPage, Math.max(1, Math.ceil(items.length / pageSize))),
  );
  return {
    access: "vip",
    items: items.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
    page,
    pageSize,
    previewMode: viewer.previewMode,
  };
}
