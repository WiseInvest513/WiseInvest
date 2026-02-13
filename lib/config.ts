/**
 * 站点配置
 * 
 * 用于集中管理网站的基础 URL 和域名配置
 * 开发环境：http://localhost:3002
 * 生产环境：更新为实际域名即可
 */

export const siteConfig = {
  /**
   * 网站基础 URL
   * 开发环境：http://localhost:3002
   * 生产环境：https://yourdomain.com
   */
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002",

  /**
   * 网站名称
   */
  name: "Wise Invest",

  /**
   * 网站描述
   */
  description: "专业的投资内容平台，提供投资工具、深度分析和优质资源",

  /**
   * 生成完整 URL 的辅助函数
   * @param path - 路径（如 "/tools" 或 "/aboutme"）
   * @returns 完整的 URL（如 "http://localhost:3002/tools"）
   */
  url(path: string): string {
    // 确保 path 以 / 开头
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    // 移除 baseUrl 末尾的斜杠（如果有）
    const base = this.baseUrl.replace(/\/$/, "");
    return `${base}${normalizedPath}`;
  },
} as const;

