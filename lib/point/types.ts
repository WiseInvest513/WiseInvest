export type PointCategory = "CRYPTO" | "EQUITY" | "OTHER";
export type PointDirection = "LONG" | "SHORT";
export type PointLifecycle = "DRAFT" | "PUBLISHED" | "WITHDRAWN" | "CLOSED";

/** The exact Binance instrument is selected and confirmed, never guessed from a ticker. */
export interface PointInstrument {
  provider: "BINANCE";
  market: "USD_M_FUTURES";
  symbol: string;
  name: string;
  category: PointCategory;
  contractType: string;
  baseAsset: string;
  quoteAsset: string;
  marginAsset: string;
  tickSize: string;
  status: string;
  sourceUrl: string | null;
  verifiedAt: string;
}

export interface PointQuote {
  symbol: string;
  price: string | null;
  sourceTime: string | null;
  fetchedAt: string | null;
  status: "fresh" | "stale" | "unavailable";
  source: "BINANCE_USD_M_LAST_PRICE";
  message?: string;
}

export interface PointPlanInput {
  symbol: string;
  direction: PointDirection;
  entryPrice: string;
  entryLower: string | null;
  entryUpper: string | null;
  stopLoss: string;
  takeProfit: string;
  rationale: string;
  entryCondition: string;
  invalidationCondition: string;
  publicSummary: string;
  validFrom: string;
  validUntil: string;
  changeReason: string;
}

export interface PointPlan extends Omit<
  PointPlanInput,
  "symbol" | "changeReason"
> {
  id: string;
  instrument: PointInstrument;
  status: PointLifecycle;
  version: number;
  createdAt: string;
  publishedAt: string | null;
  updatedAt: string;
  publishedReferencePrice: string | null;
}

export interface PointRevision {
  id: string;
  planId: string;
  version: number;
  action: "CREATED" | "UPDATED" | "PUBLISHED" | "WITHDRAWN" | "CLOSED";
  reason: string;
  createdAt: string;
  snapshot: PointPlan;
}

/** Deliberate allowlist: never spread a full plan into a public response. */
export interface PointPreview {
  id: string;
  symbol: string;
  name: string;
  category: PointCategory;
  publicSummary: string;
  publishedAt: string | null;
  updatedAt: string;
  validUntil: string;
}

export interface PointViewer {
  access: "vip" | "preview";
  isAdmin: boolean;
  userId: string | null;
  previewMode: boolean;
}

export type PointListResponse =
  | {
      access: "vip";
      items: PointPlan[];
      total: number;
      page: number;
      pageSize: number;
      previewMode: boolean;
      unavailable?: boolean;
    }
  | {
      access: "preview";
      items: PointPreview[];
      total: number;
      page: 1;
      pageSize: 3;
      previewMode: boolean;
      unavailable?: boolean;
    };

export type PointDetailResponse =
  | {
      access: "vip";
      plan: PointPlan;
      revisions: PointRevision[];
      related: PointPlan[];
      previewMode: boolean;
    }
  | {
      access: "preview";
      plan: PointPreview;
      previewMode: boolean;
    };

export interface PointInstrumentSearch {
  items: PointInstrument[];
  fetchedAt: string | null;
  unavailable: boolean;
  message?: string;
}
