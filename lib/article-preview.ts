import { createContentPreview } from "@/lib/content-access";
import { getArticleRelease } from "@/lib/article-release";

type PreviewArticle = { id: string; categoryId: string; content: string };

export function getArticlePreviewPercentage(article: Pick<PreviewArticle, "id" | "categoryId">) {
  const release = getArticleRelease(article);
  if (release) return release.previewPercentage;
  return article.id === "VIP001" && article.categoryId === "VIP" ? 35 : undefined;
}

/** Keep a prefix of complete Markdown blocks, never an unfinished paragraph or code fence. */
function takeMarkdownPrefix(content: string, maxChars: number) {
  let offset = 0;
  let blockStart = 0;
  let previewEnd = 0;
  let fence: { marker: string; length: number } | null = null;

  for (const line of content.split("\n")) {
    if (offset > maxChars) break;

    const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      if (!fence) {
        fence = { marker, length: fenceMatch[1].length };
      } else if (marker === fence.marker && fenceMatch[1].length >= fence.length && !fenceMatch[2].trim()) {
        fence = null;
      }
    }

    if (!fence && !line.trim()) {
      const block = content.slice(blockStart, offset).trim();
      // Do not end the trial on a new heading or a separator without its following text.
      const headingOnly = /^#{1,6}\s+[^\n]+$/.test(block) || /^[^\n]+\n[=-]+$/.test(block);
      const separatorOnly = /^(?:\*\s*){3,}$|^(?:-\s*){3,}$|^(?:_\s*){3,}$/.test(block);
      if (block && !headingOnly && !separatorOnly) previewEnd = offset;
      blockStart = offset + line.length + 1;
    }

    offset += line.length + 1;
  }

  return content.slice(0, previewEnd).trimEnd();
}

export function createArticlePreview(article: PreviewArticle) {
  const percentage = getArticlePreviewPercentage(article);
  if (percentage === undefined) return createContentPreview(article.content);

  return takeMarkdownPrefix(article.content, Math.floor(article.content.length * percentage / 100));
}
