import { NextResponse, type NextRequest } from "next/server";
import { applyFirstTouchAcquisitionCookie } from "@/lib/auth/acquisition-source";
import { WISE_DEV_PREVIEW_COOKIE, isDevPreviewCookieValue } from "@/lib/identity/dev-preview";
import { requiresLoginForContent } from "@/lib/content-access";

const authCookieNames = ["authjs.session-token", "__Secure-authjs.session-token"];

function hasAuthSessionCookie(request: NextRequest) {
  return authCookieNames.some((name) => Boolean(request.cookies.get(name)?.value));
}

function getAuthResponse(request: NextRequest) {
  const protectedByAuth = request.nextUrl.pathname.startsWith("/account")
    || request.nextUrl.pathname.startsWith("/admin")
    || requiresLoginForContent(`${request.nextUrl.pathname}${request.nextUrl.search}`);

  if (!protectedByAuth) return NextResponse.next();
  if (hasAuthSessionCookie(request)) return NextResponse.next();
  if (isDevPreviewCookieValue(request.cookies.get(WISE_DEV_PREVIEW_COOKIE)?.value)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export function middleware(request: NextRequest) {
  const response = getAuthResponse(request);
  applyFirstTouchAcquisitionCookie(request, response);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|woff2?)$).*)",
  ],
};
