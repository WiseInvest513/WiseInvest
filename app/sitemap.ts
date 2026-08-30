import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";
import { tools } from "@/lib/data";
import { getToolRoute } from "@/lib/tool-routes";
import { knowledgeBaseMetadata } from "@/lib/anthology/metadata";
import { roadmaps } from "@/lib/roadmaps-data";
import { getAllArticles, getArticleRoute } from "@/lib/articles";
import { categories } from "@/lib/articles-data";
import { requiresLoginForContent } from "@/lib/content-access";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.baseUrl;

  // 静态页面
  const staticPages = [
    { url: baseUrl, priority: 1.0, changeFrequency: "daily" as const },
    { url: `${baseUrl}/start`, priority: 0.95, changeFrequency: "weekly" as const },
    { url: `${baseUrl}/get`, priority: 0.92, changeFrequency: "weekly" as const },
    { url: `${baseUrl}/tools`, priority: 0.9, changeFrequency: "weekly" as const },
    { url: `${baseUrl}/tweets`, priority: 0.8, changeFrequency: "daily" as const },
    { url: `${baseUrl}/anthology`, priority: 0.8, changeFrequency: "weekly" as const },
    { url: `${baseUrl}/book/nasdaq`, priority: 0.88, changeFrequency: "monthly" as const },
    { url: `${baseUrl}/roadmap`, priority: 0.7, changeFrequency: "weekly" as const },
    { url: `${baseUrl}/resources`, priority: 0.7, changeFrequency: "weekly" as const },
    { url: `${baseUrl}/practice/dca-investment`, priority: 0.86, changeFrequency: "weekly" as const },
    { url: `${baseUrl}/practice/binance-dca`, priority: 0.76, changeFrequency: "weekly" as const },
    { url: `${baseUrl}/ipo`, priority: 0.75, changeFrequency: "weekly" as const },
    { url: `${baseUrl}/aboutme`, priority: 0.6, changeFrequency: "monthly" as const },
    { url: `${baseUrl}/perk`, priority: 0.6, changeFrequency: "monthly" as const },
    { url: `${baseUrl}/card`, priority: 0.6, changeFrequency: "monthly" as const },
  ];

  // 工具页面（只包含 Available 的）
  const toolPages = tools
    .filter((t) => t.status === "Available")
    .map((tool) => ({
      url: `${baseUrl}${getToolRoute(tool.id)}`,
      priority: tool.id === "dca-zone" ? 0.9 : 0.7,
      changeFrequency: tool.id === "dca-zone" ? "daily" as const : "monthly" as const,
    }));

  // Roadmap 详情页
  const roadmapPages = roadmaps
    .filter((r) => !requiresLoginForContent(`/roadmap/${r.id}`))
    .map((r) => ({
      url: `${baseUrl}/roadmap/${r.id}`,
      priority: 0.6,
      changeFrequency: "monthly" as const,
    }));

  const articlePages = getAllArticles()
    .filter((article) => article.categoryId)
    .map((article) => ({
      url: `${baseUrl}${getArticleRoute(article)}`,
      lastModified: article.date ? new Date(article.date) : undefined,
      priority: requiresLoginForContent(getArticleRoute(article)) ? 0.72 : 0.82,
      changeFrequency: "monthly" as const,
    }));

  const articleCategoryIds = new Set(getAllArticles().map((article) => article.categoryId));
  const articleCategoryPages = categories
    .filter((category) => articleCategoryIds.has(category.id))
    .map((category) => ({
      url: `${baseUrl}/articles/${category.id}`,
      priority: ["vcard", "crypto", "broker", "bank", "index"].includes(category.id) ? 0.85 : 0.65,
      changeFrequency: "weekly" as const,
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
    ...articleCategoryPages,
    ...articlePages,
    ...anthologyPages,
  ];
}
