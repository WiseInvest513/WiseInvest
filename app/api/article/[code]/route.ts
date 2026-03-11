import { NextRequest, NextResponse } from "next/server";
import { getDocumentIdByCode, isRedisConfigured } from "@/lib/feishu-article";

/**
 * GET /api/article/[code]
 * 根据 4 位码获取对应的飞书 documentId
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const safe = code?.replace(/[^0-9]/g, "") ?? "";

  if (safe.length !== 4) {
    return NextResponse.json({ error: "无效的文章码" }, { status: 400 });
  }

  if (!isRedisConfigured()) {
    return NextResponse.json(
      { error: "文章服务未配置" },
      { status: 503 }
    );
  }

  try {
    const documentId = await getDocumentIdByCode(safe);
    if (!documentId) {
      return NextResponse.json(
        { error: "文章不存在或已失效" },
        { status: 404 }
      );
    }
    return NextResponse.json({ documentId });
  } catch (error) {
    console.error("[API] 获取文章失败:", error);
    return NextResponse.json(
      { error: "获取失败" },
      { status: 500 }
    );
  }
}
