import fs from "fs";
import path from "path";
import type { Article } from "./articles-data";

const CONTENT_ROOT = path.join(process.cwd(), "content", "articles");

/** Parse frontmatter from a markdown file */
function parseFrontmatter(raw: string): { meta: Record<string, string>; content: string } {
  if (!raw.startsWith("---")) return { meta: {}, content: raw };
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { meta: {}, content: raw };

  const block = raw.slice(4, end);
  const content = raw.slice(end + 4).trimStart();

  const meta: Record<string, string> = {};
  for (const line of block.split("\n")) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim().replace(/^["']|["']$/g, "");
    if (key) meta[key] = val;
  }

  return { meta, content };
}

/** Resolve ./image.jpg → /api/content/articles/{basePath}/image.jpg */
function resolveImagePaths(content: string, basePath: string): string {
  return content.replace(
    /!\[([^\]]*)\]\(\.\//g,
    `![$1](/api/content/articles/${basePath}/`
  );
}

/** Walk a directory recursively, return all .md files */
function walkMd(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkMd(full));
    else if (entry.isFile() && entry.name.endsWith(".md") || entry.name.endsWith(".mdx")) results.push(full);
  }
  return results;
}

export interface FsArticle extends Article {
  basePath: string;
}

export function loadFsArticles(): FsArticle[] {
  const files = walkMd(CONTENT_ROOT);
  const results: FsArticle[] = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(file, "utf-8");
      const { meta, content } = parseFrontmatter(raw);
      if (!meta.id || !meta.title) continue;

      // basePath = relative path from content/articles, e.g. "broker/fuxing"
      const rel = path.relative(CONTENT_ROOT, path.dirname(file));
      const basePath = rel.split(path.sep).join("/");

      results.push({
        id: meta.id,
        title: meta.title,
        categoryId: meta.categoryId ?? "",
        subcategoryId: meta.subcategoryId,
        date: meta.date ?? "",
        readTime: parseInt(meta.readTime ?? "5", 10),
        summary: meta.summary ?? "",
        content: resolveImagePaths(content, basePath),
        imageLayout: meta.imageLayout,
        basePath,
      });
    } catch {
      // skip unreadable files
    }
  }

  // Deduplicate by id — first file wins (prevents two files sharing the same id from mixing up content)
  const seen = new Set<string>();
  const deduped = results.filter(a => { if (seen.has(a.id)) return false; seen.add(a.id); return true; });

  return deduped.sort((a, b) => (b.date > a.date ? 1 : -1));
}
