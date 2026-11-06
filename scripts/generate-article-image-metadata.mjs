#!/usr/bin/env node

import { readFile, readdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Build-time only: readers import the small JSON index, never inspect public/.
const require = createRequire(import.meta.url);
const { imageSize } = require("next/dist/compiled/image-size");
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentRoot = path.join(projectRoot, "content/articles");
const publicRoot = path.join(projectRoot, "public");
const outputPath = path.join(projectRoot, "lib/article-image-metadata.json");

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await markdownFiles(filename));
    else if (entry.isFile() && /\.mdx?$/.test(entry.name)) files.push(filename);
  }
  return files.sort();
}

const urls = new Set();
for (const filename of await markdownFiles(contentRoot)) {
  const content = await readFile(filename, "utf8");
  const basePath = path.relative(contentRoot, path.dirname(filename)).split(path.sep).join("/");
  // Match the Markdown image syntax supported by the article renderer.
  for (const match of content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
    const source = match[1];
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(source)) continue;
    const url = source.startsWith("/")
      ? source
      : `/content/articles/${basePath}/${source.replace(/^\.\//, "")}`;
    urls.add(url);
  }
}

const metadata = {};
let skipped = 0;
for (const url of [...urls].sort()) {
  try {
    const pathname = decodeURIComponent(url.split(/[?#]/, 1)[0]);
    const filename = path.resolve(publicRoot, `.${pathname}`);
    if (!filename.startsWith(`${publicRoot}${path.sep}`)) {
      skipped++;
      continue;
    }
    const { width, height, orientation } = imageSize(await readFile(filename));
    if (!width || !height) {
      skipped++;
      continue;
    }
    // Browsers apply EXIF rotations before calculating an image's aspect ratio.
    metadata[pathname] = orientation >= 5 && orientation <= 8 ? [height, width] : [width, height];
  } catch {
    // Existing missing or unsupported assets must not prevent a site build.
    skipped++;
  }
}

const json = `{\n${Object.entries(metadata).map(([url, size]) => `  ${JSON.stringify(url)}: ${JSON.stringify(size)}`).join(",\n")}\n}\n`;
// Avoid changing the file timestamp and triggering dev reloads when unchanged.
const previous = await readFile(outputPath, "utf8").catch(() => "");
if (previous !== json) await writeFile(outputPath, json);
console.log(`Article image metadata: ${Object.keys(metadata).length} images; ${skipped} skipped.`);
