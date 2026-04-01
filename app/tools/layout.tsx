import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: `投资工具箱 - ${siteConfig.name}`,
  description: "专业投资计算工具集合：复利计算器、财富时光机、仓位管理、合约计算、贪婪恐慌指数等，助你做出更理性的投资决策。",
  openGraph: {
    title: `投资工具箱 - ${siteConfig.name}`,
    description: "专业投资计算工具集合：复利计算、财富时光机、仓位管理、贪婪恐慌指数等",
    url: siteConfig.url("/tools"),
  },
  alternates: {
    canonical: siteConfig.url("/tools"),
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
