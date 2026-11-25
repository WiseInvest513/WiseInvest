import { NextResponse } from "next/server";
import { getAllArticles, toArticleListItem } from "@/lib/articles";

export const dynamic = "force-dynamic";

export async function GET() {
  // Search/list consumers need metadata, never a downloadable copy of every body.
  return NextResponse.json(getAllArticles().map(toArticleListItem), {
    headers: { "Cache-Control": "no-store" },
  });
}
