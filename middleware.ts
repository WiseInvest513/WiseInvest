import { NextResponse, type NextRequest } from "next/server";
import { WISE_DEV_PREVIEW_COOKIE, isDevPreviewCookieValue } from "@/lib/identity/dev-preview";

const authCookieNames = ["authjs.session-token", "__Secure-authjs.session-token"];

function hasAuthSessionCookie(request: NextRequest) {
  return authCookieNames.some((name) => Boolean(request.cookies.get(name)?.value));
}

export function middleware(request: NextRequest) {
  if (hasAuthSessionCookie(request)) return NextResponse.next();
  if (isDevPreviewCookieValue(request.cookies.get(WISE_DEV_PREVIEW_COOKIE)?.value)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
