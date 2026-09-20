import { NextResponse } from "next/server";
import { getPointViewer } from "@/lib/point/auth";
import { getPointDetail } from "@/lib/point/repository";
import { PointError, pointErrorResponse } from "@/lib/point/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const response = await getPointDetail(await getPointViewer(), id);
    if (!response) throw new PointError(404, "未找到该点位，或当前账户无权查看。");
    return NextResponse.json(response, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const { status, message } = pointErrorResponse(error);
    return NextResponse.json({ message }, { status, headers: { "Cache-Control": "private, no-store" } });
  }
}
