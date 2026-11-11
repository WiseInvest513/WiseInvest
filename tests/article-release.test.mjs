import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test, { beforeEach } from 'node:test';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const deadline = Date.parse('2026-09-14T00:00:00+08:00');
const modules = new Map();
let now = deadline - 1;
let viewerTier = null;
let databaseConfigured = false;
let permissions = [];
let databaseFailure = false;
let afterIdentityLookup;
let afterPermissionLookup;
const ArticlesContent = () => null;
const jsx = (type, props) => ({ type, props });
class RequestDate extends Date {
  static now() { return now; }
}

// Transpile real server modules while isolating identity/DB and injecting a
// request clock. No global clock mutation, real users, or database writes.
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
    if (name === 'next/server') return { NextResponse: { json: (body, init) => ({ body, ...init }) } };
    if (name === '@/app/articles/articles-content') return { ArticlesContent };
    if (name === '@/lib/identity/content-viewer') return {
      getContentViewerTier: async () => {
        // Let the permissions promise resolve before this lookup when requested.
        await Promise.resolve();
        await Promise.resolve();
        afterIdentityLookup?.();
        return viewerTier;
      },
    };
    if (name === '@/lib/prisma') return {
      isDatabaseConfigured: () => databaseConfigured,
      getPrisma: () => ({ contentPermission: {
        findMany: async () => {
          afterPermissionLookup?.();
          if (databaseFailure) throw new Error('Simulated unavailable database');
          return permissions;
        },
      } }),
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
  new Function('require', 'module', 'exports', 'Date', compiled)(requireMock, module, module.exports, RequestDate);
  return module.exports;
}

const { getArticleRelease, getArticleReleaseForPath, getArticleReleaseAccessRule } = loadModule('lib/article-release.ts');
const { getAllArticles, getArticleRoute } = loadModule('lib/articles.ts');
const { createArticlePreview, getArticlePreviewPercentage } = loadModule('lib/article-preview.ts');
const { getContentAccessRule } = loadModule('lib/content-access.ts');
const { getResolvedContentAccessRules } = loadModule('lib/content-access-server.ts');
const page = loadModule('app/articles/[categoryId]/[uid]/page.tsx');
const api = loadModule('app/api/articles-fs/route.ts');
const article = getAllArticles().find(item => item.id === 'VIP002' && item.categoryId === 'VIP');
assert.ok(article, 'The new VIP002 article must exist');
const articlePath = getArticleRoute(article);
const uid = articlePath.split('/').at(-1);
const preview = createArticlePreview(article);
const secretEnding = '希望各位朋友能够把这套方法慢慢用起来';
assert.ok(article.content.includes(secretEnding));

beforeEach(() => {
  now = deadline - 1;
  viewerTier = null;
  databaseConfigured = false;
  permissions = [];
  databaseFailure = false;
  afterIdentityLookup = undefined;
  afterPermissionLookup = undefined;
});

test('historical release metadata ends precisely at Sunday 24:00 Beijing and only applies to VIP002', () => {
  assert.equal(new Date(deadline).toISOString(), '2026-09-13T16:00:00.000Z');
  assert.deepEqual(getArticleRelease(article), {
    endsAt: '2026-09-14T00:00:00+08:00', previewPercentage: 30,
  });
  assert.deepEqual(getArticleReleaseForPath(articlePath), getArticleRelease(article));
  assert.equal(getArticleReleaseAccessRule(articlePath, deadline - 1).access, 'PUBLIC');
  assert.equal(getArticleReleaseAccessRule(articlePath, deadline).access, 'VIP');
  assert.equal(getArticleReleaseAccessRule(articlePath, deadline + 1).access, 'VIP');
  for (const item of [
    { id: 'VIP', categoryId: 'VIP' },
    { id: 'VIP001', categoryId: 'VIP' },
    { id: 'VIP002', categoryId: 'crypto' },
  ]) assert.equal(getArticleRelease(item), undefined);
  assert.equal(getArticleReleaseForPath('/articles/crypto/' + uid), undefined);
  assert.equal(getArticleReleaseForPath(articlePath + '-other'), undefined);
});

test('VIP002 preview is the first 30%, ending at a complete block, not a leaked suffix', () => {
  assert.equal(getArticlePreviewPercentage(article), 30);
  assert.ok(preview.length / article.content.length > 0.27);
  assert.ok(preview.length / article.content.length <= 0.30);
  assert.ok(article.content.startsWith(preview));
  assert.match(article.content.slice(preview.length), /^\s*\n\s*\n/);
  assert.ok(!preview.includes(secretEnding));
  assert.ok(!/^#{1,6}\s/.test(preview.split(/\n\s*\n/).at(-1)));
  assert.equal(getArticlePreviewPercentage({ id: 'VIP001', categoryId: 'VIP' }), 35);
  assert.equal(getArticlePreviewPercentage({ id: 'VIP002', categoryId: 'crypto' }), undefined);
});

test('30% preview does not split code fences or leave a lone heading', () => {
  const intro = '## Intro\n\nA complete introduction.\n\n';
  const code = '```js\nconst a = 1;\n\nconst b = 2;\n```\n\n';
  for (const suffix of [code, '### Next chapter\n\n']) {
    const prefix = intro + suffix;
    const cutoff = suffix === code ? prefix.indexOf('const b') : prefix.length;
    const content = prefix + 'Z'.repeat(Math.ceil(cutoff / 0.30) - prefix.length);
    assert.equal(createArticlePreview({ ...article, content }), intro.trimEnd());
  }
});

for (const [phase, at] of [['before', deadline - 1], ['exactly at', deadline], ['after', deadline + 1]]) {
  test(`former timed article remains public ${phase} its old deadline`, async () => {
    now = at;
    for (const tier of [null, 'MEMBER', 'VIP', 'VIP_PLUS']) {
      viewerTier = tier;
      const tree = await page.default({ params: Promise.resolve({ categoryId: 'VIP', uid }) });
      const props = tree.props.children.find(child => child.type === ArticlesContent).props;
      assert.equal(props.initialArticle.content, article.content);
      assert.equal(props.lockedContent, undefined);
      assert.equal(props.limitedRelease, undefined, 'the browser must not receive an expiry timer or preview payload');
      assert.ok(props.initialArticles.every(item => !Object.hasOwn(item, 'content')));
      const response = await api.GET();
      assert.equal(response.body.find(item => item.id === article.id).content, article.content);
      assert.ok(props.initialArticle.content.includes(secretEnding));
      assert.equal(getContentAccessRule(articlePath).access, 'PUBLIC');
    }
  });
}

test('all saved article restrictions are superseded by public reading', async () => {
  databaseConfigured = true;
  const normalPath = '/articles/broker/ordinary';
  for (const access of ['PUBLIC', 'MEMBER', 'VIP', 'VIP_PLUS']) {
    permissions = [articlePath, normalPath].map(contentKey => ({ contentType: 'ARTICLE', contentKey, access, reason: 'Old stored policy' }));
    for (const at of [deadline - 1, deadline, deadline + 1]) {
      now = at;
      const fullUrl = 'https://www.wise-invest.org' + articlePath + '?from=share#chapter';
      const rules = await getResolvedContentAccessRules([articlePath, fullUrl, normalPath]);
      for (const rule of rules.values()) assert.equal(rule.access, 'PUBLIC');
    }
  }
});

test('auth and permission database outages cannot prevent public article reading', async () => {
  now = deadline + 1;
  databaseConfigured = true;
  databaseFailure = true;
  afterIdentityLookup = () => { throw new Error('Auth unavailable'); };
  const rules = await getResolvedContentAccessRules([articlePath]);
  assert.equal(rules.get(articlePath).access, 'PUBLIC');
  const tree = await page.default({ params: Promise.resolve({ categoryId: 'VIP', uid }) });
  assert.equal(tree.props.children.find(child => child.type === ArticlesContent).props.initialArticle.content, article.content);
  const response = await api.GET();
  assert.equal(response.body.find(item => item.id === article.id).content, article.content);
});
