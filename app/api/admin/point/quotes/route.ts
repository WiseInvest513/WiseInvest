import { NextRequest, NextResponse } from "next/server";
import { getPointViewer } from "@/lib/point/auth";
import { getBinanceQuotes, isPointBinanceSymbol } from "@/lib/point/binance";
import { pointErrorResponse } from "@/lib/point/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie, Authorization",
};

export async function GET(request: NextRequest) {
  try {
    const viewer = await getPointViewer();
    if (!viewer.isAdmin || !viewer.userId)
      return NextResponse.json(
        { message: "仅管理员可查询编辑中的参考行情。" },
        { status: 403, headers },
      );
    const values = request.nextUrl.searchParams.getAll("symbols");
    const symbols = values[0] ? values[0].split(",") : [];
    if (
      values.length > 1 ||
      symbols.length > 50 ||
      symbols.some((symbol) => !isPointBinanceSymbol(symbol))
    )
      return NextResponse.json(
        { message: "最多查询 50 个完整且精确的 Binance 合约代码。" },
        { status: 400, headers },
      );

    // Draft/new instruments need quotes before publication. Only official public
    // market data is read here, including while plans use the isolated dev store.
    const quotes = await getBinanceQuotes([...new Set(symbols)]);
    return NextResponse.json({ quotes }, { headers });
  } catch (error) {
    const failure = pointErrorResponse(error);
    return NextResponse.json(
      { message: failure.message },
      { status: failure.status, headers },
    );
  }
}
