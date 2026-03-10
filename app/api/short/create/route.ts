import { NextRequest, NextResponse } from "next/server";
import { createShortLink, isRedisConfigured } from "@/lib/short-url";
import { getCreateShortLimit, getClientIp } from "@/lib/ratelimit";

/**
 * POST /api/short/create
 * 创建短链接
 * 限流：同一 IP 每 1 秒最多 3 次
 * Body: { url: string }
 */
export async function POST(request: NextRequest) {
  if (!isRedisConfigured()) {
    return NextResponse.json(
      { error: "短链服务未配置，请设置 Redis 环境变量" },
      { status: 503 }
    );
  }

  try {
    const limiter = getCreateShortLimit();
    const ip = getClientIp(request);
    const { success } = await limiter.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "请求过于频繁，请 1 秒后再试" },
        { status: 429 }
      );
    }
  } catch (e) {
    console.warn("[API] 短链创建限流检查失败:", e);
    // 限流服务异常时放行
  }

  try {
    const body = await request.json();
    const url = typeof body.url === "string" ? body.url.trim() : "";

    if (!url) {
      return NextResponse.json(
        { error: "请提供有效的 URL" },
        { status: 400 }
      );
    }

    // 简单校验：必须以 http 或 https 开头
    if (!/^https?:\/\//i.test(url)) {
      return NextResponse.json(
        { error: "URL 必须以 http:// 或 https:// 开头" },
        { status: 400 }
      );
    }

    const shortId = await createShortLink(url);
    // 使用当前请求的 origin，部署到任意域名都会生成对应域名的短链
    const baseUrl = new URL(request.url).origin.replace(/\/$/, "");
    const shortUrl = `${baseUrl}/s/${shortId}`;

    return NextResponse.json({
      success: true,
      shortId,
      shortUrl,
      originalUrl: url,
    });
  } catch (error) {
    console.error("[API] 创建短链失败:", error);
    return NextResponse.json(
      { error: "创建短链失败", message: String(error) },
      { status: 500 }
    );
  }
}
