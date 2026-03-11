import { NextRequest, NextResponse } from "next/server";
import { createArticleMapping, isRedisConfigured } from "@/lib/feishu-article";
import {
  getFeishuDocument,
  getFeishuBlocks,
  feishuBlocksToHtml,
  linkifyUrls,
  isFeishuConfigured,
} from "@/lib/feishu";
import { setFeishuDocToRedis, isRedisConfigured as isFeishuCacheReady } from "@/lib/feishu-cache";

/** 后台预加载文档到 Redis，用户首次访问时即可快速加载 */
async function preloadDocToRedis(documentId: string) {
  try {
    if (!isFeishuConfigured() || !isFeishuCacheReady()) return;
    const doc = await getFeishuDocument(documentId);
    const blocks = await getFeishuBlocks(documentId);
    const html = linkifyUrls(await feishuBlocksToHtml(documentId, blocks));
    const title = doc.data?.document?.title ?? documentId;
    const revisionId = doc.data?.document?.revision_id ?? 0;
    await setFeishuDocToRedis(documentId, { html, title, revisionId });
  } catch (e) {
    console.warn("[article] 预加载失败:", documentId, e);
  }
}

/**
 * 从飞书链接提取 documentId
 * 格式：https://xxx.feishu.cn/docx/{documentId}
 */
function extractDocumentId(url: string): string | null {
  const trimmed = url.trim();
  const match = trimmed.match(/feishu\.cn\/docx\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * POST /api/article/register
 * 注册飞书文档，返回 4 位码和文章 URL
 * Body: { url: string } 飞书云文档链接
 */
export async function POST(request: NextRequest) {
  if (!isRedisConfigured()) {
    return NextResponse.json(
      { error: "文章服务未配置，请设置 Redis 环境变量" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!url) {
      return NextResponse.json(
        { error: "请提供飞书云文档链接" },
        { status: 400 }
      );
    }

    const documentId = extractDocumentId(url);
    if (!documentId) {
      return NextResponse.json(
        { error: "无法从链接中解析文档 ID，请使用 https://xxx.feishu.cn/docx/xxx 格式" },
        { status: 400 }
      );
    }

    const code = await createArticleMapping(documentId);
    const baseUrl = new URL(request.url).origin.replace(/\/$/, "");
    const articleUrl = `${baseUrl}/article/${code}`;

    // 后台预加载到 Redis，用户点击时即可快速加载
    preloadDocToRedis(documentId).catch(() => {});

    return NextResponse.json({
      success: true,
      code,
      documentId,
      articleUrl,
    });
  } catch (error) {
    console.error("[API] 注册文章失败:", error);
    return NextResponse.json(
      { error: "注册失败", message: String(error) },
      { status: 500 }
    );
  }
}
