import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const modules = new Map();
const ArticlesContent = () => null;
const jsx = (type, props) => ({ type, props });

function loadModule(relativePath) {
  const filename = path.join(root, relativePath);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const requireMock = (name) => {
    if (name === 'fs') return fs;
    if (name === 'path') return path;
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'fragment' };
    if (name === 'next/navigation') return { notFound: () => { throw new Error('not found'); } };
    if (name.endsWith('/articles-content') || name === './articles-content') return { ArticlesContent };
    const resolved = name.startsWith('@/') ? path.join(root, name.slice(2)) : path.resolve(path.dirname(filename), name);
    const file = ['.ts', '.tsx'].map(extension => resolved + extension).find(candidate => fs.existsSync(candidate));
    if (file) return loadModule(path.relative(root, file));
    throw new Error(`Unexpected dependency: ${name}`);
  };
  new Function('require', 'module', 'exports', compiled)(requireMock, module, module.exports);
  return module.exports;
}

const { getAllArticles, getArticleRoute, toArticleListItem } = loadModule('lib/articles.ts');
const { categories } = loadModule('lib/articles-data.ts');
const { articleCovers } = loadModule('lib/article-covers.ts');
const categoryPage = loadModule('app/articles/[categoryId]/page.tsx');
const indexPage = loadModule('app/articles/page.tsx');
const articles = getAllArticles();
const renderCategory = (categoryId, subcategory) => categoryPage.default({ params: Promise.resolve({ categoryId }), searchParams: Promise.resolve({ subcategory }) });
const browserProps = tree => tree.props.children.find(child => child.type === ArticlesContent).props;

test('pilot covers point to real WebP assets and preserve existing article URLs', () => {
  for (const [id, uid] of [['biance-guide', 'GaM38JYk'], ['okx-guide', 'mAPQm7WZ']]) {
    const article = articles.find(item => item.id === id);
    assert.equal(getArticleRoute(article), `/articles/crypto/${uid}`);
    const item = toArticleListItem(article);
    assert.equal(item.coverImage, articleCovers[id].src);
    const image = fs.readFileSync(path.join(root, 'public', item.coverImage));
    assert.equal(image.subarray(0, 4).toString(), 'RIFF');
    assert.equal(image.subarray(8, 12).toString(), 'WEBP');
    assert.ok(image.length < 150000, 'covers should remain lightweight');
  }
});

test('every dedicated cover belongs to an article, exists as a lightweight WebP and reaches list metadata', () => {
  const uniqueSources = new Set();
  for (const [id, cover] of Object.entries(articleCovers)) {
    const article = articles.find(item => item.id === id);
    assert.ok(article, `Unknown article cover: ${id}`);
    assert.equal(toArticleListItem(article).coverImage, cover.src);
    assert.ok(cover.alt.length > 0);
    assert.ok(cover.topics.length > 0);
    assert.ok(!uniqueSources.has(cover.src), `Duplicate cover: ${cover.src}`);
    uniqueSources.add(cover.src);
    const image = fs.readFileSync(path.join(root, 'public', cover.src));
    assert.equal(image.subarray(0, 4).toString(), 'RIFF');
    assert.equal(image.subarray(8, 12).toString(), 'WEBP');
    assert.ok(image.length < 150000, `${id} cover is too large`);
  }
});

test('missing, broken and yellow-text covers all have dedicated replacements with unchanged routes', () => {
  const expected = {
    VIP002: '/articles/VIP/Kcr8I81t',
    VIP001: '/articles/VIP/WGa8Mm2t',
    'google-id': '/articles/outside/qGuejeoD',
    'index-qa-2': '/articles/index/eq4k5aIU',
    'ifast-guide': '/articles/bank/AARzryKJ',
    zhifu: '/articles/broker/GaobLP0X',
    jiaxin: '/articles/broker/MWyWMwwN',
    'aomenmayi-register': '/articles/bank/oYC1uLNW',
  };
  for (const [id, route] of Object.entries(expected)) {
    const article = articles.find(item => item.id === id);
    assert.ok(articleCovers[id], `Missing replacement: ${id}`);
    assert.equal(getArticleRoute(article), route);
    assert.ok(!Object.hasOwn(toArticleListItem(article), 'content'));
  }
});

test('saved prompt set and cover mappings agree on every refreshed asset', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs/article-cover-prompts.json'), 'utf8'));
  assert.equal(manifest.assets.length, 30);
  assert.equal(new Set(manifest.assets.map(asset => asset.id)).size, 30);
  assert.deepEqual(Object.fromEntries(['missing', 'broken', 'yellow-text', 'body-image'].map(reason => [reason, manifest.assets.filter(asset => asset.reason === reason).length])), {
    missing: 4, broken: 1, 'yellow-text': 3, 'body-image': 22,
  });
  for (const asset of manifest.assets) assert.equal(articleCovers[asset.id].src, asset.src);
});

test('category SSR retains all four crypto articles but never serializes article bodies', async () => {
  const props = browserProps(await renderCategory('crypto'));
  assert.equal(props.initialCategoryId, 'crypto');
  assert.equal(props.initialArticles.filter(article => article.categoryId === 'crypto').length, 4);
  assert.ok(props.initialArticles.every(article => !Object.hasOwn(article, 'content')));
  assert.ok(props.initialArticles.every(article => !Object.hasOwn(article, 'lockedContent')));
});

test('subcategory links resolve only within their owning category', async () => {
  assert.equal(browserProps(await renderCategory('bank', 'digital-bank')).initialSubcategoryId, 'digital-bank');
  assert.equal(browserProps(await renderCategory('crypto', 'digital-bank')).initialSubcategoryId, undefined);
});

test('every visible category has a route, including empty categories; unknown categories still 404', async () => {
  assert.deepEqual(categoryPage.generateStaticParams(), categories.map(category => ({ categoryId: category.id })));
  const props = browserProps(await renderCategory('strategy'));
  assert.equal(props.initialCategoryId, 'strategy');
  assert.equal(props.initialArticles.filter(article => article.categoryId === 'strategy').length, 0);
  await assert.rejects(renderCategory('missing'), /not found/);
});

test('all-articles and recommended views receive public metadata only', async () => {
  for (const view of [undefined, 'all']) {
    const tree = await indexPage.default({ searchParams: Promise.resolve({ view }) });
    assert.equal(tree.props.showAllArticles, view === 'all');
    assert.equal(tree.props.initialArticles.length, articles.length);
    assert.ok(tree.props.initialArticles.every(article => !Object.hasOwn(article, 'content')));
  }
});
