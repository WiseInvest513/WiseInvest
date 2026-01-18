import { knowledgeBaseMetadata } from "./metadata";
import type { Author, Article, ArticleMetadata, ArticleWithMeta } from "./types";

/**
 * 文集数据懒加载管理器
 * 实现按需加载文章内容，优化首屏加载性能
 * 支持两种内容来源：
 * 1. data.ts 中的硬编码内容（优先级高）
 * 2. Word 文档文件（.docx，存储在 lib/anthology/documents/）
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
 * 优先从 data.ts 加载，如果找不到则尝试从 Word 文档加载
 */
export async function loadArticleContent(id: string): Promise<Article | null> {
  // 先检查缓存
  if (contentCache.has(id)) {
    return contentCache.get(id)!;
  }

  // 方法 1: 尝试从 data.ts 加载（原有方式）
  try {
    const { articleContentMap } = await import("./data");
    const article = articleContentMap.get(id);
    
    if (article) {
      contentCache.set(id, article);
      return article;
    }
  } catch (error) {
    console.warn(`[Anthology] 从 data.ts 加载失败: ${id}`, error);
  }

  // 方法 2: 尝试从 Word 文档加载（新增方式）
  // 注意：只在服务器端执行，客户端不执行
  if (typeof window === "undefined") {
    try {
      const { loadArticleFromWord } = await import("./word-loader");
      
      // 先获取元数据以获取标题
      const metadata = getArticleMetadataById(id);
      if (!metadata) {
        console.warn(`[Anthology] 无法获取文章元数据: ${id}`);
        return null;
      }
      
      const content = await loadArticleFromWord(id);
      
      if (content) {
        const article: Article = {
          id,
          title: metadata.title,
          content,
        };
        
        // 缓存文章内容
        contentCache.set(id, article);
        console.log(`[Anthology] ✅ 从 Word 文档加载文章: ${id}`);
        return article;
      }
    } catch (error: any) {
      // 如果是库未安装的错误，只警告不报错
      if (error.message?.includes("mammoth") || error.message?.includes("未安装")) {
        console.warn(`[Anthology] Word 文档解析功能未启用（需要安装 mammoth 库）: ${id}`);
      } else {
        console.error(`[Anthology] 从 Word 文档加载失败: ${id}`, error);
      }
    }
  }
  
  return null;
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

