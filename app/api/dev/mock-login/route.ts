import { NextResponse } from "next/server";
import { WISE_DEV_PREVIEW_COOKIE, isDevPreviewEnabled } from "@/lib/identity/dev-preview";

export async function POST(request: Request) {
  if (!isDevPreviewEnabled()) {
    return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as { tier?: string };
  const tier = body.tier === "MEMBER" || body.tier === "VIP_PLUS" ? body.tier : "VIP";
  const response = NextResponse.json({ ok: true });
  response.cookies.set(WISE_DEV_PREVIEW_COOKIE, `user:${tier}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
