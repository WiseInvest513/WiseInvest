import { knowledgeBaseMetadata } from "./metadata";
import type { Author, Article, ArticleMetadata, ArticleWithMeta } from "./types";

/**
 * 文集数据懒加载管理器
 * 实现按需加载文章内容，优化首屏加载性能
 */

// 文章内容缓存（避免重复加载）
const contentCache = new Map<string, Article>();

/**
 * 获取文集元数据（轻量级，立即返回）
 * 用于显示文章列表、搜索、导航等
 */
export function getKnowledgeBaseMetadata(): Author[] {
  return knowledgeBaseMetadata;
}

/**
 * 获取所有文章的元数据（扁平化）
 */
export function getAllArticleMetadata(): Array<ArticleMetadata & { author: string; category: string }> {
  const allArticles: Array<ArticleMetadata & { author: string; category: string }> = [];
  
  knowledgeBaseMetadata.forEach((author) => {
    author.categories.forEach((category) => {
      category.articles.forEach((article) => {
        allArticles.push({
          ...article,
          author: author.name,
          category: category.name,
        });
      });
    });
  });
  
  return allArticles;
}

/**
 * 根据 ID 获取文章元数据（不包含内容）
 */
export function getArticleMetadataById(id: string): (ArticleMetadata & { author: string; category: string }) | null {
  const allArticles = getAllArticleMetadata();
  return allArticles.find((article) => article.id === id) || null;
}

/**
 * 懒加载文章内容
 * 使用动态导入实现代码分割，只在需要时才加载文章内容数据
 */
export async function loadArticleContent(id: string): Promise<Article | null> {
  // 先检查缓存
  if (contentCache.has(id)) {
    return contentCache.get(id)!;
  }

  try {
    // 动态导入文章内容数据（代码分割）
    const { articleContentMap } = await import("./data");
    
    const article = articleContentMap.get(id);
    
    if (article) {
      // 缓存文章内容
      contentCache.set(id, article);
      return article;
    }
    
    return null;
  } catch (error) {
    console.error(`[Anthology] Failed to load article content for ${id}:`, error);
    return null;
  }
}

/**
 * 获取完整文章（包含内容和元数据）
 * 这是主要的 API，用于在页面中显示文章
 */
export async function getArticleById(id: string): Promise<ArticleWithMeta | null> {
  // 先获取元数据（同步，轻量级）
  const metadata = getArticleMetadataById(id);
  if (!metadata) {
    return null;
  }

  // 懒加载文章内容（异步，重量级）
  const content = await loadArticleContent(id);
  if (!content) {
    return null;
  }

  return {
    ...content,
    author: metadata.author,
    category: metadata.category,
  };
}

/**
 * 预加载多篇文章内容（可选优化）
 * 可以在用户浏览列表时预加载下一篇文章
 */
export async function preloadArticles(ids: string[]): Promise<void> {
  const loadPromises = ids.map((id) => loadArticleContent(id));
  await Promise.all(loadPromises);
}

// 导出类型供外部使用
export type { Author, Article, ArticleMetadata, ArticleWithMeta } from "./types";

