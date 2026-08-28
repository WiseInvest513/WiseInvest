import { NextResponse, type NextRequest } from "next/server";
import {
  getAdminMutationLimit,
  getClientIp,
  getVipBindingSubmitLimit,
  isRedisRatelimitConfigured,
} from "@/lib/ratelimit";

export async function checkVipBindingSubmitLimit(request: NextRequest, userId: string) {
  if (!isRedisRatelimitConfigured()) return null;

  const limiter = getVipBindingSubmitLimit();
  const ip = getClientIp(request);
  const result = await limiter.limit(`${userId}:${ip}`);

  if (!result.success) {
    return NextResponse.json(
      { ok: false, message: "提交过于频繁，请稍后再试。" },
      { status: 429 }
    );
  }

  return null;
}

export async function checkAdminMutationLimit(request: NextRequest, adminUserId: string) {
  if (!isRedisRatelimitConfigured()) return null;

  const limiter = getAdminMutationLimit();
  const ip = getClientIp(request);
  const result = await limiter.limit(`${adminUserId}:${ip}`);

  if (!result.success) {
    return NextResponse.json(
      { ok: false, message: "后台操作过于频繁，请稍后再试。" },
      { status: 429 }
    );
  }

  return null;
}
