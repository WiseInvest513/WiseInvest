import { NextResponse } from "next/server";
import { getShortLinkHistory, isRedisConfigured } from "@/lib/short-url";

/**
 * GET /api/short/list
 * 获取最近创建的短链列表
 */
export async function GET() {
  if (!isRedisConfigured()) {
    return NextResponse.json(
      { error: "短链服务未配置" },
      { status: 503 }
    );
  }

  try {
    const list = await getShortLinkHistory(50);
    return NextResponse.json({ list });
  } catch (error) {
    console.error("[API] 获取短链列表失败:", error);
    return NextResponse.json(
      { error: "获取列表失败", message: String(error) },
      { status: 500 }
    );
  }
}
