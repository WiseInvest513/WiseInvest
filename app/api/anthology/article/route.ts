import { NextRequest, NextResponse } from "next/server";
import { getArticleById } from "@/lib/anthology";

/**
 * API 路由：获取文章内容
 * 用于客户端组件通过 API 获取文章，支持 Word 文档加载
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const articleId = searchParams.get("id");

  if (!articleId) {
    return NextResponse.json(
      { error: "缺少文章 ID" },
      { status: 400 }
    );
  }

  try {
    const article = await getArticleById(articleId);
    
    if (!article) {
      return NextResponse.json(
        { error: "文章不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json(article);
  } catch (error: any) {
    console.error(`[API] 获取文章失败: ${articleId}`, error);
    return NextResponse.json(
      { error: "获取文章失败", message: error.message },
      { status: 500 }
    );
  }
}
