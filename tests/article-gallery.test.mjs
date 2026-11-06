import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import sharp from 'sharp';
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

const { getAllArticles, getArticleRoute, toArticleListItem, getArticlePrimaryImage } = loadModule('lib/articles.ts');
const { categories } = loadModule('lib/articles-data.ts');
const { articleCovers, preservedArticleCovers, getArticleListCover } = loadModule('lib/article-covers.ts');
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
    assert.ok(image.length <= 25000, 'covers should remain lightweight');
  }
});

test('Nasdaq investment guide has its own list cover without adding a body cover', () => {
  const article = articles.find(item => item.id === 'nasdaq-investment-guide');
  assert.equal(getArticleRoute(article), '/articles/index/gCSTzdEB');
  assert.equal(toArticleListItem(article).coverImage, '/images/articles/covers/nasdaq-investment-guide.webp');
  assert.ok(!article.content.includes('/images/articles/covers/nasdaq-investment-guide.webp'));
  assert.ok(fs.existsSync(path.join(root, 'assets/source-images/article-covers/nasdaq-investment-guide.png')));
});

test('every dedicated cover is centralized, at most 25 KB, 640x360 and reaches list metadata', async () => {
  const uniqueSources = new Set();
  for (const [id, cover] of Object.entries(articleCovers)) {
    const article = articles.find(item => item.id === id);
    assert.ok(article, `Unknown article cover: ${id}`);
    assert.equal(toArticleListItem(article).coverImage, cover.src);
    assert.ok(cover.alt.length > 0);
    assert.ok(cover.topics.length > 0);
    assert.ok(!uniqueSources.has(cover.src), `Duplicate cover: ${cover.src}`);
    uniqueSources.add(cover.src);
    assert.equal(cover.src, `/images/articles/covers/${id}.webp`);
    const image = fs.readFileSync(path.join(root, 'public', cover.src));
    assert.equal(image.subarray(0, 4).toString(), 'RIFF');
    assert.equal(image.subarray(8, 12).toString(), 'WEBP');
    assert.ok(image.length <= 25000, `${id} cover is too large`);
    const metadata = await sharp(image).metadata();
    assert.equal(metadata.width, 640, `${id} thumbnail width`);
    assert.equal(metadata.height, 360, `${id} thumbnail height`);
  }
});

test('BIT uses dedicated list covers while keeping all instructional images and routes', () => {
  assert.deepEqual(Object.keys(preservedArticleCovers).sort(), ['bit-account-guide', 'bit-comparison']);
  const tutorials = [
    ['bit-account-guide', 'YgNQGO57', ['01-app-account', '02-web-account', '03-kyc', '04-usd-wire', '05-hkd-wire']],
    ['bit-comparison', 'AEXjQDo5', ['06-hkd-fees']],
  ];
  for (const [id, uid, screenshots] of tutorials) {
    const article = articles.find(item => item.id === id);
    assert.ok(article, `Missing BIT article: ${id}`);
    const cover = articleCovers[id];
    assert.equal(cover?.src, `/images/articles/covers/${id}.webp`);
    assert.ok(fs.existsSync(path.join(root, 'public', cover.src)));
    assert.equal(getArticleRoute(article), `/articles/broker/${uid}`);
    assert.equal(toArticleListItem(article).coverImage, cover.src);
    assert.ok(!article.content.includes(cover.src), `${id} must not repeat its list cover in the body`);
    assert.equal(preservedArticleCovers[id], `/content/articles/broker/BIT/${screenshots[0]}.webp`);
    for (const name of screenshots) {
      const src = `/content/articles/broker/BIT/${name}.webp`;
      assert.ok(article.content.includes(src), `${id} must retain instructional image: ${name}`);
      assert.ok(fs.existsSync(path.join(root, 'public', src)), `${id} instructional image must exist: ${name}`);
    }
  }
});

test('published articles, cover mappings and public thumbnails have matching identities', () => {
  for (const article of articles) {
    assert.equal(getArticleListCover(article.id), articleCovers[article.id]?.src, `Missing list cover: ${article.id}`);
  }
  assert.deepEqual(Object.keys(articleCovers).sort(), articles.map(article => article.id).sort());
  const publicFiles = fs.readdirSync(path.join(root, 'public/images/articles/covers'));
  assert.ok(publicFiles.every(file => file.endsWith('.webp')), 'Keep large PNG originals outside public');
  assert.deepEqual(publicFiles.sort(), Object.keys(articleCovers).map(id => `${id}.webp`).sort());
});

test('the five reported missing covers are repaired without changing their URLs', () => {
  const routes = {
    'us-guide': '/articles/domestic/carWp7d7',
    'bybit-guide': '/articles/crypto/e6utod7B',
    biyapay: '/articles/onchain/KewUM4Og',
    StockCoin: '/articles/onchain/YGkvEHeX',
    stablestock: '/articles/onchain/4OUbYina',
  };
  for (const [id, route] of Object.entries(routes)) {
    assert.ok(articleCovers[id]);
    assert.equal(getArticleRoute(articles.find(article => article.id === id)), route);
  }
});

test('all 26 new covers have reproducible prompts, archived originals and matching centralized metadata', () => {
  const refreshedIds = new Set();
  for (const group of ['priority', 'guides', 'cards', 'accounts', 'brokers']) {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, `docs/image-prompts/article-covers-${group}.json`), 'utf8'));
    for (const asset of manifest.assets ?? manifest.samples ?? manifest.covers) {
      assert.ok(!refreshedIds.has(asset.id), `Duplicate prompt asset: ${asset.id}`);
      refreshedIds.add(asset.id);
      assert.ok(asset.prompt.length > 100);
      assert.equal(articleCovers[asset.id].alt, asset.alt);
      assert.deepEqual(articleCovers[asset.id].topics, asset.topics);
      const file = fs.statSync(path.join(root, 'public', articleCovers[asset.id].src));
      assert.equal(file.size, asset.bytes ?? asset.webpBytes);
      assert.ok(fs.existsSync(path.join(root, `assets/source-images/article-covers/${asset.id}.png`)));
    }
  }
  assert.equal(refreshedIds.size, 26);
});

test('retired body covers stay out of articles while list covers and source images remain', () => {
  const retired = [
    ["biyapay","/content/articles/OnChain/Biyapay/0.webp"],
    ["stablestock","/content/articles/OnChain/StableStock/0.webp"],
    ["StockCoin","/content/articles/OnChain/StockCoin/0.jpeg"],
    ["SGB-register","/content/articles/bank/SGB/0.jpeg"],
    ["zhongan-intro","/content/articles/bank/众安介绍/00.webp"],
    ["pingan","/content/articles/bank/平安数字银行/0.webp"],
    ["jianhang","/content/articles/bank/建行亚洲/0.webp"],
    ["huili","/content/articles/bank/汇立银行/0.webp"],
    ["jianzheng","/content/articles/bank/见证开户/0.webp"],
    ["IBKR","/content/articles/broker/IBKR/1.png"],
    ["futu-broker","/content/articles/broker/fuxing/0.webp"],
    ["ifas-fuxing","/content/articles/broker/复星入金/0.webp"],
    ["tengda-broker","/content/articles/broker/腾达/0.webp"],
    ["bybit-guide","/content/articles/crypto/bybit/0.webp"],
    ["okx-guide","/content/articles/crypto/okx/0.webp"],
    ["us-guide","/content/articles/domestic/meigu/0.webp"],
    ["beesim-guide","/content/articles/simcard/Beesim/0.webp"],
    ["giffgaff-guide","/content/articles/simcard/giffgaff/0.webp"],
    ["xesim-guide","/content/articles/simcard/xesim/cover.webp"],
    ["Benpay-vcard","/content/articles/vcard/BenPay/0.jpeg"],
    ["StarryBlu-vcard","/content/articles/vcard/StarryBlu/0.png"],
    ["UUWallet-vcard","/content/articles/vcard/UUWallet/0.jpeg"],
  ];
  for (const [id, src] of retired) {
    const article = articles.find(item => item.id === id);
    assert.ok(article, id);
    assert.ok(!article.content.includes(src), `${id} must not repeat its old cover in the body`);
    assert.equal(toArticleListItem(article).coverImage, articleCovers[id].src);
    assert.ok(fs.existsSync(path.join(root, 'public', src)), `${id} original should remain archived`);
  }
});

test('instructional first images are retained, including BeeSIM comparison and Bitget process', () => {
  const preserved = [
    ['beesim-guide', '/content/articles/simcard/Beesim/1.jpeg'],
    ['bitget-vcard', '/content/articles/vcard/BitgetNew/0.jpeg'],
    ['web-guide', '/content/articles/web/1.jpeg'],
    ['VIP', '/content/articles/VIP/1.jpeg'],
  ];
  for (const [id, src] of preserved) {
    const article = articles.find(item => item.id === id);
    assert.ok(article?.content.includes(src), `${id} instructional image must remain`);
  }
});
test('list thumbnails are independent from article body illustrations and SEO image extraction', () => {
  const article = articles.find(item => item.id === 'bybit-guide');
  const changedBody = { ...article, content: '![An in-article screenshot](/content/example.png)' };
  assert.equal(toArticleListItem(changedBody).coverImage, articleCovers['bybit-guide'].src);
  assert.equal(getArticlePrimaryImage(changedBody), '/content/example.png');
  assert.equal(toArticleListItem({ ...changedBody, id: 'future-unmapped-article' }).coverImage, undefined);
  assert.equal(getArticleListCover('future-unmapped-article'), undefined);
  for (const id of ['constructor', '__proto__', 'toString']) {
    assert.equal(getArticleListCover(id), undefined);
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

test('category SSR retains all six crypto articles but never serializes article bodies', async () => {
  const props = browserProps(await renderCategory('crypto'));
  assert.equal(props.initialCategoryId, 'crypto');
  assert.equal(props.initialArticles.filter(article => article.categoryId === 'crypto').length, 6);
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
  assert.deepEqual(
    props.initialArticles.filter(article => article.categoryId === 'strategy').map(article => article.id),
    articles.filter(article => article.categoryId === 'strategy').map(article => article.id),
  );
  // Explicitly exercise an empty category, independent of newly published articles.
  categories.push({ id: 'empty-test-category', name: 'Empty test category', emoji: '' });
  try {
    const empty = browserProps(await renderCategory('empty-test-category'));
    assert.equal(empty.initialCategoryId, 'empty-test-category');
    assert.equal(empty.initialArticles.filter(article => article.categoryId === 'empty-test-category').length, 0);
  } finally {
    categories.pop();
  }
  await assert.rejects(renderCategory('missing'), /not found/);
});

test('recommended, all-articles and series views receive public metadata only', async () => {
  for (const view of [undefined, 'all', 'series', 'unknown']) {
    const tree = await indexPage.default({ searchParams: Promise.resolve({ view }) });
    assert.equal(tree.props.showAllArticles, view === 'all');
    assert.equal(tree.props.showSeries, view === 'series');
    assert.equal(tree.props.initialArticles.length, articles.length);
    assert.ok(tree.props.initialArticles.every(article => !Object.hasOwn(article, 'content')));
  }
});
