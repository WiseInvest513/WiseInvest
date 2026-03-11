import { NextRequest, NextResponse } from "next/server";
import {
  getFeishuDocument,
  getFeishuBlocks,
  feishuBlocksToHtml,
  getCachedDocHtml,
  setCachedDocHtml,
  linkifyUrls,
  isFeishuConfigured,
} from "@/lib/feishu";
import {
  getFeishuDocFromRedis,
  setFeishuDocToRedis,
  isRedisConfigured,
} from "@/lib/feishu-cache";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  const safe = documentId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safe) {
    return NextResponse.json({ error: "Invalid document" }, { status: 400 });
  }

  if (!isFeishuConfigured()) {
    return NextResponse.json(
      { error: "飞书服务未配置，请设置 FEISHU_APP_ID / FEISHU_APP_SECRET" },
      { status: 503 }
    );
  }

  try {
    // 1. 优先从 Redis 读取（预加载，最快）
    if (isRedisConfigured()) {
      const redisCached = await getFeishuDocFromRedis(safe);
      if (redisCached) {
        return NextResponse.json(
          { html: redisCached.html, title: redisCached.title },
          {
            headers: {
              "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
            },
          }
        );
      }
    }

    // 2. 获取文档元信息
    const doc = await getFeishuDocument(safe);
    const revisionId = doc.data?.document?.revision_id ?? 0;
    const title = doc.data?.document?.title ?? safe;

    // 3. 内存缓存
    const memCached = getCachedDocHtml(safe, revisionId);
    if (memCached) {
      const html = linkifyUrls(memCached);
      if (isRedisConfigured()) {
        setFeishuDocToRedis(safe, { html, title, revisionId }).catch(() => {});
      }
      return NextResponse.json(
        { html, title },
        {
          headers: {
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        }
      );
    }

    // 4. 从飞书 API 拉取并解析
    const blocks = await getFeishuBlocks(safe);
    const html = linkifyUrls(await feishuBlocksToHtml(safe, blocks));
    setCachedDocHtml(safe, revisionId, html);

    // 5. 写入 Redis，下次访问直接命中
    if (isRedisConfigured()) {
      setFeishuDocToRedis(safe, { html, title, revisionId }).catch(() => {});
    }

    return NextResponse.json(
      { html, title },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (e) {
    console.error("[feishu doc]", safe, e);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}
