/**
 * 短链接服务
 * 使用 Upstash Redis 存储短链映射
 *
 * 环境变量（二选一）：
 * - Upstash 直连: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 * - Vercel 集成: KV_REST_API_URL, KV_REST_API_TOKEN
 */

import { Redis } from "@upstash/redis";
import { customAlphabet } from "nanoid";

const PREFIX = "short:";
const HISTORY_KEY = "short:history";
const HISTORY_MAX_LEN = 100;

export type ShortLinkRecord = {
  shortId: string;
  originalUrl: string;
  createdAt: string; // ISO
};

// 生成 8 位数字+字母短 ID（避免与常见路径冲突）
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 8);

function getRedis(): Redis {
  const url =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      "缺少 Redis 配置，请在 .env.local 中设置 KV_REST_API_URL/KV_REST_API_TOKEN 或 UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN"
    );
  }

  return new Redis({ url, token });
}

export function generateShortId(): string {
  return nanoid();
}

export async function createShortLink(originalUrl: string): Promise<string> {
  const redis = getRedis();
  let shortId = generateShortId();

  // 避免碰撞：若已存在则重新生成
  let exists = await redis.get(`${PREFIX}${shortId}`);
  while (exists) {
    shortId = generateShortId();
    exists = await redis.get(`${PREFIX}${shortId}`);
  }

  await redis.set(`${PREFIX}${shortId}`, originalUrl);

  // 写入历史列表（最新在前），失败不影响短链本身
  try {
    const record: ShortLinkRecord = {
      shortId,
      originalUrl,
      createdAt: new Date().toISOString(),
    };
    await redis.lpush(HISTORY_KEY, JSON.stringify(record));
    await redis.ltrim(HISTORY_KEY, 0, HISTORY_MAX_LEN - 1);
  } catch (e) {
    console.warn("[short-url] 写入历史失败:", e);
  }

  return shortId;
}

export async function getShortLinkHistory(limit = 50): Promise<ShortLinkRecord[]> {
  const redis = getRedis();
  const raw = await redis.lrange(HISTORY_KEY, 0, limit - 1);
  const list: ShortLinkRecord[] = [];
  for (const item of raw ?? []) {
    try {
      const parsed =
        typeof item === "string"
          ? (JSON.parse(item) as ShortLinkRecord)
          : (item as ShortLinkRecord);
      if (parsed?.shortId && parsed?.originalUrl) {
        list.push({
          shortId: parsed.shortId,
          originalUrl: parsed.originalUrl,
          createdAt: parsed.createdAt ?? new Date(0).toISOString(),
        });
      }
    } catch {
      // 忽略格式错误的条目
    }
  }
  return list;
}

export async function getOriginalUrl(shortId: string): Promise<string | null> {
  const redis = getRedis();
  const url = await redis.get<string>(`${PREFIX}${shortId}`);
  return url ?? null;
}

export function isRedisConfigured(): boolean {
  const url =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return Boolean(url && token);
}
