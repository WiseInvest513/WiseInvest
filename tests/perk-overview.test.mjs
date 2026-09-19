import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const moduleCache = new Map();
const allowedModules = new Set([
  'app/perk/overview-content.ts', 'app/perk/data.ts', 'app/card/data.ts',
  'lib/articles-fs.ts', 'lib/article-uid.ts', 'app/vip/landing-content.ts',
]);

// Execute the actual catalogue with filesystem-only dependencies. No server,
// credentials, database, or network access is needed by these regressions.
function loadLocalModule(relativePath) {
  assert.ok(allowedModules.has(relativePath), `Unexpected module: ${relativePath}`);
  if (moduleCache.has(relativePath)) return moduleCache.get(relativePath);
  const compiled = ts.transpileModule(fs.readFileSync(path.join(root, relativePath), 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} };
  const localRequire = (name) => {
    if (name === 'fs') return fs;
    if (name === 'path') return path;
    if (name === '@/lib/article-uid') return loadLocalModule('lib/article-uid.ts');
    if (name.startsWith('.')) {
      return loadLocalModule(path.posix.normalize(path.posix.join(path.posix.dirname(relativePath), name)) + '.ts');
    }
    throw new Error(`Unexpected dependency in filesystem-only overview test: ${name}`);
  };
  new Function('require', 'module', 'exports', 'process', compiled)(
    localRequire, module, module.exports, { cwd: () => root },
  );
  moduleCache.set(relativePath, module.exports);
  return module.exports;
}

const { featuredPerks, overviewTopics, perkSearchEntries } = loadLocalModule('app/perk/overview-content.ts');
const { perkSections } = loadLocalModule('app/perk/data.ts');
const { virtualCardProducts } = loadLocalModule('app/card/data.ts');
const { loadFsArticles } = loadLocalModule('lib/articles-fs.ts');
const { genUid } = loadLocalModule('lib/article-uid.ts');
const { brokerageChannels } = loadLocalModule('app/vip/landing-content.ts');
const articleHrefs = new Set(loadFsArticles().map(article => `/articles/${article.categoryId}/${genUid(article.id)}`));
const pageSource = fs.readFileSync(path.join(root, 'app/perk/page.tsx'), 'utf8');
const detailSource = fs.readFileSync(path.join(root, 'app/perk/[section]/page.tsx'), 'utf8');
const curatedEntries = overviewTopics.flatMap(topic => topic.entries);
const internalHref = href => href.replace(/^https:\/\/(?:www\.)?wise-invest\.org(?=\/)/, '');
const productsFor = sectionSlug => perkSections.find(section => section.slug === sectionSlug)
  .subcategories.flatMap(category => category.products ?? []);

test('featured order is Binance, BBAE, Gate Card, with the real configured destinations', () => {
  assert.deepEqual(featuredPerks.map(({ id }) => id), ['binance', 'bbae', 'gate']);
  assert.equal(featuredPerks[0].href, '/perk/crypto#product-binance');
  assert.equal(featuredPerks[0].action, '查看注册福利');
  const bbae = productsFor('broker').find(product => product.id === 'bbae');
  assert.equal(featuredPerks[1].href, bbae.tutorialLink);
  assert.equal(featuredPerks[1].href, '/articles/broker/I0AIBXus');
  assert.equal(featuredPerks[1].action, '开户教程');
  const gate = virtualCardProducts.find(card => card.id === 'gate-card');
  assert.equal(featuredPerks[2].title, 'Gate Card');
  assert.equal(featuredPerks[2].href, internalHref(gate.tutorialLink));
  assert.equal(featuredPerks[2].href, '/articles/vcard/GUhygjYV');
});

test('six full-size topics retain both international-access and other-resource destinations', () => {
  assert.deepEqual(overviewTopics.map(topic => [topic.id, topic.title, topic.nav]), [
    ['exchanges', '交易所', '注册交易所'],
    ['brokers', '券商开户', '开证券账户'],
    ['banking', '银行卡', '办银行卡'],
    ['cards', '虚拟 U 卡', '选虚拟 U 卡'],
    ['ipo', '打新', '参与打新'],
    ['tools', '国际互联与工具', '找出海工具'],
  ]);
  assert.equal(new Set(overviewTopics.map(topic => topic.id)).size, 6);
  assert.deepEqual(overviewTopics.at(-1).entries.map(entry => [entry.title, entry.href]), [
    ['国际互联', '/perk/global-access'],
    ['其他资源', '/perk/other-resources'],
  ]);
  assert.deepEqual(overviewTopics.slice(0, -1).map(topic => topic.allHref), [
    '/perk/crypto', '/perk/broker', '/perk/bank', '/card', '/perk/ipo',
  ]);
  for (const topic of overviewTopics) {
    assert.ok(topic.entries.length >= 2, `${topic.title} must retain usable entries`);
    assert.equal(new Set(topic.entries.map(entry => entry.id)).size, topic.entries.length);
  }
});

test('curated broker and card tutorials are derived from existing product configuration', () => {
  const brokerIds = ['bbae', 'charles-schwab', 'diyi-securities'];
  const cardIds = ['gate-card', 'bitget-wallet-card', 'safepal-card'];
  const brokers = overviewTopics.find(topic => topic.id === 'brokers');
  const cards = overviewTopics.find(topic => topic.id === 'cards');
  assert.deepEqual(brokers.entries.map(entry => entry.href), brokerIds.map(id =>
    internalHref(productsFor('broker').find(product => product.id === id).tutorialLink)));
  assert.deepEqual(cards.entries.map(entry => entry.href), cardIds.map(id =>
    internalHref(virtualCardProducts.find(card => card.id === id).tutorialLink)));
});

test('every curated/search internal link resolves to an actual section, category, product, or article', () => {
  const links = [
    ...featuredPerks.map(entry => entry.href),
    ...curatedEntries.map(entry => entry.href),
    ...overviewTopics.flatMap(topic => topic.allHref ? [topic.allHref] : []),
    ...perkSearchEntries.map(entry => entry.href),
  ];
  for (const href of links) {
    if (href.startsWith('https://')) {
      assert.ok(virtualCardProducts.some(card => card.tutorialLink === href),
        `External search destination must be an existing card tutorial: ${href}`);
      continue;
    }
    assert.match(href, /^\/(?!\/)/, `Overview should use a site-local destination: ${href}`);
    const [pathname, anchor] = href.split('#');
    if (pathname === '/card') {
      assert.equal(anchor, undefined, 'The card page has no product-level anchors');
      continue;
    }
    if (pathname.startsWith('/articles/')) {
      assert.ok(articleHrefs.has(pathname), `Tutorial must exist in real article content: ${href}`);
      assert.equal(anchor, undefined);
      continue;
    }
    assert.match(pathname, /^\/perk\/[^/]+$/);
    const section = perkSections.find(item => `/perk/${item.slug}` === pathname);
    assert.ok(section, `Unknown perk section: ${href}`);
    if (!anchor) continue;
    if (anchor.startsWith('product-')) {
      const products = section.subcategories.flatMap(category => category.products ?? []);
      assert.equal(products.filter(product => `product-${product.id}` === anchor).length, 1,
        `Product anchor must identify exactly one source product: ${href}`);
    } else {
      assert.equal(section.subcategories.filter(category => category.slug === anchor).length, 1,
        `Category anchor must identify exactly one source category: ${href}`);
    }
  }
});

test('product anchors are rendered on product cards and preserve registration/access components', () => {
  const productCard = detailSource.slice(detailSource.indexOf('function ProductCard('), detailSource.indexOf('function ProductSlot('));
  assert.match(productCard, /<article\s+id=\{`product-\$\{product\.id\}`\}/);
  assert.match(productCard, /scroll-mt-/);
  assert.match(productCard, /<RegisterRewardButton[\s\S]*?href=\{product\.registerLink\}/);
  assert.match(detailSource, /section\.slug === "crypto"/);
  assert.match(detailSource, /<CexRewardDialog\s*\/>/);
  assert.match(pageSource, /entry\.href\.startsWith\("\/articles\/"\)/);
  assert.match(pageSource, /<ProtectedContentLink href=\{entry\.href\}/);
  assert.match(pageSource, /<ProtectedContentLink href=\{item\.href\}/);
});

test('CEX overview destinations keep users in the existing registration-benefit flow', () => {
  const exchanges = overviewTopics.find(topic => topic.id === 'exchanges');
  assert.deepEqual(exchanges.entries.map(entry => entry.id), ['binance', 'bitget', 'okx']);
  for (const entry of exchanges.entries) {
    const product = productsFor('crypto').find(item => item.id === entry.id);
    assert.ok(product.registerLink.startsWith('https://'));
    assert.ok(product.code);
    assert.equal(entry.href, `/perk/crypto#product-${product.id}`);
    assert.equal(entry.action, '查看注册福利');
  }
});

test('search includes every subcategory and product, not just the homepage selections', () => {
  assert.equal(new Set(perkSearchEntries.map(entry => entry.id)).size, perkSearchEntries.length);
  const expectedCount = perkSections.reduce((sum, section) => sum + section.subcategories.reduce(
    (count, category) => count + 1 + (category.products?.length ?? 0), 0), 0) + virtualCardProducts.length;
  assert.equal(perkSearchEntries.length, expectedCount);
  for (const section of perkSections) {
    for (const category of section.subcategories) {
      const categoryEntry = perkSearchEntries.find(entry => entry.id === `${section.slug}-${category.slug}`);
      assert.equal(categoryEntry?.title, category.title);
      assert.equal(categoryEntry?.href, `/perk/${section.slug}#${category.slug}`);
      for (const product of category.products ?? []) {
        const productEntry = perkSearchEntries.find(entry => entry.id === `${section.slug}-${product.id}`);
        assert.equal(productEntry?.title, product.title);
        assert.equal(productEntry?.href, `/perk/${section.slug}#product-${product.id}`);
        assert.ok(productEntry.keywords.includes(product.benefit));
      }
    }
  }
  assert.ok(perkSearchEntries.some(entry => /Bybit/i.test(entry.title)));
  assert.ok(perkSearchEntries.some(entry => /长桥/.test(entry.title)));
  for (const card of virtualCardProducts) {
    assert.ok(perkSearchEntries.some(entry => entry.id === `card-${card.id}` && entry.title === card.name));
  }
});

test('all overview images exist, are nonempty, and stay below a combined 500 KB budget', () => {
  const imageUrls = new Set(curatedEntries.flatMap(entry => [
    ...(entry.image ? [entry.image] : []),
    ...(entry.marks ?? []).map(mark => mark.src),
  ]));
  for (const image of ['binance.svg', 'bbae-mark.webp', 'gate-card.webp']) {
    imageUrls.add(`/images/perks/overview/${image}`);
  }
  let totalBytes = 0;
  for (const url of imageUrls) {
    assert.match(url, /^\/images\//, `Assets must be local public images: ${url}`);
    const file = path.join(root, 'public', url.slice(1));
    const stat = fs.statSync(file);
    assert.ok(stat.isFile(), `Not an image file: ${url}`);
    assert.ok(stat.size > 0, `Empty image: ${url}`);
    totalBytes += stat.size;
    const buffer = fs.readFileSync(file);
    if (url.endsWith('.webp')) {
      assert.equal(buffer.subarray(0, 4).toString(), 'RIFF');
      assert.equal(buffer.subarray(8, 12).toString(), 'WEBP');
    } else if (/\.jpe?g$/.test(url)) {
      assert.equal(buffer.readUInt16BE(0), 0xffd8, `Invalid JPEG header: ${url}`);
    }
  }
  assert.ok(totalBytes < 500 * 1024, `Overview images weigh ${totalBytes} bytes (budget: 500 KB)`);
  assert.ok(!imageUrls.has('/icons/favicons/binance.png'), 'Do not use the existing empty favicon');
  assert.ok(!imageUrls.has('/images/capital-flow/binance.jpeg'), 'Do not label the Binance.US image as Binance');
});

test('the new Binance mark is a self-contained SVG with a valid view box and path', () => {
  const svg = fs.readFileSync(path.join(root, 'public/images/perks/overview/binance.svg'), 'utf8').trim();
  assert.match(svg, /^<svg\b[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"[^>]*>/);
  assert.match(svg, /viewBox="0 0 24 24"/);
  assert.match(svg, /<path\b[^>]*d="[Mm][\d\s.,+\-MmZzLlHhVvCcSsQqTtAaEe]+"[^>]*\/>/);
  assert.match(svg, /<\/svg>$/);
  assert.doesNotMatch(svg, /<script|<foreignObject|<image|\bon\w+\s*=|(?:href|xlink:href)\s*=|<!DOCTYPE|<!ENTITY/i);
});

test('existing BBAE article, VIP link, broker priority, and confirmed status are preserved', () => {
  const broker = perkSections.find(section => section.slug === 'broker');
  const usBrokers = broker.subcategories.find(category => category.slug === 'us-broker');
  assert.deepEqual(usBrokers.products.map(product => product.id), ['bbae', 'charles-schwab', 'diyi-securities', 'interactive-brokers']);
  assert.equal(usBrokers.slots, 4);
  const bbae = usBrokers.products[0];
  assert.equal(bbae.registerLink, '/articles/broker/I0AIBXus');
  assert.equal(bbae.tutorialLink, '/articles/broker/I0AIBXus');
  assert.equal(bbae.registerLabel, '开户教程');
  assert.equal(bbae.code, 'stiibsmu3');
  assert.equal(bbae.lastVerified, '2026-09-19');
  assert.equal(bbae.claimedCount, undefined);
  assert.equal(bbae.recommendation, undefined);
  assert.deepEqual(brokerageChannels.find(channel => channel.name === 'BBAE 证券'), {
    name: 'BBAE 证券', href: '/articles/broker/I0AIBXus', cta: '查看教程',
  });
  const defaults = detailSource.match(/\bbroker: \{[\s\S]*?\n  \}/)?.[0];
  assert.match(defaults, /availability: "已确认"/);
  assert.match(defaults, /lastVerified: "2026-08-25"/);
});
