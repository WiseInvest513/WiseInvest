import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const { getImageProps } = require('next/image');
const jsx = (type, props) => ({ type, props });
const Image = () => null;
const ProtectedContentLink = () => null;

function load(relativePath, dependencies = {}, globals = {}) {
  const source = ts.transpileModule(fs.readFileSync(root + relativePath, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  const mockRequire = (name) => {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'fragment' };
    if (Object.hasOwn(dependencies, name)) return dependencies[name];
    return new Proxy({}, { get: () => () => null });
  };
  new Function('require', 'module', 'exports', ...Object.keys(globals), source)(mockRequire, module, module.exports, ...Object.values(globals));
  return module.exports;
}

function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}

function cardHarness() {
  let failed = false;
  const { ArticleCard } = load('components/article-card.tsx', {
    react: { useState: () => [failed, (value) => { failed = value; }] },
    'next/image': { __esModule: true, default: Image },
    '@/components/content-access-gate': { ProtectedContentLink },
    '@/lib/article-covers': { articleCovers: { covered: { src: '/images/articles/crypto/binance-guide-cover.webp', alt: 'Binance guide', topics: ['Crypto'] } } },
    '@/lib/article-uid': { genUid: () => 'existing-uid' },
    '@/lib/articles-data': { categories: [{ id: 'crypto', name: 'Crypto' }], subcategories: [] },
  });
  const article = { id: 'covered', categoryId: 'crypto', title: 'Guide', summary: 'Summary', readTime: 10, date: '2026-10-10' };
  return { render: (overrides = {}, priority = false) => ArticleCard({ article: { ...article, ...overrides }, priority }) };
}

test('local article covers use responsive optimized images without prefetching entire articles', () => {
  const tree = cardHarness().render();
  assert.equal(tree.type, ProtectedContentLink);
  assert.equal(tree.props.prefetch, false);
  assert.equal(tree.props.href, '/articles/crypto/existing-uid');
  const image = nodes(tree).find(node => node.type === Image);
  assert.ok(image.props.sizes.includes('436px'));
  assert.equal(image.props.priority, false);
  const props = getImageProps(image.props).props;
  assert.equal(props.loading, 'lazy');
  assert.ok(props.srcSet.includes('/_next/image?'));
  assert.ok(props.srcSet.includes('w=640'));
  assert.equal(image.props.alt, 'Binance guide');
});

test('first visible article covers retain priority and failed images retain their fallback', () => {
  const h = cardHarness();
  const image = nodes(h.render({}, true)).find(node => node.type === Image);
  assert.equal(image.props.priority, true);
  assert.notEqual(getImageProps(image.props).props.loading, 'lazy');
  image.props.onError();
  assert.equal(nodes(h.render()).some(node => node.type === Image || node.type === 'img'), false);
});

test('legacy local article PNG covers receive responsive optimization too', () => {
  const tree = cardHarness().render({ id: 'legacy', coverImage: '/content/articles/crypto/bybit/0.png' });
  const image = nodes(tree).find(node => node.type === Image);
  assert.equal(image.props.src, '/content/articles/crypto/bybit/0.png');
  assert.ok(getImageProps(image.props).props.srcSet.includes('/_next/image?'));
  assert.equal(getImageProps(image.props).props.loading, 'lazy');
});

test('external article covers retain their existing direct loading behavior', () => {
  const tree = cardHarness().render({ id: 'external', coverImage: 'https://example.com/cover.webp' });
  const image = nodes(tree).find(node => node.type === 'img');
  assert.equal(image.props.src, 'https://example.com/cover.webp');
  assert.equal(image.props.loading, 'lazy');
  assert.equal(image.props.decoding, 'async');
});

test('production caches are restricted to public illustration directories', async () => {
  const config = load('next.config.ts', {
    './lib/security/content-security-policy': { buildContentSecurityPolicy: () => 'test-csp' },
  }, { process: { env: { NODE_ENV: 'production' } } }).default;
  assert.equal(config.images.minimumCacheTTL, 3600);
  assert.ok(config.images.deviceSizes.includes(1536));
  assert.ok(config.images.deviceSizes.includes(2560));
  const headers = await config.headers();
  const cached = headers.filter(rule => rule.headers.some(header => header.key === 'Cache-Control'));
  assert.deepEqual(cached.map(rule => rule.source), ['/images/home/:path*', '/images/websites/:path*', '/images/articles/:path*', '/images/perks/overview/:path*']);
  for (const rule of cached) {
    assert.ok(rule.headers[0].value.includes('max-age=3600'));
    assert.ok(!rule.headers[0].value.includes('immutable'));
  }
  assert.ok(headers.some(rule => rule.headers.some(header => header.key === 'Content-Security-Policy')));
});

test('development keeps public illustrations immediately revalidatable', async () => {
  const config = load('next.config.ts', {
    './lib/security/content-security-policy': { buildContentSecurityPolicy: () => 'test-csp' },
  }, { process: { env: { NODE_ENV: 'development' } } }).default;
  const headers = await config.headers();
  assert.equal(headers.some(rule => rule.headers.some(header => header.key === 'Cache-Control')), false);
});

test('navbar panels are deferred until requested and retain state after closing', () => {
  const slots = [];
  const panels = [];
  const effects = [];
  let cursor = 0;
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: initial };
      return [slots[index].value, (value) => { slots[index].value = typeof value === 'function' ? value(slots[index].value) : value; }];
    },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!slots[index] || deps.some((value, i) => !Object.is(value, slots[index].deps[i]))) {
        slots[index] = { deps };
        effects.push(effect);
      }
    },
  };
  const dynamic = (_loader, options) => {
    assert.equal(options.ssr, false);
    assert.equal(typeof options.loading, 'function');
    const panel = () => null;
    panels.push(panel);
    return panel;
  };
  const { Navbar } = load('components/navbar.tsx', {
    react,
    'next/dynamic': { __esModule: true, default: dynamic },
    'next/navigation': { usePathname: () => '/' },
    '@/lib/utils': { cn: (...values) => values.filter(Boolean).join(' ') },
    '@/lib/auth/nav-session-client': { subscribeNavSession: () => () => {}, readNavSession: async () => null },
  }, { window: { addEventListener() {}, removeEventListener() {} } });
  const render = () => {
    cursor = 0;
    const tree = Navbar();
    for (const effect of effects.splice(0)) effect();
    return tree;
  };
  let tree = render();
  assert.equal(nodes(tree).some(node => panels.includes(node.type)), false);
  for (const [index, title] of ['搜索全站', '重要事件日历', '今日精选'].entries()) {
    nodes(tree).find(node => node.props?.title === title).props.onClick();
    tree = render();
    const panel = nodes(tree).find(node => node.type === panels[index]);
    assert.equal(panel.props.open, true);
    panel.props.onOpenChange(false);
    tree = render();
    assert.equal(nodes(tree).find(node => node.type === panels[index]).props.open, false);
  }
});

test('automatic recommendations do not load on home or admin pages but remain enabled elsewhere', () => {
  const visibility = load('lib/recommendation-visibility.ts');
  let pathname = '/';
  const panel = () => null;
  const { AutomaticRecommendation } = load('components/business/automatic-recommendation.tsx', {
    'next/dynamic': { __esModule: true, default: () => panel },
    'next/navigation': { usePathname: () => pathname },
    '@/lib/recommendation-visibility': visibility,
  });
  for (const route of ['/', '/admin', '/admin/users', '/point', '/point/example']) {
    pathname = route;
    assert.equal(AutomaticRecommendation(), null);
  }
  for (const route of ['/articles/crypto', '/perk', '/website', '/aboutme']) {
    pathname = route;
    assert.equal(AutomaticRecommendation().type, panel);
  }
});
