"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { suppressAutomaticRecommendation } from "@/lib/recommendation-visibility";

const DailyRecommendation = dynamic(() => import("./DailyRecommendation").then((module) => module.DailyRecommendation), { ssr: false });

export function AutomaticRecommendation() {
  const pathname = usePathname();
  if (suppressAutomaticRecommendation(pathname)) return null;
  return <DailyRecommendation />;
}
