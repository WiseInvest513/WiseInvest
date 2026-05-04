import { NextResponse } from "next/server";
import { loadFsArticles } from "@/lib/articles-fs";

export const dynamic = "force-dynamic";

export async function GET() {
  const articles = loadFsArticles();
  return NextResponse.json(articles, {
    headers: { "Cache-Control": "no-store" },
  });
}
