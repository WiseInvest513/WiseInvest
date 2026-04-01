import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: `学习路线图 - ${siteConfig.name}`,
  description: "从零开始的投资学习路径：美股入门、Web3探索、指数基金、定投策略、海外收入……每条路线都有清晰的步骤和资源。",
  openGraph: {
    title: `学习路线图 - ${siteConfig.name}`,
    description: "投资学习路径：美股、Web3、指数基金、定投策略、海外收入等完整路线图",
    url: siteConfig.url("/roadmap"),
  },
  alternates: {
    canonical: siteConfig.url("/roadmap"),
  },
};

export default function RoadmapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
