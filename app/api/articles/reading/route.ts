import { NextRequest, NextResponse } from "next/server";
import { getAllArticles } from "@/lib/articles";
import { getContentViewerTier } from "@/lib/identity/content-viewer";
import { readBrowserReadings, readingMeterSecret } from "@/lib/article-reading-meter-server";
import { encodeReadingCookie, readingKey } from "@/lib/article-reading-meter-cookie";
import { READING_COOKIE, READING_LIMIT, READING_WINDOW_MS, recordReading, type ReadingEntry } from "@/lib/article-reading-meter";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const status = (entries: ReadingEntry[], authenticated: boolean) => ({ count: entries.length, locked: !authenticated && entries.length >= READING_LIMIT, authenticated });
export async function GET() {
  const [entries, tier] = await Promise.all([readBrowserReadings(), getContentViewerTier()]);
  return NextResponse.json(status(entries, Boolean(tier)), { headers });
}
export async function POST(request: NextRequest) {
  // Next's dev/proxy URL may use localhost internally; compare the actual Host.
  let sameOrigin = false;
  try {
    const origin = new URL(request.headers.get("origin") ?? "");
    sameOrigin = /^https?:$/.test(origin.protocol) && origin.host === (request.headers.get("host") ?? request.nextUrl.host);
  } catch { /* Missing or opaque origins must not mutate the browser's trial. */ }
  if (!sameOrigin) return NextResponse.json({ error: "Invalid origin" }, { status: 403, headers });
  let id: unknown;
  try { ({ articleId: id } = await request.json()); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400, headers }); }
  if (typeof id !== "string" || !getAllArticles().some(article => article.id === id)) return NextResponse.json({ error: "Article not found" }, { status: 404, headers });
  const [entries, tier] = await Promise.all([readBrowserReadings(), getContentViewerTier()]);
  if (tier) return NextResponse.json(status(entries, true), { headers });
  const updated = recordReading(entries, readingKey(id), Date.now());
  const response = NextResponse.json(status(updated, false), { headers });
  response.cookies.set(READING_COOKIE, encodeReadingCookie(updated, readingMeterSecret()), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: READING_WINDOW_MS / 1000,
  });
  return response;
}
