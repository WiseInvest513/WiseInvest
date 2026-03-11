import { redirect } from "next/navigation";

/**
 * 访问 /article 时重定向到 /tweets
 * 具体文章 /article/[code] 由 [code] 路由处理
 */
export default function ArticleIndexPage() {
  redirect("/tweets");
}
