import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const modules = new Map();
let viewerTier = null;
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
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'fragment' };
    if (name === 'next/navigation') return { notFound: () => { throw new Error('not found'); } };
    if (name === 'next/server') return { NextResponse: { json: (body, init) => ({ body, ...init }) } };
    if (name === '@/app/articles/articles-content') return { ArticlesContent };
    if (name === '@/lib/identity/content-viewer') return { getContentViewerTier: async () => viewerTier };
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
  for (const article of articles.filter(item => item.id !== journal.id)) {
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

test('SSR and JSON API agree for guests, members, VIP and SVIP without leaking locked text', async () => {
  for (const tier of [null, 'MEMBER', 'VIP', 'VIP_PLUS']) {
    viewerTier = tier;
    const fullAccess = tier === 'VIP' || tier === 'VIP_PLUS';
    const tree = await page.default({ params: Promise.resolve({ categoryId: 'VIP', uid: 'WGa8Mm2t' }) });
    const articleProps = tree.props.children.find(child => child.type === ArticlesContent).props;
    assert.equal(articleProps.initialArticle.content, fullAccess ? journal.content : trial, `SSR ${tier}`);
    assert.equal(articleProps.lockedContent?.previewPercentage, fullAccess ? undefined : 35, `SSR ${tier} trial visibility`);
    assert.ok(articleProps.initialArticles.every(article => !Object.hasOwn(article, 'content')), 'RSC directory data must not include any full text');
    const response = await api.GET();
    assert.equal(response.headers['Cache-Control'], 'no-store');
    const apiJournal = response.body.find(article => article.id === journal.id);
    assert.equal(apiJournal.content, articleProps.initialArticle.content, `API ${tier}`);
    if (!fullAccess) {
      assert.ok(!JSON.stringify(tree).includes(secretEnding), `RSC ${tier} hidden suffix`);
      assert.ok(!JSON.stringify(response.body).includes(secretEnding), `API ${tier} hidden suffix`);
    }
    for (const article of articles.filter(item => item.id !== journal.id)) {
      const originalRule = getContentAccessRule(getArticleRoute(article));
      const expected = canReadContentAccess(originalRule.access, tier) ? article.content : createContentPreview(article.content);
      assert.equal(response.body.find(item => item.id === article.id).content, expected, `${tier}: unchanged ${article.id}`);
    }
  }
});
