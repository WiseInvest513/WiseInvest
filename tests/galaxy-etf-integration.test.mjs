import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const modules = new Map();

// Read the real local catalogues and access resolver without touching accounts or a DB.
function loadModule(relativePath) {
  const filename = path.join(root, relativePath);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
    },
  }).outputText;
  const requireLocal = (name) => {
    if (name.startsWith('@/')) return loadModule(`${name.slice(2)}.ts`);
    throw new Error(`Unexpected dependency in Galaxy integration test: ${name}`);
  };
  new Function('require', 'module', 'exports', compiled)(requireLocal, module, module.exports);
  return module.exports;
}

const { genUid } = loadModule('lib/article-uid.ts');
const { publicArticleAccessRules, publicArticlePaths, defaultArticleAccessRule, vipArticleAccessRules } =
  loadModule('lib/content-access-rules.ts');
const { getContentAccessRule, requiresLoginForContent, canReadContentAccess } =
  loadModule('lib/content-access.ts');
const { perkSections } = loadModule('app/perk/data.ts');
const { perks } = loadModule('lib/perks-data.ts');
const articlePath = `/articles/domestic/${genUid('galaxy-etf-guide')}`;

test('the Galaxy ETF guide is explicitly public for signed-out readers', () => {
  assert.equal(articlePath, '/articles/domestic/o0RA5e1p');
  const matches = publicArticleAccessRules.filter(rule => rule.articleId === 'galaxy-etf-guide');
  assert.equal(matches.length, 1);
  assert.equal(matches[0].categoryId, 'domestic');
  assert.equal(matches[0].access, 'PUBLIC');
  assert.ok(publicArticlePaths.has(articlePath));
  for (const href of [articlePath, `${articlePath}?from=perk`, `https://www.wise-invest.org${articlePath}`]) {
    assert.equal(getContentAccessRule(href).access, 'PUBLIC');
    assert.equal(requiresLoginForContent(href), false);
    assert.equal(canReadContentAccess(getContentAccessRule(href).access, null), true);
  }
});

test('ordinary and former VIP articles share the public reading policy', () => {
  assert.equal(defaultArticleAccessRule.access, 'PUBLIC');
  assert.equal(getContentAccessRule('/articles/domestic/unrelated-article').access, 'PUBLIC');
  assert.equal(vipArticleAccessRules.length, 0);
  for (const id of ['VIP', 'VIP001', 'VIP002']) {
    assert.equal(getContentAccessRule(`/articles/VIP/${genUid(id)}`).access, 'PUBLIC');
  }
});

test('both active Galaxy benefit entries link to the public guide and keep contact-first access', () => {
  const products = perkSections.flatMap(section => section.subcategories.flatMap(category => category.products ?? []));
  for (const id of ['china-galaxy', 'china-galaxy-ipo']) {
    const matches = products.filter(product => product.id === id);
    assert.equal(matches.length, 1, id);
    const product = matches[0];
    assert.equal(product.tutorialLink, articlePath, id);
    assert.equal(product.contactWeChat, true, id);
    assert.equal(product.registerLabel, '联系博主', id);
    assert.equal(product.code, null, id);
    assert.match(product.benefit, /入金 1\.5 万放 2 个月/);
    assert.match(product.benefit, /ETF\/LOF 可申请永久免五/);
  }
});

test('the legacy Galaxy benefit entry points to the same guide without inventing an invite code', () => {
  const galaxy = perks.find(product => product.id === 'china-galaxy');
  assert.ok(galaxy);
  assert.equal(galaxy.tutorialLink, articlePath);
  assert.equal(galaxy.contactWeChat, true);
  assert.equal(galaxy.code, null);
});
