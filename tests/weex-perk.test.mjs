import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const compiled = ts.transpileModule(fs.readFileSync(path.join(root, 'app/perk/data.ts'), 'utf8'), {
  compilerOptions: {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
  },
}).outputText;
const module = { exports: {} };

// Exercise the real catalogue without any network, database, or application setup.
new Function('require', 'module', 'exports', compiled)(
  name => { throw new Error(`Unexpected dependency in filesystem-only WEEX test: ${name}`); },
  module,
  module.exports,
);

const { perkSections, getPerks2Section } = module.exports;
const crypto = getPerks2Section('crypto');
const cex = crypto.subcategories.find(category => category.slug === 'uex-exchange');
const weex = cex.products.find(product => product.id === 'weex');
const registrationUrl = 'https://wpewehx.site/zh-CN/register?vipCode=wiseweex';

test('WEEX is first in CEX while all five existing exchanges retain their order', () => {
  assert.deepEqual(cex.products.map(product => product.id), [
    'weex', 'binance', 'okx', 'bitget', 'bybit', 'gate',
  ]);
  assert.equal(weex.title, 'WEEX');
  const occurrences = perkSections.flatMap(section => section.subcategories
    .flatMap(category => (category.products ?? []).filter(product => product.id === 'weex')
      .map(() => [section.slug, category.slug])));
  assert.deepEqual(occurrences, [['crypto', 'uex-exchange']]);
});

test('both WEEX entry buttons preserve the exact registration URL and invitation code', () => {
  assert.equal(weex.registerLink, registrationUrl);
  assert.equal(weex.tutorialLink, registrationUrl);
  assert.equal(weex.code, 'wiseweex');
  assert.equal(new URL(weex.registerLink).searchParams.get('vipCode'), weex.code);
});

test('WEEX displays the configured 20% rebate without invented ratings or claim counts', () => {
  assert.equal(weex.benefitLabel, '返佣比例');
  assert.equal(weex.highlightValue, '20%');
  assert.match(weex.benefit, /返佣/);
  assert.equal(weex.recommendation, undefined);
  assert.equal(weex.claimedCount, undefined);
});

test('WEEX uses a nonempty local PNG logo', () => {
  assert.equal(weex.iconUrl, '/images/perks/weex.png');
  const logo = path.join(root, 'public', weex.iconUrl.slice(1));
  const stat = fs.statSync(logo);
  assert.ok(stat.isFile());
  assert.ok(stat.size > 0);
  assert.deepEqual(fs.readFileSync(logo).subarray(0, 8),
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
});

test('crypto has 11 products and slots, including six CEX entries', () => {
  assert.equal(cex.products.length, 6);
  assert.equal(cex.slots, 6);
  assert.equal(crypto.subcategories.flatMap(category => category.products ?? []).length, 11);
  assert.equal(crypto.subcategories.reduce((sum, category) => sum + category.slots, 0), 11);
  for (const category of crypto.subcategories) {
    assert.equal(category.slots, category.products.length, `${category.slug} count must match its products`);
  }
});
