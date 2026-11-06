#!/usr/bin/env node

// Read-only editorial audit. Run manually; findings never block builds or rewrite drafts.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const cache = new Map();
function load(relativePath) {
  const filename = path.join(root, relativePath);
  if (cache.has(filename)) return cache.get(filename);
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", compiled)(require, module, module.exports);
  cache.set(filename, module.exports);
  return module.exports;
}

// The real loader uses process.cwd() to locate articles; match the app's project root.
process.chdir(root);
const { loadFsArticles } = load("lib/articles-fs.ts");
const { articles: fallbackArticles } = load("lib/articles-data.ts");
const { articleCovers } = load("lib/article-covers.ts");
const fsArticles = loadFsArticles();
const fsIds = new Set(fsArticles.map(article => article.id));
const articles = [...fallbackArticles.filter(article => !fsIds.has(article.id)), ...fsArticles];
const normalize = value => (value ?? "").normalize("NFKC").replace(/[\s\p{P}\p{S}]+/gu, "").toLowerCase();
const findings = articles.flatMap(article => {
  const issues = [];
  const cover = articleCovers[article.id];
  if (!cover) issues.push("缺少独立列表封面");
  else if (!fs.existsSync(path.join(root, "public", cover.src.replace(/^\//, "")))) issues.push("已配置的封面文件不存在");
  if (!normalize(article.summary)) issues.push("摘要为空");
  else if (normalize(article.summary) === normalize(article.title)) issues.push("摘要与标题重复");
  return issues.length ? [{ id: article.id, title: article.title, issues }] : [];
});
const result = { articleCount: articles.length, findingCount: findings.length, findings };
if (process.argv.includes("--json")) console.log(JSON.stringify(result, null, 2));
else {
  console.log(`文章列表元信息：检查 ${articles.length} 篇，${findings.length} 篇需要检查。`);
  for (const finding of findings) console.log(`- ${finding.id}：${finding.issues.join("；")}（${finding.title}）`);
  console.log("仅供发布前人工审阅，不修改文章或图片，不作为构建门禁。");
}
