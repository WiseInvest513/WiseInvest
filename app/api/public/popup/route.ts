import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
// Disable the retired campaign for cached versions of the previous client as well.
export async function GET() {
  return NextResponse.json({ enabled: false }, { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" } });
}
