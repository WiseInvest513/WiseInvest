#!/usr/bin/env node
/**
 * 注册飞书文章：从链接提取 documentId，存入 Redis，输出文章 URL
 * 用法：node scripts/register-feishu-article.mjs <飞书链接>
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// 加载 .env.local
try {
  const envPath = join(__dirname, "..", ".env.local");
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) {
      const key = m[1].trim();
      const val = m[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch (e) {
  console.warn("未找到 .env.local，使用当前环境变量");
}

const url = process.argv[2];
if (!url) {
  console.error("用法: node scripts/register-feishu-article.mjs <飞书链接>");
  process.exit(1);
}

const match = url.match(/feishu\.cn\/docx\/([a-zA-Z0-9_-]+)/);
const documentId = match ? match[1] : null;
if (!documentId) {
  console.error("无法从链接解析文档 ID");
  process.exit(1);
}

const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
if (!redisUrl || !redisToken) {
  console.error("缺少 Redis 配置 (KV_REST_API_URL, KV_REST_API_TOKEN)");
  process.exit(1);
}

function genCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// Use @upstash/redis
const { Redis } = await import("@upstash/redis");
const redis = new Redis({ url: redisUrl, token: redisToken });

let code = genCode();
let exists = await redis.get(`article:${code}`);
while (exists) {
  code = genCode();
  exists = await redis.get(`article:${code}`);
}
await redis.set(`article:${code}`, documentId);

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.wise-invest.org";
const articleUrl = `${baseUrl.replace(/\/$/, "")}/article/${code}`;

console.log("文档 ID:", documentId);
console.log("4 位码:", code);
console.log("文章链接:", articleUrl);
console.log("\n提示: 使用 article513 页面注册可自动预加载到 Redis");
