import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const markdownPath = path.join(root, 'content/articles/PREDICT/predict.md');
const markdown = fs.readFileSync(markdownPath, 'utf8');
const moduleCache = new Map();
const localDependencies = new Map([
  ['./article-uid', 'lib/article-uid.ts'],
  ['./articles-data', 'lib/articles-data.ts'],
  ['./articles-fs', 'lib/articles-fs.ts'],
]);

// Exercise the production article loader and catalogue with no network, database,
// identity, or UI setup. New dependencies must be deliberately reviewed here.
function loadLocalModule(relativePath) {
  if (moduleCache.has(relativePath)) return moduleCache.get(relativePath);
  const compiled = ts.transpileModule(fs.readFileSync(path.join(root, relativePath), 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} };
  const localRequire = name => {
    if (name === 'fs') return fs;
    if (name === 'path') return path;
    const dependency = localDependencies.get(name);
    if (dependency) return loadLocalModule(dependency);
    throw new Error(`Unexpected dependency in filesystem-only prediction article test: ${name}`);
  };
  new Function('require', 'module', 'exports', 'process', compiled)(
    localRequire, module, module.exports, { cwd: () => root },
  );
  moduleCache.set(relativePath, module.exports);
  return module.exports;
}

function walkMarkdown(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkMarkdown(filename);
    return entry.isFile() && /\.mdx?$/.test(entry.name) ? [filename] : [];
  });
}

const { loadFsArticles } = loadLocalModule('lib/articles-fs.ts');
const { genUid } = loadLocalModule('lib/article-uid.ts');
const { categories, subcategories } = loadLocalModule('lib/articles-data.ts');
const { getAllArticles, getArticleByRoute, getArticleRoute, getArticleFaqs, getArticleSeoKeywords } = loadLocalModule('lib/articles.ts');
const { getPerks2Section } = loadLocalModule('app/perk/data.ts');
const articles = loadFsArticles();
const article = articles.find(item => item.id === 'predict');

test('the prediction article loads from its real Markdown as a top-level category article', () => {
  assert.ok(article, 'The prediction Markdown must be discoverable by loadFsArticles');
  assert.equal(article.categoryId, 'predict');
  assert.equal(article.subcategoryId, undefined);
  assert.equal(article.basePath, 'PREDICT');
  assert.equal(article.date, '2026-09-20');
  assert.ok(article.title.trim().length > 0);
  assert.ok(article.summary.trim().length > 0);
  assert.ok(Number.isInteger(article.readTime) && article.readTime > 0);
  assert.match(markdown, /^---\r?\nid: predict\r?\n/);
  assert.equal(getAllArticles().find(item => item.id === 'predict')?.content, article.content);
});

test('the prediction article has a unique source ID and a working unique canonical UID route', () => {
  const uid = genUid('predict');
  assert.match(uid, /^[a-zA-Z0-9]{8}$/);
  assert.equal(getArticleRoute(article), `/articles/predict/${uid}`);
  assert.equal(getArticleByRoute('predict', uid)?.id, article.id);
  assert.deepEqual(getAllArticles().filter(item => genUid(item.id) === uid).map(item => item.id), ['predict']);

  // The production loader deduplicates IDs; inspect sources too so a duplicate
  // cannot silently disappear and make a route-collision test pass.
  const matchingSources = walkMarkdown(path.join(root, 'content/articles')).filter(filename => {
    const source = fs.readFileSync(filename, 'utf8');
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1] ?? '';
    return /^id:\s*["']?predict["']?\s*$/m.test(frontmatter);
  });
  assert.deepEqual(matchingSources, [markdownPath]);
});

test('prediction markets appear immediately after crypto without removing or changing earlier categories', () => {
  const originalCategories = [
    { id: 'web', name: 'Wise 网站', emoji: '🌐' },
    { id: 'VIP', name: 'VIP', emoji: '🌟' },
    { id: 'domestic', name: '国内理财', emoji: '🇨🇳' },
    { id: 'crypto', name: '加密货币', emoji: '🪙' },
    { id: 'broker', name: '券商开户', emoji: '🏛️' },
    { id: 'bank', name: '银行账户', emoji: '💳' },
    { id: 'simcard', name: '手机套餐', emoji: '📱' },
    { id: 'ai', name: 'AI 工具', emoji: '⚡' },
    { id: 'vcard', name: '虚拟U卡', emoji: '💰' },
    { id: 'index', name: '指数投资', emoji: '📈' },
    { id: 'onchain', name: 'OnChain 美股', emoji: '⛓️' },
    { id: 'strategy', name: '投资策略', emoji: '🧭' },
    { id: 'outside', name: '出海必备', emoji: '✈️' },
  ];
  assert.deepEqual(categories.filter(category => category.id !== 'predict'), originalCategories);
  assert.deepEqual(categories.filter(category => category.id === 'predict'), [
    { id: 'predict', name: '预测市场', emoji: '🔮' },
  ]);
  assert.equal(categories.findIndex(category => category.id === 'predict'),
    categories.findIndex(category => category.id === 'crypto') + 1);
  assert.equal(subcategories.some(category => category.categoryId === 'predict'), false);
});

test('article section headings retain a usable Markdown table-of-contents hierarchy', () => {
  const headings = [...article.content.matchAll(/^(#{1,6})\s+(.+)$/gm)];
  assert.ok(headings.some(([, level]) => level === '##'), 'Use primary article sections');
  assert.ok(headings.some(([, level]) => level === '###'), 'Use subsections for the longer guide');
  assert.equal(headings[0]?.[1], '##', 'The first body heading starts at level 2');
  let previousLevel = 1;
  for (const [, marker, title] of headings) {
    assert.ok(marker.length >= 2, 'The page already renders the frontmatter title');
    assert.ok(marker.length <= previousLevel + 1, `Skipped heading level: ${title}`);
    assert.ok(title.trim().length > 0);
    previousLevel = marker.length;
  }
});

test('every prediction image resolves to a nonempty static file under public', () => {
  const images = [...article.content.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)];
  assert.equal(images.length, 12, 'The tutorial should retain all twelve supplied screenshots');
  for (const [, caption, url] of images) {
    assert.ok(caption.trim().length > 0, `Missing image caption: ${url}`);
    assert.match(url, /^\/content\/articles\/PREDICT\//);
    assert.doesNotMatch(url, /(?:^|\/)\.\.(?:\/|$)/);
    const publicFile = path.join(root, 'public', decodeURIComponent(url.slice(1)));
    const stat = fs.statSync(publicFile);
    assert.ok(stat.isFile(), `Missing public image: ${url}`);
    assert.ok(stat.size > 0, `Empty public image: ${url}`);
    assert.equal(fs.existsSync(path.join(root, decodeURIComponent(url.slice(1)))), false,
      `Keep static images out of the server content directory: ${url}`);
  }
  assert.doesNotMatch(article.content, /!\[[^\]]*\]\(\.\//);
  assert.doesNotMatch(article.content, /\/api\/content\/articles\//);
  assert.doesNotMatch(article.content, /\*\*\[[^\]]+\]\([^)]+\)\*\*/,
    'The custom renderer does not parse clickable Markdown links inside bold spans');
});

test('all six exchange registration links and invitation codes match the live repository catalogue', () => {
  const cex = getPerks2Section('crypto').subcategories.find(category => category.slug === 'uex-exchange');
  const links = [...article.content.matchAll(/(?<!!)\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)]
    .map(([, label, url]) => ({ label, url }));
  for (const id of ['binance', 'bybit', 'bitget', 'okx', 'weex', 'gate']) {
    const product = cex.products.find(item => item.id === id);
    assert.ok(product, `Missing exchange in perk catalogue: ${id}`);
    assert.ok(links.some(link => link.url === product.registerLink),
      `Missing or stale ${id} registration URL in article Markdown`);
    assert.ok(article.content.includes(product.code), `Missing current ${id} invitation code`);
  }
});

test('prediction-specific SEO keywords and FAQ do not fall back to unrelated article topics', () => {
  const keywords = getArticleSeoKeywords(article);
  assert.ok(keywords.includes('预测市场'));
  assert.ok(keywords.includes('Predict.fun'));
  assert.ok(keywords.includes('BTC 5 分钟预测'));
  const faqs = getArticleFaqs(article);
  assert.ok(faqs.length > 0);
  assert.ok(faqs.some(item => item.question.includes('预测市场')));
  assert.ok(faqs.some(item => item.answer.includes('地区限制')));
  const categoryPage = fs.readFileSync(path.join(root, 'app/articles/[categoryId]/page.tsx'), 'utf8');
  const categorySeo = categoryPage.match(/\bpredict: \{[\s\S]*?\n  \}/)?.[0];
  assert.ok(categorySeo, 'The category landing page needs prediction-market SEO');
  assert.match(categorySeo, /title: ".*预测市场/);
  assert.match(categorySeo, /description: ".*预测市场/);
});
