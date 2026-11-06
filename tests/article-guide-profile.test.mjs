import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const modules = new Map();
function load(relative) {
  const file = path.join(root, relative);
  if (modules.has(file)) return modules.get(file).exports;
  const module = { exports: {} };
  modules.set(file, module);
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', compiled)(name => {
    if (name.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(file), `${name}.ts`)));
    if (name.startsWith('@/')) return load(`${name.slice(2)}.ts`);
    return require(name);
  }, module, module.exports);
  return module.exports;
}

const { parseArticleGuideProfile, loadFsArticles } = load('lib/articles-fs.ts');
const { toArticleListItem } = load('lib/articles.ts');
const articles = loadFsArticles();
const byId = id => {
  const article = articles.find(item => item.id === id);
  assert.ok(article, id);
  assert.ok(article.guideProfile, `${id}: missing article-specific reading guide`);
  return article;
};

test('reading-guide frontmatter accepts authored lists, trims entries, and has no default filler', () => {
  const meta = { guideAudience: ' 读者一 | | 读者二 ', guideOutcomes: ' 收获一 | 收获二 ', guidePrepare: ' 准备事项 ', guideStatus: ' 内容边界 ' };
  assert.deepEqual(parseArticleGuideProfile(meta), {
    audience: ['读者一', '读者二'], outcomes: ['收获一', '收获二'], prepare: '准备事项', status: '内容边界',
  });
  assert.equal(parseArticleGuideProfile({}), undefined);
  assert.equal(parseArticleGuideProfile({ categoryId: 'crypto' }), undefined);
  for (const key of Object.keys(meta)) assert.equal(parseArticleGuideProfile({ ...meta, [key]: '   ' }), undefined);
});

test('every published article has complete, distinct editorial guide content', () => {
  assert.ok(articles.length > 0);
  const profiles = new Set();
  const audiences = new Set();
  const outcomes = new Set();
  for (const article of articles) {
    const profile = byId(article.id).guideProfile;
    assert.ok(profile.audience.length >= 1 && profile.audience.length <= 3, article.id);
    assert.ok(profile.outcomes.length >= 1 && profile.outcomes.length <= 3, article.id);
    assert.ok(profile.prepare.length >= 15, article.id);
    assert.ok(profile.status.length >= 15, article.id);
    const serialized = JSON.stringify(profile);
    assert.doesNotMatch(serialized, /第一次接触这个主题，想快速建立全局理解|把文章里的关键信息转成可执行步骤|先看完摘要和目录，再按自己的场景|内容会持续维护，涉及价格/);
    assert.ok(!profiles.has(serialized), `${article.id}: duplicated full guide`);
    assert.ok(!audiences.has(profile.audience.join('|')), `${article.id}: duplicated audience`);
    assert.ok(!outcomes.has(profile.outcomes.join('|')), `${article.id}: duplicated outcomes`);
    profiles.add(serialized);
    audiences.add(profile.audience.join('|'));
    outcomes.add(profile.outcomes.join('|'));
  }
});

test('Galaxy and OKX describe their actual reader tasks, not their shared category defaults', () => {
  const galaxy = byId('galaxy-etf-guide').guideProfile;
  assert.match(galaxy.audience.join(' '), /ETF/);
  assert.match(galaxy.outcomes.join(' '), /免五/);
  assert.match(galaxy.prepare, /1\.5 万元.*2 个月/);
  assert.match(galaxy.status, /申请.*生效/);
  const okx = JSON.stringify(byId('okx-guide').guideProfile);
  assert.match(okx, /OKX|欧易/);
  assert.match(okx, /注册/);
  assert.match(okx, /C2C|买币/);
  assert.notEqual(byId('bitget-referral').guideProfile.outcomes.join('|'), byId('bitget-exchange').guideProfile.outcomes.join('|'));
  assert.notEqual(byId('bit-account-guide').guideProfile.prepare, byId('bit-comparison').guideProfile.prepare);
});

test('article listings remain lightweight while detail metadata retains its reading guide', () => {
  for (const article of articles) {
    const item = toArticleListItem(article);
    assert.ok(!Object.hasOwn(item, 'guideProfile'), article.id);
    assert.ok(!Object.hasOwn(item, 'content'), article.id);
    assert.ok(article.guideProfile, 'listing conversion must not mutate the full article');
  }
});

test('the shared reader only displays the selected article guide, including registration and series articles', () => {
  const source = fs.readFileSync(path.join(root, 'app/articles/articles-content.tsx'), 'utf8');
  assert.match(source, /const guideProfile = selectedArticle\?\.guideProfile;/);
  assert.match(source, /\{guideProfile && \(/);
  assert.match(source, /data-article-guide=\{selectedArticle\.id\}/);
  assert.doesNotMatch(source, /defaultGuideProfile|articleGuideProfiles|shouldShowGuideProfile/);
  assert.doesNotMatch(source, /最后更新：\{selectedArticle\.date/);
});
