import { NextResponse, type NextRequest } from "next/server";
import { requirePointAdmin } from "@/lib/point/auth";
import { createPointPlan, listPointAdmin } from "@/lib/point/repository";
import { pointErrorResponse } from "@/lib/point/errors";
import { assertPointSameOrigin, readPointMutationBody } from "@/lib/point/validation";
import { checkAdminMutationLimit } from "@/lib/vip/api-guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function GET() {
  try { return NextResponse.json(await listPointAdmin(await requirePointAdmin()), { headers }); }
  catch (error) { const { status, message } = pointErrorResponse(error); return NextResponse.json({ message }, { status, headers }); }
}

export async function POST(request: NextRequest) {
  try {
    assertPointSameOrigin(request);
    const viewer = await requirePointAdmin();
    const limited = await checkAdminMutationLimit(request, viewer.userId!);
    if (limited) return limited;
    const plan = await createPointPlan(viewer, await readPointMutationBody(request));
    return NextResponse.json({ plan, previewMode: viewer.previewMode }, { status: 201, headers });
  } catch (error) { const { status, message } = pointErrorResponse(error); return NextResponse.json({ message }, { status, headers }); }
}
