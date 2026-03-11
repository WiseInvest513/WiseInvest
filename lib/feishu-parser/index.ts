/**
 * 飞书云文档解析器 - 独立可复用模块
 *
 * 用法：可直接复制 lib/feishu-parser 文件夹到其他项目使用
 *
 * 配置方式：通过环境变量或传入 config
 *   - FEISHU_APP_ID / FEISHU_APP_SECRET
 *   - 或 createFeishuParser({ appId, appSecret })
 *
 * @example
 * ```ts
 * import { createFeishuParser } from './lib/feishu-parser';
 *
 * const parser = createFeishuParser({
 *   appId: process.env.FEISHU_APP_ID!,
 *   appSecret: process.env.FEISHU_APP_SECRET!,
 * });
 *
 * const { html, title } = await parser.docToHtml('Vm8VdbTMxo78U6xtistc8uUAnTf');
 * ```
 */

const FEISHU_API = "https://open.feishu.cn/open-apis";

/** 带重试的 fetch，应对 ECONNRESET 等网络间歇性失败 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3
): Promise<Response> {
  let lastError: unknown;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (e) {
      lastError = e;
      if (i < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 800 * (i + 1)));
      }
    }
  }
  throw lastError;
}

export interface FeishuParserConfig {
  appId: string;
  appSecret: string;
}

export interface FeishuDocResult {
  title: string;
  html: string;
  revisionId?: number;
}

export interface FeishuDocMeta {
  title?: string;
  revisionId?: number;
}

type TextRun = { text?: string; content?: string };

export interface FeishuBlock {
  block_id: string;
  block_type: number | string;
  text?: { elements?: Array<{ text_run?: TextRun }> };
  heading1?: { elements?: Array<{ text_run?: TextRun }> };
  heading2?: { elements?: Array<{ text_run?: TextRun }> };
  heading3?: { elements?: Array<{ text_run?: TextRun }> };
  quote?: { elements?: Array<{ text_run?: TextRun }> };
  quote_container?: unknown;
  image?: { token?: string; width?: number; height?: number };
  code?: {
    language?: string;
    style?: { language?: number };
    elements?: Array<{ text_run?: TextRun }>;
  };
  children?: string[];
  [key: string]: unknown;
}

/**
 * 将纯文本 URL 转为可点击链接
 * 不处理 <pre> 和 <code> 内的内容
 */
export function linkifyUrls(html: string): string {
  const urlRegex = /(^|>|\s|[：:]\s*)(https?:\/\/[^\s"'<>)\]]+?)(?=[\s)）\]"']|$|<)/g;
  const linkify = (text: string) =>
    text.replace(urlRegex, (_, before, url) =>
      `${before}<a href="${url}" class="doc-link" target="_blank" rel="noopener noreferrer">${url}</a>`
    );
  return html
    .replace(/<pre[\s\S]*?<\/pre>|<code[\s\S]*?<\/code>/g, (codeBlock) => {
      return "<!--CODE-->".concat(codeBlock).concat("<!--/CODE-->");
    })
    .split(/<!--CODE-->|<!--\/CODE-->/)
    .map((part, i) => (i % 2 === 1 ? part : linkify(part)))
    .join("");
}

/**
 * 创建飞书解析器实例
 */
export function createFeishuParser(config: FeishuParserConfig) {
  let cachedToken: string | null = null;
  let tokenExpireAt = 0;

  async function getToken(): Promise<string> {
    if (cachedToken && Date.now() < tokenExpireAt - 60000) {
      return cachedToken;
    }
    const res = await fetchWithRetry(`${FEISHU_API}/auth/v3/tenant_access_token/internal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app_id: config.appId, app_secret: config.appSecret }),
    });
    const data = (await res.json()) as {
      code?: number;
      tenant_access_token?: string;
      expire?: number;
      msg?: string;
    };
    if (data.code !== 0 || !data.tenant_access_token) {
      throw new Error(data.msg || "Failed to get Feishu token");
    }
    cachedToken = data.tenant_access_token;
    tokenExpireAt = Date.now() + (data.expire || 7200) * 1000;
    return cachedToken;
  }

  async function getDocument(documentId: string) {
    const token = await getToken();
    const res = await fetchWithRetry(
      `${FEISHU_API}/docx/v1/documents/${documentId}?document_revision_id=-1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error(`Feishu doc fetch failed: ${res.status}`);
    return res.json() as Promise<{
      data?: { document?: { title?: string; revision_id?: number } };
      code?: number;
      msg?: string;
    }>;
  }

  async function getBlocks(documentId: string): Promise<FeishuBlock[]> {
    const token = await getToken();
    const blocks: FeishuBlock[] = [];
    let pageToken: string | undefined;
    do {
      const url = new URL(
        `${FEISHU_API}/docx/v1/documents/${documentId}/blocks`,
        "https://open.feishu.cn"
      );
      url.searchParams.set("document_revision_id", "-1");
      url.searchParams.set("page_size", "500");
      if (pageToken) url.searchParams.set("page_token", pageToken);
      const res = await fetchWithRetry(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Feishu blocks fetch failed: ${res.status}`);
      const data = (await res.json()) as {
        data?: { items?: FeishuBlock[]; page_token?: string; has_more?: boolean };
        code?: number;
        msg?: string;
      };
      if (data.code !== 0 && data.data === undefined) {
        throw new Error(data.msg || "Feishu API error");
      }
      blocks.push(...(data.data?.items ?? []));
      pageToken = data.data?.has_more ? data.data.page_token : undefined;
    } while (pageToken);
    return blocks;
  }

  async function fetchBlockChildren(
    documentId: string,
    blockId: string,
    token: string
  ): Promise<FeishuBlock[]> {
    const items: FeishuBlock[] = [];
    let pageToken: string | undefined;
    do {
      const url = new URL(
        `${FEISHU_API}/docx/v1/documents/${documentId}/blocks/${blockId}/children`,
        "https://open.feishu.cn"
      );
      url.searchParams.set("document_revision_id", "-1");
      url.searchParams.set("page_size", "100");
      if (pageToken) url.searchParams.set("page_token", pageToken);
      const res = await fetchWithRetry(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return items;
      const data = (await res.json()) as {
        data?: { items?: FeishuBlock[]; page_token?: string; has_more?: boolean };
      };
      items.push(...(data.data?.items ?? []));
      pageToken = data.data?.has_more ? data.data.page_token : undefined;
    } while (pageToken);
    return items;
  }

  async function fetchImageUrl(token: string, fileToken: string): Promise<string | null> {
    try {
      const res = await fetchWithRetry(
        `${FEISHU_API}/drive/v1/medias/batch_get_tmp_download_url?file_tokens=${encodeURIComponent(fileToken)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = (await res.json()) as {
        data?: { tmp_download_urls?: Array<{ tmp_download_url?: string }> };
        code?: number;
      };
      if (data.code === 0 && data.data?.tmp_download_urls?.[0]?.tmp_download_url) {
        return data.data.tmp_download_urls[0].tmp_download_url;
      }
    } catch {
      // ignore
    }
    return null;
  }

  function getBlockText(block: FeishuBlock): string {
    const textBlock =
      block.text ?? block.heading1 ?? block.heading2 ?? block.heading3 ?? block.quote ?? block.code;
    if (!textBlock?.elements) return "";
    return (textBlock.elements as Array<{ text_run?: TextRun }>)
      .map((e) => e.text_run?.content ?? e.text_run?.text ?? "")
      .join("");
  }

  type TextElement = {
    text_run?: { content?: string; text?: string; text_element_style?: { bold?: boolean; italic?: boolean } };
    text?: string;
  };

  function renderElementsToHtml(
    elements: TextElement[] | undefined,
    escape: (s: string) => string
  ): string {
    if (!elements?.length) return "";
    return elements
      .map((e) => {
        const run = e.text_run;
        const content = run?.content ?? run?.text ?? "";
        const bold = run?.text_element_style?.bold;
        const italic = run?.text_element_style?.italic;
        const escaped = escape(content);
        if (bold && italic) return `<strong><em>${escaped}</em></strong>`;
        if (bold) return `<strong>${escaped}</strong>`;
        if (italic) return `<em>${escaped}</em>`;
        return escaped;
      })
      .join("");
  }

  function getBlockType(block: FeishuBlock): string {
    const t = block.block_type;
    if (typeof t === "string" && t) return t;
    const typeMap: Record<number, string> = {
      1: "page",
      2: "text",
      3: "heading1",
      4: "heading2",
      5: "heading3",
      6: "heading4",
      7: "heading5",
      8: "heading6",
      9: "heading7",
      10: "heading8",
      11: "heading9",
      12: "bullet",
      13: "ordered",
      14: "code",
      15: "quote",
      16: "quote_container",
      17: "table",
      18: "image",
      19: "divider",
      20: "file",
      21: "callout",
      27: "image",
      34: "quote_container",
    };
    return typeMap[t as number] ?? "text";
  }

  function escapeHtml(s: string): string {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderBlockToHtml(block: FeishuBlock, escape: (s: string) => string): string {
    const type = getBlockType(block);
    const text = getBlockText(block);
    const textBlock =
      block.text ?? block.heading1 ?? block.heading2 ?? block.heading3 ?? block.quote ?? block.code;
    const elements = textBlock?.elements as TextElement[] | undefined;
    const richContent = elements ? renderElementsToHtml(elements, escape) : escape(text);
    if (type.startsWith("heading")) {
      const level = type.replace("heading", "") || "1";
      const id = block.block_id ? ` id="${escape(block.block_id)}"` : "";
      return `<h${level}${id} class="doc-heading">${richContent}</h${level}>`;
    }
    if (type === "quote") {
      return `<blockquote class="doc-quote"><p>${richContent}</p></blockquote>`;
    }
    if (type === "code") return "";
    if (type === "text" || type === "bullet" || type === "ordered") {
      if (text.trim()) return `<p>${richContent}</p>`;
      return `<p class="doc-spacer"></p>`;
    }
    if (type === "divider") return "<hr />";
    if (type !== "page" && text.trim()) return `<p>${richContent}</p>`;
    return "";
  }

  async function blocksToHtml(documentId: string, blocks: FeishuBlock[]): Promise<string> {
    const token = await getToken();
    const escape = escapeHtml;
    const parts: string[] = [];
    const root = blocks.find((b) => getBlockType(b) === "page");
    const childIds = root?.children ?? [];
    const blockMap = new Map<string, FeishuBlock>();
    for (const b of blocks) blockMap.set(b.block_id, b);
    for (const id of childIds) {
      const block = blockMap.get(id);
      if (!block) continue;
      const type = getBlockType(block);
      if (type === "quote_container" || type === "callout") {
        const children = await fetchBlockChildren(documentId, block.block_id, token);
        const inner = children
          .map((c) => renderBlockToHtml(c, escape))
          .filter(Boolean)
          .join("");
        parts.push(`<blockquote class="doc-quote">${inner || "<p></p>"}</blockquote>`);
      } else if (type === "code") {
        let codeText = getBlockText(block);
        if (block.children?.length) {
          const children = await fetchBlockChildren(documentId, block.block_id, token);
          codeText = children.map((c) => getBlockText(c)).join("\n") || codeText;
        }
        const codeData = block.code as { language?: string; style?: { language?: number } };
        let lang = codeData?.language ?? "";
        if (!lang && typeof codeData?.style?.language === "number") {
          const langMap: Record<number, string> = {
            1: "plaintext",
            2: "bash",
            3: "python",
            4: "javascript",
            5: "java",
            6: "sql",
            7: "html",
            8: "css",
            9: "json",
            10: "yaml",
          };
          lang = langMap[codeData.style.language] ?? "plaintext";
        }
        parts.push(
          `<pre><code class="language-${escape(lang)}">${escape(codeText)}</code></pre>`
        );
      } else if ((type === "image" || block.image?.token) && block.image?.token) {
        const url = await fetchImageUrl(token, block.image.token);
        if (url) {
          parts.push(
            `<figure class="doc-image-wrap"><img src="${escape(url)}" alt="" class="doc-image" /></figure>`
          );
        } else {
          parts.push(`<p class="text-slate-500 text-sm">[图片]</p>`);
        }
      } else {
        const html = renderBlockToHtml(block, escape);
        if (html) parts.push(html);
      }
    }
    return linkifyUrls(parts.join(""));
  }

  /**
   * 将飞书文档转为 HTML（一站式入口）
   */
  async function docToHtml(documentId: string): Promise<FeishuDocResult> {
    const doc = await getDocument(documentId);
    const meta = doc.data?.document;
    const title = meta?.title ?? documentId;
    const revisionId = meta?.revision_id ?? 0;
    const blocks = await getBlocks(documentId);
    const html = await blocksToHtml(documentId, blocks);
    return { title, html, revisionId };
  }

  return {
    getToken,
    getDocument,
    getBlocks,
    blocksToHtml,
    docToHtml,
    linkifyUrls,
  };
}
