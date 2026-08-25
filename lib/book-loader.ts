import { unstable_cache } from "next/cache";

const BOOK_ID = "nasdaq-sp500-bluebook";
const MANIFEST_URL =
  "https://raw.githubusercontent.com/WiseInvest513/book/nasdaq-sp500-bluebook-v1.0.0/books/nasdaq-sp500-bluebook/manifest.json";

type BookManifest = {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  version: string;
  edition: string;
  published_at: string;
  data_cutoff: string;
  stats: {
    parts: number;
    chapters: number;
    pdf_pages: number;
    core_charts: number;
    figures: number;
  };
  content: {
    full_markdown: {
      url: string;
      bytes: number;
      sha256: string;
    };
    navigation: string;
  };
  downloads: {
    pdf: {
      url: string;
      filename: string;
      bytes: number;
      sha256: string;
    };
  };
  links: {
    repository: string;
    release: string;
  };
};

export type BookNavigationTarget = {
  id: string;
  kind: "front" | "chapter" | string;
  chapter?: number;
  part?: number;
  label: string;
  header: string;
};

type BookNavigation = {
  parts: Array<{
    number: number;
    title: string;
    chapters: number[];
  }>;
  targets: BookNavigationTarget[];
};

export type BookPageData = {
  manifest: BookManifest;
  navigation: BookNavigation;
  html: string;
  markdownUrl: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function isSafeUrl(value: string) {
  return /^(https?:|mailto:|#|\/)/i.test(value);
}

function resolveBookUrl(value: string, markdownUrl: string) {
  if (!value || value.startsWith("#") || /^(https?:|data:|mailto:)/i.test(value)) return value;
  return new URL(value, markdownUrl).href;
}

function sanitizeRawHtml(html: string, markdownUrl: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+(href|src)\s*=\s*("([^"]*)"|'([^']*)')/gi, (_match, attr, quoted, doubleValue, singleValue) => {
      const value = doubleValue ?? singleValue ?? "";
      const resolved = resolveBookUrl(value, markdownUrl);
      if (!isSafeUrl(resolved) && !resolved.startsWith("data:image/")) return "";
      return ` ${attr}="${escapeAttribute(resolved)}"`;
    })
    .replace(/\s+(href|src)\s*=\s*javascript:[^\s>]+/gi, "");
}

function renderInlineMarkdown(text: string, markdownUrl: string): string {
  const tokenPattern = /!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)|\*\*(.+?)\*\*|`([^`]+)`/g;
  let output = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(text)) !== null) {
    output += escapeHtml(text.slice(lastIndex, match.index));

    if (match[1] !== undefined && match[2] !== undefined) {
      const alt = escapeAttribute(match[1]);
      const src = resolveBookUrl(match[2], markdownUrl);
      if (isSafeUrl(src) || src.startsWith("data:image/")) {
        output += `<img src="${escapeAttribute(src)}" alt="${alt}" loading="lazy">`;
      }
    } else if (match[3] !== undefined && match[4] !== undefined) {
      const href = resolveBookUrl(match[4], markdownUrl);
      const label = renderInlineMarkdown(match[3], markdownUrl);
      if (isSafeUrl(href)) {
        const external = href.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : "";
        output += `<a href="${escapeAttribute(href)}"${external}>${label}</a>`;
      } else {
        output += label;
      }
    } else if (match[5] !== undefined) {
      output += `<strong>${renderInlineMarkdown(match[5], markdownUrl)}</strong>`;
    } else if (match[6] !== undefined) {
      output += `<code>${escapeHtml(match[6])}</code>`;
    }

    lastIndex = match.index + match[0].length;
  }

  output += escapeHtml(text.slice(lastIndex));
  return output;
}

function stripFrontMatter(markdown: string) {
  const normalized = markdown.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) return normalized;
  const end = normalized.indexOf("\n---\n", 4);
  if (end === -1) return normalized;
  return normalized.slice(end + 5).trimStart();
}

function tableToHtml(lines: string[], markdownUrl: string) {
  const parseCells = (line: string) =>
    line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());

  const headers = parseCells(lines[0]);
  const rows = lines.slice(2).map(parseCells);
  const head = headers.map((header) => `<th>${renderInlineMarkdown(header, markdownUrl)}</th>`).join("");
  const body = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${renderInlineMarkdown(cell, markdownUrl)}</td>`).join("")}</tr>`)
    .join("");

  return `<div class="book-table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function renderAlert(lines: string[], markdownUrl: string) {
  const first = lines[0].replace(/^>\s?/, "");
  const match = first.match(/^\[!(\w+)\]\s*(.*)$/);
  if (!match) {
    const content = lines.map((line) => line.replace(/^>\s?/, "")).join("<br>");
    return `<blockquote>${renderInlineMarkdown(content, markdownUrl)}</blockquote>`;
  }

  const type = match[1].toLowerCase();
  const title = match[2] || match[1];
  const body = lines
    .slice(1)
    .map((line) => line.replace(/^>\s?/, ""))
    .filter(Boolean)
    .map((line) => `<p>${renderInlineMarkdown(line, markdownUrl)}</p>`)
    .join("");

  return `<aside class="book-callout book-callout-${escapeAttribute(type)}"><p class="book-callout-title">${escapeHtml(title)}</p>${body}</aside>`;
}

function shouldStartRawHtmlBlock(line: string) {
  return /^<\/?(section|div|aside|figure|figcaption|dl|dt|dd|p|span|small|strong|em|a|img|nav|ol|ul|li|table|thead|tbody|tr|th|td|br|hr)\b/i.test(line);
}

function closingTagFor(line: string) {
  const match = line.match(/^<([a-z0-9-]+)\b/i);
  if (!match) return null;
  const tag = match[1].toLowerCase();
  if (["img", "br", "hr", "a", "p", "span", "strong", "small", "em"].includes(tag)) return null;
  return `</${tag}>`;
}

export function renderBookMarkdown(markdown: string, markdownUrl: string) {
  const lines = stripFrontMatter(markdown).split("\n");
  const html: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed === "<!-- PAGEBREAK -->") {
      html.push('<div class="book-pagebreak" aria-hidden="true"></div>');
      index += 1;
      continue;
    }

    if (shouldStartRawHtmlBlock(trimmed)) {
      const block = [line];
      const closingTag = closingTagFor(trimmed);
      index += 1;
      if (closingTag && !trimmed.includes(closingTag)) {
        while (index < lines.length) {
          block.push(lines[index]);
          if (lines[index].includes(closingTag)) {
            index += 1;
            break;
          }
          index += 1;
        }
      }
      html.push(sanitizeRawHtml(block.join("\n"), markdownUrl));
      continue;
    }

    const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2].replace(/\s*#+$/, "");
      html.push(`<h${level}>${renderInlineMarkdown(text, markdownUrl)}</h${level}>`);
      index += 1;
      continue;
    }

    if (trimmed.startsWith(">")) {
      const block: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        block.push(lines[index]);
        index += 1;
      }
      html.push(renderAlert(block, markdownUrl));
      continue;
    }

    if (trimmed.startsWith("|") && lines[index + 1]?.trim().match(/^\|[-:\s|]+\|$/)) {
      const tableLines = [lines[index], lines[index + 1]];
      index += 2;
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        tableLines.push(lines[index]);
        index += 1;
      }
      html.push(tableToHtml(tableLines, markdownUrl));
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ""));
        index += 1;
      }
      html.push(`<ul>${items.map((item) => `<li>${renderInlineMarkdown(item, markdownUrl)}</li>`).join("")}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      html.push(`<ol>${items.map((item) => `<li>${renderInlineMarkdown(item, markdownUrl)}</li>`).join("")}</ol>`);
      continue;
    }

    const paragraph: string[] = [trimmed];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,4})\s+/.test(lines[index].trim()) &&
      !lines[index].trim().startsWith(">") &&
      !lines[index].trim().startsWith("|") &&
      !shouldStartRawHtmlBlock(lines[index].trim()) &&
      lines[index].trim() !== "<!-- PAGEBREAK -->"
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    html.push(`<p>${renderInlineMarkdown(paragraph.join(" "), markdownUrl)}</p>`);
  }

  return html.join("\n");
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return response.json() as Promise<T>;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return response.text();
}

export const getNasdaqBook = unstable_cache(
  async (): Promise<BookPageData> => {
    const manifest = await fetchJson<BookManifest>(MANIFEST_URL);
    const bookBaseUrl = new URL("./", MANIFEST_URL).href;
    const navigationUrl = new URL(manifest.content.navigation, bookBaseUrl).href;

    const [navigation, markdown] = await Promise.all([
      fetchJson<BookNavigation>(navigationUrl),
      fetchText(manifest.content.full_markdown.url),
    ]);

    return {
      manifest,
      navigation,
      html: renderBookMarkdown(markdown, manifest.content.full_markdown.url),
      markdownUrl: manifest.content.full_markdown.url,
    };
  },
  [`book-${BOOK_ID}-v1`],
  { revalidate: 60 * 60 * 24 }
);
