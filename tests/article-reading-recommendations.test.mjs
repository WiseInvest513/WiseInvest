import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const modules = new Map();
function load(relativePath) {
  const filename = path.join(root, relativePath);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} }; modules.set(filename, module);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', compiled)(name => {
    if (name === 'fs') return fs;
    if (name === 'path') return path;
    return load(path.relative(root, path.resolve(path.dirname(filename), `${name}.ts`)));
  }, module, module.exports);
  return module.exports;
}
const { getAllArticles, toArticleListItem } = load('lib/articles.ts');
const { getArticleReadingRecommendations: recommend, getArticleReadingNextStep: nextStep } = load('lib/article-reading-recommendations.ts');
const articles = getAllArticles().map(toArticleListItem);
const byId = id => articles.find(article => article.id === id);

test('BIT first article leads to its actual second article with an account-specific explanation', () => {
  const result = recommend(byId('bit-account-guide'), articles);
  assert.equal(result.articles[0].id, 'bit-comparison');
  assert.match(result.articles[0].label, /第二篇/);
  assert.match(result.introduction, /账户/);
  assert.doesNotMatch(result.introduction, /纳指/);
});
test('current series next article wins and preserves a validated series route', () => {
  const result = recommend(byId('indexStock'), articles, 'investment-foundations');
  assert.equal(result.articles[0].id, 'idifferentIndex');
  assert.match(result.articles[0].href, /series=investment-foundations/);
  assert.equal(result.articles[0].label, '继续本路线');
  const unrelated = recommend(byId('bit-account-guide'), articles, 'investment-foundations');
  assert.equal(unrelated.articles[0].id, 'bit-comparison');
});
test('all recommendations are bounded, deduplicated and exclude self, missing entries and private bodies', () => {
  for (const current of articles) {
    const result = recommend(current, articles.map(article => ({ ...article, content: 'private body' })));
    assert.ok(result.articles.length <= 4);
    assert.equal(new Set(result.articles.map(article => article.id)).size, result.articles.length);
    for (const item of result.articles) {
      assert.notEqual(item.id, current.id);
      assert.ok(byId(item.id));
      assert.ok(!Object.hasOwn(item, 'content'));
      assert.ok(item.reason && item.label);
    }
  }
  assert.deepEqual(recommend(byId('bit-account-guide'), []).articles, []);
});

test('next-step task chain prefers series next and explains why', () => {
  const step = nextStep(byId('crypto-first-steps'), articles, 'crypto-basics');
  assert.match(step.completed, /第 1/);
  assert.equal(step.next.id, 'crypto-buying-platforms');
  assert.match(step.next.reason, /.+/);
  assert.ok(step.overviewHref.includes('/articles/series/crypto-basics'));
  assert.match(step.overviewLabel, /路线|系列/);
});

test('non-series next-step still returns a completed line and next candidate', () => {
  const step = nextStep(byId('bit-account-guide'), articles);
  assert.match(step.completed, /读完了/);
  assert.equal(step.next.id, 'bit-comparison');
  assert.equal(step.overviewHref, undefined);
});
