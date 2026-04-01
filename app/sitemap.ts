import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";
import { tools } from "@/lib/data";
import { getToolRoute } from "@/lib/tool-routes";
import { knowledgeBaseMetadata } from "@/lib/anthology/metadata";
import { roadmaps } from "@/lib/roadmaps-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.baseUrl;

  // 静态页面
  const staticPages = [
    { url: baseUrl, priority: 1.0, changeFrequency: "daily" as const },
    { url: `${baseUrl}/tools`, priority: 0.9, changeFrequency: "weekly" as const },
    { url: `${baseUrl}/tweets`, priority: 0.8, changeFrequency: "daily" as const },
    { url: `${baseUrl}/anthology`, priority: 0.8, changeFrequency: "weekly" as const },
    { url: `${baseUrl}/roadmap`, priority: 0.7, changeFrequency: "weekly" as const },
    { url: `${baseUrl}/resources`, priority: 0.7, changeFrequency: "weekly" as const },
    { url: `${baseUrl}/practice`, priority: 0.7, changeFrequency: "weekly" as const },
    { url: `${baseUrl}/aboutme`, priority: 0.6, changeFrequency: "monthly" as const },
    { url: `${baseUrl}/perks`, priority: 0.6, changeFrequency: "monthly" as const },
  ];

  // 工具页面（只包含 Available 的）
  const toolPages = tools
    .filter((t) => t.status === "Available")
    .map((tool) => ({
      url: `${baseUrl}${getToolRoute(tool.id)}`,
      priority: 0.7,
      changeFrequency: "monthly" as const,
    }));

  // Roadmap 详情页
  const roadmapPages = roadmaps.map((r) => ({
    url: `${baseUrl}/roadmap/${r.id}`,
    priority: 0.6,
    changeFrequency: "monthly" as const,
  }));

  // 文集文章页（有 path 的文章，说明有内容）
  const anthologyPages: MetadataRoute.Sitemap = [];
  for (const section of knowledgeBaseMetadata) {
    for (const author of section.authors) {
      for (const category of author.categories) {
        for (const article of category.articles) {
          if (article.path) {
            anthologyPages.push({
              url: `${baseUrl}/anthology?article=${article.id}`,
              priority: 0.5,
              changeFrequency: "yearly" as const,
            });
          }
        }
      }
    }
  }

  return [
    ...staticPages,
    ...toolPages,
    ...roadmapPages,
    ...anthologyPages,
  ];
}
