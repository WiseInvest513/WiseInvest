import { NextResponse } from "next/server";
import { loadFsArticles } from "@/lib/articles-fs";

export async function GET() {
  const articles = loadFsArticles();
  return NextResponse.json(articles);
}
