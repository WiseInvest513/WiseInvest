#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRepository } from './lib/article-validation.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const files = [];
let strict = false, json = false;
for (let index = 0; index < args.length; index++) {
  if (args[index] === '--strict') strict = true;
  else if (args[index] === '--json') json = true;
  else if (args[index] === '--file' && args[index + 1] && !args[index + 1].startsWith('--')) files.push(args[++index]);
  else {
    console.error('用法：node scripts/validate-articles.mjs [--strict] [--file content/articles/.../article.md] [--json]');
    process.exit(2);
  }
}
const result = validateRepository(root, { strict, ...(files.length ? { files } : {}) });
if (json) console.log(JSON.stringify(result, null, 2));
else {
  console.log(`文章校验：${result.articleCount} 篇，${result.errors.length} 个错误，${result.warnings.length} 个提示。`);
  for (const item of [...result.errors, ...result.warnings]) console.log(`[${item.severity === 'error' ? '阻止发布' : '需复核'}] ${path.relative(root, item.file)} ${item.code}: ${item.message}`);
  console.log('只检查可机器验证的规则，不自动改稿；事实、福利、图片标识及导读与正文的语义一致性仍需逐篇审阅。');
}
process.exitCode = result.errors.length ? 1 : 0;
