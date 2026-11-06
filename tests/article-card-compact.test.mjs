import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = fs.readFileSync(root + 'components/article-card.tsx', 'utf8');
const css = fs.readFileSync(root + 'components/article-card.module.css', 'utf8');
const Image = () => null;
const ProtectedContentLink = () => null;
const jsx = (type, props) => ({ type, props });
const classNames = new Proxy({}, { get: (_, name) => String(name) });

function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}

function harness() {
  let failed = false;
  const dependencies = {
    'react/jsx-runtime': { jsx, jsxs: jsx },
    react: { useState: () => [failed, (value) => { failed = value; }] },
    'next/image': { __esModule: true, default: Image },
    './article-card.module.css': { __esModule: true, default: classNames },
    '@/components/content-access-gate': { ProtectedContentLink },
    '@/lib/article-covers': { ARTICLE_COVER_WIDTH: 640, ARTICLE_COVER_HEIGHT: 360, articleCovers: { covered: { src: '/images/articles/covers/bitget-referral.webp', alt: 'Bitget referral cover', topics: ['Bitget', '邀请码'] } } },
    '@/lib/article-uid': { genUid: () => 'stable-uid' },
    '@/lib/articles-data': { categories: [{ id: 'crypto', name: '加密货币' }], subcategories: [] },
  };
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(name => dependencies[name] ?? new Proxy({}, { get: () => () => null }), module, module.exports);
  const article = { id: 'covered', categoryId: 'crypto', title: 'Bitget 邀请码处理指南', summary: '注册与邀请关系说明', readTime: 6, date: '2026-11-05' };
  return { render: (variant, overrides = {}, priority = false) => module.exports.ArticleCard({ article: { ...article, ...overrides }, variant, priority }) };
}

test('omitting the variant retains the original vertical card and image sizes', () => {
  const tree = harness().render();
  assert.match(tree.props.className, /flex-col/);
  assert.equal(tree.props['data-article-card'], undefined);
  assert.ok(nodes(tree).some(node => node.props?.className?.includes('aspect-video')));
  assert.ok(nodes(tree).find(node => node.type === Image).props.sizes.includes('436px'));
  assert.equal(JSON.stringify(tree), JSON.stringify(harness().render('default')));
});

test('compact is opt-in and keeps the same permission-aware link and canonical route', () => {
  const h = harness();
  const compact = h.render('compact');
  const original = h.render();
  assert.equal(compact.type, ProtectedContentLink);
  assert.equal(compact.props.href, original.props.href);
  assert.equal(compact.props.href, '/articles/crypto/stable-uid');
  assert.equal(compact.props.prefetch, false);
  assert.equal(compact.props['aria-label'], original.props['aria-label']);
  assert.equal(compact.props['data-article-card'], 'compact');
  assert.equal(compact.props.className, 'compactCard');
});

test('compact list covers stay complete and lightweight with priority and fallback intact', () => {
  const h = harness();
  const image = nodes(h.render('compact')).find(node => node.type === Image);
  assert.equal(image.props.width, 640);
  assert.equal(image.props.height, 360);
  assert.equal(image.props.sizes, '232px');
  assert.equal(image.props.unoptimized, true);
  assert.equal(image.props.priority, false);
  assert.match(image.props.className, /object-contain/);
  assert.equal(nodes(h.render('compact', {}, true)).find(node => node.type === Image).props.priority, true);
  image.props.onError();
  assert.ok(!nodes(h.render('compact')).some(node => node.type === Image || node.type === 'img'));
});

test('compact legacy and external covers also fit without cropping', () => {
  const h = harness();
  const local = nodes(h.render('compact', { id: 'legacy', coverImage: '/content/articles/crypto/example.webp' })).find(node => node.type === Image);
  assert.equal(local.props.unoptimized, false);
  assert.match(local.props.className, /object-contain/);
  const external = nodes(h.render('compact', { id: 'external', coverImage: 'https://example.com/cover.webp' })).find(node => node.type === 'img');
  assert.match(external.props.className, /object-contain/);
  assert.equal(external.props.loading, 'lazy');
  assert.equal(external.props.decoding, 'async');
});

test('compact content keeps titles, descriptions, dates, topics and the reading action', () => {
  const tree = harness().render('compact');
  assert.equal(nodes(tree).find(node => node.type === 'h2').props.children, 'Bitget 邀请码处理指南');
  assert.equal(nodes(tree).find(node => node.type === 'p').props.children, '注册与邀请关系说明');
  assert.equal(nodes(tree).find(node => node.type === 'time').props.dateTime, '2026-11-05');
  const topics = nodes(tree).find(node => node.props?.className === 'compactTopics');
  assert.deepEqual(topics.props.children.map(node => node.props.children), ['Bitget', '邀请码']);
  assert.equal(nodes(tree).find(node => node.props?.className === 'compactAction').props.children[0], '阅读教程');
});

test('compact proportions respond to the card width and respect dark/reduced-motion modes', () => {
  assert.match(css, /container: article-preview \/ inline-size/);
  assert.match(css, /aspect-ratio: 16 \/ 9/);
  assert.match(css, /max-width: 232px/);
  assert.match(css, /object-fit: contain/);
  assert.match(css, /@container article-preview \(max-width: 340px\)/);
  assert.match(css, /max-width: 220px/);
  assert.match(css, /:global\(\.dark\) \.compactCard/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /:focus-visible/);
});
