/**
 * 限流：基于 Upstash Redis，与短链服务共用同一 Redis 配置
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

function getRedis(): Redis {
  const url =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error("缺少 Redis 配置");
  }
  return new Redis({ url, token });
}

/** 创建短链：每 1 秒最多 3 次 */
export function getCreateShortLimit() {
  const redis = getRedis();
  return new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(3, "1 s"),
    prefix: "rl:short:create",
  });
}

/** 访问短链跳转：每 1 秒同一 IP 最多 5 次 */
export function getRedirectLimit() {
  const redis = getRedis();
  return new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(5, "1 s"),
    prefix: "rl:short:redirect",
  });
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return realIp ?? "unknown";
}
