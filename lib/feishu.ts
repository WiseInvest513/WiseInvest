/**
 * 飞书云文档 - 项目内封装
 * 底层使用 @/lib/feishu-parser 解析器
 */
import {
  createFeishuParser,
  linkifyUrls as linkifyUrlsFn,
  type FeishuBlock,
} from "@/lib/feishu-parser";

const appId = process.env.FEISHU_APP_ID ?? "";
const appSecret = process.env.FEISHU_APP_SECRET ?? "";

const parser = createFeishuParser({ appId, appSecret });

const docCache = new Map<string, { revisionId: number; html: string }>();

export function isFeishuConfigured(): boolean {
  return Boolean(appId && appSecret);
}

export async function getFeishuToken(): Promise<string> {
  return parser.getToken();
}

export async function getFeishuDocument(documentId: string) {
  return parser.getDocument(documentId);
}

export function getCachedDocHtml(documentId: string, revisionId: number): string | null {
  const cached = docCache.get(documentId);
  if (cached && cached.revisionId === revisionId) return cached.html;
  return null;
}

export function setCachedDocHtml(documentId: string, revisionId: number, html: string): void {
  docCache.set(documentId, { revisionId, html });
}

export async function getFeishuBlocks(documentId: string): Promise<FeishuBlock[]> {
  return parser.getBlocks(documentId);
}

export async function feishuBlocksToHtml(
  documentId: string,
  blocks: FeishuBlock[]
): Promise<string> {
  return parser.blocksToHtml(documentId, blocks);
}

export { linkifyUrlsFn as linkifyUrls };
