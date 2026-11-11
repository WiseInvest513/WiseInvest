import { NextResponse } from "next/server";
import { loadFsArticles } from "@/lib/articles-fs";

export const dynamic = "force-dynamic";

export async function GET() {
  // Published articles are public for every reader; no identity or policy DB lookup.
  return NextResponse.json(loadFsArticles(), {
    headers: { "Cache-Control": "no-store" },
  });
}
