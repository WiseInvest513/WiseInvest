import { NextResponse } from "next/server";
import { WISE_DEV_PREVIEW_COOKIE, isDevPreviewEnabled } from "@/lib/identity/dev-preview";

export async function POST() {
  if (!isDevPreviewEnabled()) {
    return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(WISE_DEV_PREVIEW_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
