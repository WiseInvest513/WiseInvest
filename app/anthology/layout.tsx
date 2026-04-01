import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: `文集 - ${siteConfig.name}`,
  description: "汇集段永平、查理芒格、巴菲特、李录等投资大师的经典文章、演讲与语录，深度阅读，建立正确的投资世界观。",
  openGraph: {
    title: `文集 - ${siteConfig.name}`,
    description: "段永平、查理芒格、巴菲特等投资大师经典文章与演讲合集",
    url: siteConfig.url("/anthology"),
  },
  alternates: {
    canonical: siteConfig.url("/anthology"),
  },
};

export default function AnthologyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
