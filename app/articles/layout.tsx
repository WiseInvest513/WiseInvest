import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: `精选文章 - ${siteConfig.name}`,
  description: "精选投资干货文章，涵盖 Web3、美股、定投、ETF基金指数等主题，每篇都是浓缩的投资智慧。",
  openGraph: {
    title: `精选文章 - ${siteConfig.name}`,
    description: "精选投资干货文章，涵盖 Web3、美股、定投、ETF基金指数等主题",
    url: siteConfig.url("/articles"),
  },
  alternates: {
    canonical: siteConfig.url("/articles"),
    types: {
      "application/rss+xml": siteConfig.url("/feed.xml"),
    },
  },
};

export default function ArticlesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
