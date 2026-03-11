/**
 * 飞书文章映射：4 位码 -> documentId
 * 使用 Upstash Redis 存储，与短链共用同一 Redis
 */

import { Redis } from "@upstash/redis";
import { customAlphabet } from "nanoid";

const PREFIX = "article:";

// 4 位数字
const nanoid = customAlphabet("0123456789", 4);

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

export function generateArticleCode(): string {
  return nanoid();
}

export async function createArticleMapping(documentId: string): Promise<string> {
  const redis = getRedis();
  let code = generateArticleCode();
  let exists = await redis.get(`${PREFIX}${code}`);
  while (exists) {
    code = generateArticleCode();
    exists = await redis.get(`${PREFIX}${code}`);
  }
  await redis.set(`${PREFIX}${code}`, documentId);
  return code;
}

export async function getDocumentIdByCode(code: string): Promise<string | null> {
  const redis = getRedis();
  const docId = await redis.get<string>(`${PREFIX}${code}`);
  return docId ?? null;
}

export function isRedisConfigured(): boolean {
  const url =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return Boolean(url && token);
}
