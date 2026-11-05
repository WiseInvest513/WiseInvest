import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import { isDevPreviewEnabled } from "@/lib/identity/dev-preview";
import ReviewClient from "./review-client";
import type { ReviewData } from "./types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "文章邀请码与福利评审 | Wise Invest",
  robots: { index: false, follow: false },
};

export default async function ArticleReviewPage() {
  if (!isDevPreviewEnabled()) notFound();
  const data: ReviewData = JSON.parse(await readFile(path.join(process.cwd(), "docs/reviews/article-referral-review.json"), "utf8"));
  return <ReviewClient data={data} />;
}
