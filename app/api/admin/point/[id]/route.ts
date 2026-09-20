import { NextResponse, type NextRequest } from "next/server";
import { requirePointAdmin } from "@/lib/point/auth";
import { updatePointPlan } from "@/lib/point/repository";
import { pointErrorResponse } from "@/lib/point/errors";
import { assertPointSameOrigin, readPointMutationBody } from "@/lib/point/validation";
import { checkAdminMutationLimit } from "@/lib/vip/api-guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertPointSameOrigin(request);
    const viewer = await requirePointAdmin();
    const limited = await checkAdminMutationLimit(request, viewer.userId!);
    if (limited) return limited;
    const { id } = await context.params;
    const plan = await updatePointPlan(viewer, id, await readPointMutationBody(request));
    return NextResponse.json({ plan, previewMode: viewer.previewMode }, { headers });
  } catch (error) { const { status, message } = pointErrorResponse(error); return NextResponse.json({ message }, { status, headers }); }
}
