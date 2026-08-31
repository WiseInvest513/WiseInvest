import { NextResponse } from "next/server";
import { getPublicJwk } from "@/lib/sso/crypto";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    keys: [getPublicJwk()],
  });
}
