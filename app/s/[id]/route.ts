import { NextRequest, NextResponse } from "next/server";
import { getOriginalUrl, isRedisConfigured } from "@/lib/short-url";
import { getRedirectLimit, getClientIp } from "@/lib/ratelimit";

/**
 * GET /s/[id]
 * 短链重定向：根据短 ID 跳转到原始 URL
 * 限流：同一 IP 每 1 秒最多 5 次访问
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isRedisConfigured()) {
    return NextResponse.json(
      { error: "短链服务未配置" },
      { status: 503 }
    );
  }

  try {
    const limiter = getRedirectLimit();
    const ip = getClientIp(request);
    const { success } = await limiter.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "访问过于频繁，请稍后再试" },
        { status: 429 }
      );
    }
  } catch (e) {
    console.warn("[short-url] 限流检查失败:", e);
    // 限流服务异常时放行，避免影响正常跳转
  }

  const originalUrl = await getOriginalUrl(id);

  if (!originalUrl) {
    return NextResponse.json(
      { error: "短链不存在或已失效" },
      { status: 404 }
    );
  }

  // 302 临时重定向，方便以后修改目标
  return NextResponse.redirect(originalUrl, 302);
}
