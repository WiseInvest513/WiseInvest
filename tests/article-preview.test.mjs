import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const modules = new Map();
let viewerTier = null;
let identityReads = 0;
let failIdentity = false;
const ArticlesContent = () => null;
const jsx = (type, props) => ({ type, props });

// Exercise the real page/API and article files, with all identity/DB calls isolated.
function loadModule(relativePath) {
  const filename = path.join(root, relativePath);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const requireMock = (name) => {
    if (name === 'fs') return fs;
    if (name === 'path') return path;
    if (name === 'next/cache') return { unstable_cache: (callback) => callback };
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'fragment' };
    if (name === 'next/navigation') return { notFound: () => { throw new Error('not found'); } };
    if (name === 'next/server') return { NextResponse: { json: (body, init) => ({ body, ...init }), next: () => ({ kind: 'next' }), redirect: (url) => ({ kind: 'redirect', url: String(url) }) } };
    if (name === '@/app/articles/articles-content') return { ArticlesContent };
    if (name === '@/lib/identity/content-viewer') return { getContentViewerTier: async () => { identityReads++; if (failIdentity) throw new Error('Identity unavailable'); return viewerTier; } };
    if (name === '@/lib/prisma') return {
      isDatabaseConfigured: () => false,
      getPrisma: () => { throw new Error('Tests must never access a database'); },
    };
    if (name.startsWith('@/') || name.startsWith('.')) {
      const resolved = name.startsWith('@/')
        ? path.join(root, name.slice(2))
        : path.resolve(path.dirname(filename), name);
      const file = ['.ts', '.tsx'].map(extension => resolved + extension).find(candidate => fs.existsSync(candidate));
      if (file) return loadModule(path.relative(root, file));
    }
    throw new Error(`Unexpected dependency: ${name}`);
  };
  new Function('require', 'module', 'exports', compiled)(requireMock, module, module.exports);
  return module.exports;
}

const { createArticlePreview, getArticlePreviewPercentage } = loadModule('lib/article-preview.ts');
const { createContentPreview, canReadContentAccess, getContentAccessRule } = loadModule('lib/content-access.ts');
const { getAllArticles, getArticleRoute } = loadModule('lib/articles.ts');
const page = loadModule('app/articles/[categoryId]/[uid]/page.tsx');
const api = loadModule('app/api/articles-fs/route.ts');
const accessApi = loadModule('app/api/content-access/check/route.ts');
const { middleware } = loadModule('middleware.ts');
const articles = getAllArticles();
const journal = articles.find(article => article.id === 'VIP001');
const trial = createArticlePreview(journal);
const secretEnding = '真正做成一个属于自己的丰收之年';

test('VIP001 gets a complete-block prefix close to 35%, with the remaining text absent', () => {
  assert.equal(getArticleRoute(journal), '/articles/VIP/WGa8Mm2t');
  assert.equal(getArticlePreviewPercentage(journal), 35);
  assert.ok(trial.length / journal.content.length > 0.33);
  assert.ok(trial.length / journal.content.length <= 0.35);
  assert.ok(journal.content.startsWith(trial));
  assert.match(journal.content.slice(trial.length), /^\s*\n\s*\n/);
  assert.ok(!trial.includes(secretEnding));
  assert.ok(!trial.includes('## 六、'));
});

test('all other articles preserve their existing preview behavior', () => {
  for (const article of articles.filter(item => item.id !== journal.id && !(item.id === 'VIP002' && item.categoryId === 'VIP'))) {
    assert.equal(getArticlePreviewPercentage(article), undefined);
    assert.equal(createArticlePreview(article), createContentPreview(article.content), article.id);
  }
  assert.equal(getArticlePreviewPercentage({ id: 'VIP001', categoryId: 'crypto' }), undefined);
});

function fixtureAtBoundary(prefix, cutoff) {
  const length = Math.ceil(cutoff / 0.35);
  return { id: 'VIP001', categoryId: 'VIP', content: prefix + 'Z'.repeat(length - prefix.length) };
}

test('a cutoff inside a fenced code block retreats to the previous complete paragraph', () => {
  for (const fence of ['```', '~~~~']) {
    const intro = '# Sample\n\nIntro paragraph.\n\n';
    const code = `${fence}js\nconst first = 1;\n\nconst second = 2;\n${fence}\n\n`;
    const source = intro + code;
    const article = fixtureAtBoundary(source, source.indexOf('const second'));
    assert.equal(createArticlePreview(article), intro.trimEnd());
  }
});

test('a complete fenced block is preserved, and standalone headings are not left at the end', () => {
  const intro = '# Sample\n\nIntro paragraph.\n\n';
  const code = '```js\nconst first = 1;\n\nconst second = 2;\n```\n\n';
  assert.equal(createArticlePreview(fixtureAtBoundary(intro + code, (intro + code).length)), (intro + code).trimEnd());
  const heading = '## Next section\n\n';
  assert.equal(createArticlePreview(fixtureAtBoundary(intro + heading, (intro + heading).length)), intro.trimEnd());
});

test('every published article renders its complete body to guests in SSR and JSON', async () => {
  viewerTier = null;
  failIdentity = true;
  identityReads = 0;
  const response = await api.GET();
  assert.equal(response.headers['Cache-Control'], 'no-store');
  assert.equal(response.body.length, articles.length);
  assert.ok(articles.length >= 91);
  for (const article of articles) {
    const route = getArticleRoute(article);
    const tree = await page.default({ params: Promise.resolve({ categoryId: article.categoryId, uid: route.split('/').at(-1) }) });
    const props = tree.props.children.find(child => child.type === ArticlesContent).props;
    assert.equal(getContentAccessRule(route).access, 'PUBLIC', article.id);
    assert.equal(props.initialArticle.content, article.content, article.id);
    assert.deepEqual(props.initialArticle.guideProfile, article.guideProfile);
    assert.equal(props.lockedContent, undefined);
    assert.equal(props.limitedRelease, undefined);
    assert.ok(props.initialArticles.every(item => !Object.hasOwn(item, 'content')));
    assert.ok(props.initialArticles.every(item => !Object.hasOwn(item, 'guideProfile')));
    assert.equal(response.body.find(item => item.id === article.id).content, article.content);
    for (const href of [route, `https://www.wise-invest.org${route}?series=example#h-0`]) {
      const access = await accessApi.GET({ nextUrl: new URL('http://localhost/api/content-access/check?href=' + encodeURIComponent(href)) });
      assert.equal(access.body.allowed, true);
      assert.equal(access.body.access, 'PUBLIC');
    }
  }
  assert.equal(identityReads, 0, 'public reading must not depend on auth/session availability');
  failIdentity = false;
});

test('members and VIP readers receive the same full body as guests', async () => {
  for (const tier of [null, 'MEMBER', 'VIP', 'VIP_PLUS']) {
    viewerTier = tier;
    const tree = await page.default({ params: Promise.resolve({ categoryId: 'VIP', uid: 'WGa8Mm2t' }) });
    const props = tree.props.children.find(child => child.type === ArticlesContent).props;
    assert.equal(props.initialArticle.content, journal.content);
    assert.ok(props.initialArticle.content.includes(secretEnding));
    assert.equal(props.lockedContent, undefined);
  }
});

test('series and map-route context survive without a login wall', async () => {
  viewerTier = null;
  for (const [id, series, route] of [
    ['biance-guide', 'binance'],
    ['ifast-guide', 'us-stock-funding', 'traditional-us-stocks'],
    ['binance-referral', 'exchange-referral'],
    ['bitget-referral', 'exchange-referral'],
  ]) {
    const article = articles.find(item => item.id === id);
    const uid = getArticleRoute(article).split('/').at(-1);
    for (const requestedSeries of [undefined, series]) {
      const tree = await page.default({ params: Promise.resolve({ categoryId: article.categoryId, uid }), searchParams: Promise.resolve({ series: requestedSeries, route }) });
      const props = tree.props.children.find(child => child.type === ArticlesContent).props;
      if (requestedSeries) assert.equal(props.initialSeriesId, series);
      assert.equal(props.initialMapRouteId, route);
      assert.equal(props.initialArticle.content, article.content);
      assert.equal(props.lockedContent, undefined);
      assert.equal(props.limitedRelease, undefined);
    }
  }
});

test('unrelated series parameters do not create a fake learning path', async () => {
  const tree = await page.default({ params: Promise.resolve({ categoryId: 'VIP', uid: 'WGa8Mm2t' }), searchParams: Promise.resolve({ series: 'overseas' }) });
  const props = tree.props.children.find(child => child.type === ArticlesContent).props;
  assert.equal(props.initialSeriesId, undefined);
  assert.equal(props.initialArticle.content, journal.content);
});

test('anonymous account and admin routes remain protected while articles stay public', () => {
  for (const pathname of ['/articles/crypto/2WaKMVIz', '/articles/VIP/WGa8Mm2t', '/articles/series/exchange-referral', '/account', '/admin/content', '/roadmap/private-route']) {
    const result = middleware({ url: 'http://localhost' + pathname, nextUrl: new URL('http://localhost' + pathname), cookies: { get: () => undefined } });
    assert.equal(result.kind, pathname.startsWith('/articles/') ? 'next' : 'redirect');
    if (result.kind === 'redirect') assert.equal(new URL(result.url).pathname, '/login');
  }
});
