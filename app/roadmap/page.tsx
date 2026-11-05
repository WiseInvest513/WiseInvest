import { Suspense } from "react";
import CapitalFlowMap from "@/components/CapitalFlowMap";
import { getAllArticles } from "@/lib/articles";

export default function RoadmapPage() {
  const articles = getAllArticles().map(({ id, categoryId }) => ({ id, categoryId }));
  return <Suspense fallback={<div className="min-h-[calc(100vh-64px)]" />}><CapitalFlowMap articles={articles} /></Suspense>;
}
