import { NextRequest, NextResponse } from "next/server";
import { getPointViewer } from "@/lib/point/auth";
import { getBinanceQuotes, isPointBinanceSymbol } from "@/lib/point/binance";
import { getPointQuoteSymbols } from "@/lib/point/repository";
import { getPointPreviewQuotes } from "@/lib/point/preview-store";
import { pointErrorResponse } from "@/lib/point/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie, Authorization" };

export async function GET(request: NextRequest) {
  try {
    const viewer = await getPointViewer();
    if (viewer.access !== "vip") return NextResponse.json({ message: "实时参考行情仅向 Wise VIP 开放。" }, { status: 403, headers });
    const values = request.nextUrl.searchParams.getAll("symbols");
    const symbols = values[0] ? values[0].split(",") : [];
    if (values.length > 1 || symbols.length > 50 || symbols.some(symbol => !isPointBinanceSymbol(symbol))) {
      return NextResponse.json({ message: "最多查询 50 个完整且精确的 Binance 合约代码。" }, { status: 400, headers });
    }
    const allowed = new Set(await getPointQuoteSymbols(viewer));
    if (symbols.some(symbol => !allowed.has(symbol))) {
      return NextResponse.json({ message: "仅支持查询已发布点位中的标的。" }, { status: 403, headers });
    }
    const unique = [...new Set(symbols)];
    const quotes = viewer.previewMode && process.env.NODE_ENV !== "production"
      ? getPointPreviewQuotes(unique) : await getBinanceQuotes(unique);
    return NextResponse.json({ quotes, previewMode: viewer.previewMode }, { headers });
  } catch (error) {
    const failure = pointErrorResponse(error);
    return NextResponse.json({ message: failure.message }, { status: failure.status, headers });
  }
}
