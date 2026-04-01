import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: `关于我 - ${siteConfig.name}`,
  description: "做最懂小白的投资博主。分享美股、Web3、ETF指数基金投资经验，帮助普通人建立正确的财富积累方式。",
  openGraph: {
    title: `关于我 - ${siteConfig.name}`,
    description: "做最懂小白的投资博主，分享美股、Web3、ETF定投经验",
    url: siteConfig.url("/aboutme"),
  },
  alternates: {
    canonical: siteConfig.url("/aboutme"),
  },
};

export default function AboutMeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
