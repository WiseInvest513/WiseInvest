/**
 * 飞书文档 Redis 缓存 - 预加载 HTML 到服务器，加速首次访问
 */

import { Redis } from "@upstash/redis";

const PREFIX = "feishu:doc:";
const TTL = 60 * 60 * 24 * 7; // 7 天

function getRedis(): Redis {
  const url =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("缺少 Redis 配置");
  return new Redis({ url, token });
}

export type CachedDoc = { html: string; title: string; revisionId: number };

export async function getFeishuDocFromRedis(documentId: string): Promise<CachedDoc | null> {
  try {
    const redis = getRedis();
    const raw = await redis.get<string>(`${PREFIX}${documentId}`);
    if (!raw) return null;
    return JSON.parse(raw) as CachedDoc;
  } catch {
    return null;
  }
}

export async function setFeishuDocToRedis(
  documentId: string,
  data: CachedDoc
): Promise<void> {
  try {
    const redis = getRedis();
    await redis.set(`${PREFIX}${documentId}`, JSON.stringify(data), { ex: TTL });
  } catch (e) {
    console.warn("[feishu-cache] 写入 Redis 失败:", e);
  }
}

export function isRedisConfigured(): boolean {
  const url =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return Boolean(url && token);
}
