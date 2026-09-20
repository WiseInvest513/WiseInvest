import { NextRequest, NextResponse } from "next/server";
import { getPointViewer } from "@/lib/point/auth";
import { searchBinanceInstruments } from "@/lib/point/binance";
import { getPointPreviewInstruments } from "@/lib/point/preview-store";
import { pointErrorResponse } from "@/lib/point/errors";
import type { PointCategory, PointInstrumentSearch } from "@/lib/point/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie, Authorization" };

export async function GET(request: NextRequest) {
  try {
    const viewer = await getPointViewer();
    if (!viewer.isAdmin || !viewer.userId) return NextResponse.json({ message: "仅管理员可查询点位标的。" }, { status: 403, headers });
    const query = request.nextUrl.searchParams.get("q") ?? "";
    const categoryInput = request.nextUrl.searchParams.get("category");
    if (query.length > 100 || (categoryInput && !["CRYPTO", "EQUITY", "OTHER"].includes(categoryInput))) {
      return NextResponse.json({ message: "标的搜索条件无效。" }, { status: 400, headers });
    }
    const category = categoryInput ? categoryInput as PointCategory : undefined;
    if (viewer.previewMode && process.env.NODE_ENV !== "production") {
      const needle = query.trim().toLocaleLowerCase();
      const result: PointInstrumentSearch = {
        items: getPointPreviewInstruments().filter(item => (!category || item.category === category) &&
          `${item.symbol} ${item.name} ${item.baseAsset}`.toLocaleLowerCase().includes(needle)),
        fetchedAt: new Date().toISOString(), unavailable: false,
        message: "DEMO 演示标的，未连接真实 Binance 目录；仅用于本地功能预览。",
      };
      return NextResponse.json(result, { headers });
    }
    const result = await searchBinanceInstruments(query, category);
    return NextResponse.json(result, { status: result.unavailable ? 503 : 200, headers });
  } catch (error) {
    const failure = pointErrorResponse(error);
    return NextResponse.json({ message: failure.message }, { status: failure.status, headers });
  }
}
