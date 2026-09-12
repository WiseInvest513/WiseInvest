import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const raw = fs.readFileSync(path.join(root, 'content/articles/VIP/002.md'), 'utf8');
const module = { exports: {} };
const compiled = ts.transpileModule(fs.readFileSync(path.join(root, 'lib/articles-fs.ts'), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
new Function('require', 'module', 'exports', 'process', compiled)(name => {
  if (name === 'fs') return fs;
  if (name === 'path') return path;
  throw new Error(`Unexpected dependency: ${name}`);
}, module, module.exports, { cwd: () => root });
const articles = module.exports.loadFsArticles();
const article = articles.find(item => item.id === 'VIP002');

test('the new journal loads once under VIP with the supplied title and date', () => {
  assert.ok(article);
  assert.equal(articles.filter(item => item.id === 'VIP002').length, 1);
  assert.equal(article.title, '从加息预期、政策落地到经济变化，理解美股、BTC和黄金背后的交易机会');
  assert.equal(article.categoryId, 'VIP');
  assert.equal(article.basePath, 'VIP');
  assert.equal(article.date, '2026-09-12');
  assert.equal(article.readTime, 40);
  assert.match(raw, /^---\nid: VIP002\n/);
});

test('seven main sections and 25 subheadings support the existing article TOC', () => {
  const headings = [...article.content.matchAll(/^## (.+)$/gm)].map(match => match[1]);
  assert.equal(headings.length, 7);
  assert.deepEqual(headings.map(heading => heading.slice(0, 2)), ['一、', '二、', '三、', '四、', '五、', '六、', '七、']);
  assert.equal([...article.content.matchAll(/^### (.+)$/gm)].length, 25);
  assert.doesNotMatch(article.content, /^# /m, 'The page renders the supplied title as its single article H1');
  assert.match(article.content, /^### 4．拿2022年5月完整复盘一次/m);
  assert.match(article.content, /^### 情景四：没有加息/m);
});

test('the opening date note, core framework and final disclaimer are intact single-block quotes', () => {
  const quotes = [...article.content.matchAll(/^> (.+)$/gm)].map(match => match[1]);
  assert.equal(quotes.length, 3);
  assert.equal(quotes[0], '本文数据截至2026年9月12日。涉及本次议息会议的判断属于会前分析，政策预期和市场价格仍会变化。');
  assert.match(quotes[1], /会前看预期如何变化，会议看实际信息与预期的差别，会后看经济和盈利如何兑现/);
  assert.equal(quotes[2], '本文用于投资研究与交流。文中的情景推演不构成收益保证，历史表现也不能保证未来结果。');
});

test('selective emphasis uses balanced renderable Markdown, without shortening the full article', () => {
  const phrases = [...article.content.matchAll(/\*\*([^*\n]+)\*\*/g)].map(match => match[1]);
  assert.ok(phrases.length >= 35);
  assert.equal((article.content.match(/\*\*/g) || []).length, phrases.length * 2);
  assert.ok(phrases.includes('人就赚自己看得懂的钱。'));
  assert.ok(phrases.includes('没有交易，也可以是一次完整分析之后的结果。'));
  assert.ok(article.content.length > 13000);
  assert.match(article.content, /希望各位朋友能够把这套方法慢慢用起来/);
  assert.doesNotMatch(article.content, /TODO|待补充|!\[/);
});

test('the public VIP introduction and first journal remain separate existing articles', () => {
  assert.equal(articles.find(item => item.id === 'VIP').categoryId, 'VIP');
  assert.equal(articles.find(item => item.id === 'VIP001').date, '2026-09-05');
});
