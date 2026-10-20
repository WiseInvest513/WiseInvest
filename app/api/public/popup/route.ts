import { NextResponse } from "next/server";
import { readPopupCampaign } from "@/lib/popup-campaign-store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Public marketing content only; no cookies, identity data or credentials.
const headers = { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" };
export async function GET() {
  try {
    const { config, revision } = await readPopupCampaign();
    return NextResponse.json({ ...config, revision }, { headers });
  } catch {
    // Fail closed: never bring back a disabled campaign from a local default.
    return NextResponse.json({ enabled: false }, { status: 503, headers });
  }
}
