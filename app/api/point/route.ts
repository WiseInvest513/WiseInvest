import { NextResponse, type NextRequest } from "next/server";
import { getPointViewer } from "@/lib/point/auth";
import { getPointList } from "@/lib/point/repository";
import { pointErrorResponse } from "@/lib/point/errors";
import type { PointListOptions } from "@/lib/point/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams;
    const category = query.get("category");
    const direction = query.get("direction");
    const options: PointListOptions = {
      scope: query.get("scope") === "all" ? "all" : "active",
      category:
        category === "CRYPTO" || category === "EQUITY" || category === "OTHER"
          ? category
          : "ALL",
      direction:
        direction === "LONG" || direction === "SHORT" ? direction : "ALL",
      q: query.get("q") ?? "",
      page: Number(query.get("page") ?? "1"),
    };
    const response = await getPointList(await getPointViewer(), options);
    return NextResponse.json(response, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const { status, message } = pointErrorResponse(error);
    return NextResponse.json(
      { message },
      { status, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
