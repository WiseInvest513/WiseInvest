import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: `资料库 - ${siteConfig.name}`,
  description: "精选投资相关资料、文章、工具和外部资源，沉淀可反复查阅的内容库。",
  openGraph: {
    title: `资料库 - ${siteConfig.name}`,
    description: "精选投资相关资料、文章、工具和外部资源",
    url: siteConfig.url("/resources"),
  },
  alternates: {
    canonical: siteConfig.url("/resources"),
  },
};

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
