import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const modules = new Map();
function loadModule(relativePath) {
  const filename = path.join(root, relativePath);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const requireMock = name => {
    if (name === 'fs') return fs;
    if (name === 'path') return path;
    const resolved = path.resolve(path.dirname(filename), `${name}.ts`);
    if (fs.existsSync(resolved)) return loadModule(path.relative(root, resolved));
    throw new Error(`Unexpected dependency: ${name}`);
  };
  new Function('require', 'module', 'exports', compiled)(requireMock, module, module.exports);
  return module.exports;
}

const { articleSeries } = loadModule('lib/article-library.ts');
const { getAllArticles, getArticleRoute, toArticleListItem } = loadModule('lib/articles.ts');
const { getSeriesOverviewHref } = loadModule('lib/article-series.ts');
const { getSeriesRecommendations } = loadModule('lib/series-recommendations.ts');
const articles = getAllArticles().map(toArticleListItem);
const foundations = articleSeries.find(series => series.id === 'investment-foundations');

test('investment foundations recommends real next reading with canonical routes and existing series', () => {
  const result = getSeriesRecommendations(foundations, articles);
  assert.deepEqual(result.articles.map(article => article.id), ['passive-millionaire', 'index-qa-1', 'index-guide']);
  assert.deepEqual(result.series.map(series => series.id), ['nasdaq-investing', 'us-stock-funding']);
  for (const recommended of result.articles) {
    const source = articles.find(article => article.id === recommended.id);
    assert.equal(recommended.title, source.title);
    assert.equal(recommended.summary, source.summary);
    assert.equal(recommended.coverImage, source.coverImage);
    assert.equal(recommended.href, getArticleRoute(source));
    assert.ok(!recommended.href.includes('?series='));
  }
  for (const recommended of result.series) assert.equal(recommended.href, getSeriesOverviewHref(recommended.id));
});

test('every known series excludes its own chapters and supplementary article, with bounded deduplicated results', () => {
  for (const current of articleSeries) {
    const result = getSeriesRecommendations(current, [...articles, ...articles]);
    const ownIds = new Set([...current.chapters.map(chapter => chapter.articleId), current.existingArticleId]);
    assert.ok(result.articles.length > 0 && result.articles.length <= 3, current.id);
    assert.ok(result.series.length > 0 && result.series.length <= 2, current.id);
    assert.equal(new Set(result.articles.map(article => article.id)).size, result.articles.length);
    for (const article of result.articles) assert.ok(!ownIds.has(article.id), `${current.id} repeats ${article.id}`);
    for (const related of result.series) {
      assert.notEqual(related.id, current.id);
      assert.ok(related.publishedCount > 0);
    }
  }
});

test('missing articles and empty planned series never become clickable placeholder recommendations', () => {
  assert.deepEqual(getSeriesRecommendations(foundations, []), { articles: [], series: [] });
  const partial = articles.filter(article => article.id === 'index-guide');
  const result = getSeriesRecommendations(foundations, partial);
  assert.deepEqual(result.articles.map(article => article.id), ['index-guide']);
  assert.deepEqual(result.series.map(series => [series.id, series.publishedCount]), [['nasdaq-investing', 1]]);
  const malformed = [{ ...partial[0], categoryId: '' }];
  assert.deepEqual(getSeriesRecommendations(foundations, malformed), { articles: [], series: [] });
});

test('related real content can fill a missing preferred article without falling back to unrelated posts', () => {
  const partial = articles.filter(article => ['index-practice', 'VIP'].includes(article.id));
  assert.deepEqual(getSeriesRecommendations(foundations, partial).articles.map(article => article.id), ['index-practice']);
  assert.deepEqual(getSeriesRecommendations(foundations, partial.filter(article => article.id === 'VIP')), { articles: [], series: [] });
});

test('recommendation order is stable across article inventory order and input data is never mutated', () => {
  const before = structuredClone(articles);
  assert.deepEqual(getSeriesRecommendations(foundations, articles), getSeriesRecommendations(foundations, [...articles].reverse()));
  assert.deepEqual(articles, before);
});

test('only explicit list metadata crosses the recommendation boundary', () => {
  const withBodies = articles.map(article => ({ ...article, content: 'private body', lockedContent: 'private body' }));
  const result = getSeriesRecommendations(foundations, withBodies);
  for (const article of result.articles) {
    assert.ok(!Object.hasOwn(article, 'content'));
    assert.ok(!Object.hasOwn(article, 'lockedContent'));
    assert.ok(!Object.hasOwn(article, 'basePath'));
  }
  const compiled = ts.transpileModule(fs.readFileSync(path.join(root, 'lib/series-recommendations.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  assert.doesNotMatch(compiled, /require\(["']\.\/articles["']\)/);
});

test('unknown series have no fabricated editorial relationships, including object prototype keys', () => {
  for (const id of ['new-series', '__proto__', 'constructor']) {
    assert.deepEqual(getSeriesRecommendations({ ...foundations, id }, articles), { articles: [], series: [] });
  }
});
