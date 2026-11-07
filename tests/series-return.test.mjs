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
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const requireMock = name => {
    const resolved = path.resolve(path.dirname(filename), name) + '.ts';
    if (fs.existsSync(resolved)) return loadModule(path.relative(root, resolved));
    throw new Error(`Unexpected dependency: ${name}`);
  };
  new Function('require', 'module', 'exports', compiled)(requireMock, module, module.exports);
  return module.exports;
}
const { getArticleSeries, getSeriesReadingState, resolveSeriesResource, addSeriesReturnContext } = loadModule('lib/article-series.ts');
const { articleSeries } = loadModule('lib/article-library.ts');
const nasdaq = getArticleSeries('nasdaq-investing');
const us = getArticleSeries('us-stock-funding');
const hk = getArticleSeries('hk-stock-funding');
const articles = us.chapters.map(chapter => ({ id: chapter.articleId, categoryId: 'broker' }));
const readUrl = href => new URL(href, 'https://www.wise-invest.org');
const contextFrom = href => Object.fromEntries(readUrl(href).searchParams.entries());

test('a nested series retains its stage anchor and provides a deterministic return after refresh', () => {
  const resource = resolveSeriesResource('/articles/series/us-stock-funding?route=traditional-us-stocks#stage-brokers', nasdaq, 'practice');
  assert.equal(resource.kind, 'series');
  assert.equal(resource.label, '系列教程');
  assert.equal(resource.series.id, us.id);
  const url = readUrl(resource.href);
  assert.equal(url.searchParams.get('route'), 'traditional-us-stocks');
  assert.equal(url.searchParams.get('stage'), 'brokers');
  assert.equal(url.searchParams.get('fromSeries'), nasdaq.id);
  assert.equal(url.searchParams.get('fromStage'), 'practice');
  assert.equal(url.hash, '#stage-brokers');
  const reading = getSeriesReadingState(us, articles, undefined, url.searchParams.get('route'), contextFrom(resource.href));
  assert.equal(reading.stages[reading.currentStageIndex].id, 'brokers');
  assert.equal(reading.returnTo.href, '/articles/series/nasdaq-investing?stage=practice#stage-practice');
  assert.equal(reading.returnTo.stageTitle, '实操：购买与持有');
  const returned = getSeriesReadingState(nasdaq, [], undefined, undefined, contextFrom(reading.returnTo.href));
  assert.equal(returned.stages[returned.currentStageIndex].id, 'practice');
  assert.equal(returned.returnTo, undefined);
});

test('return context survives chapter and overview navigation without changing current article stage or map route', () => {
  const context = { fromSeries: nasdaq.id, fromStage: 'practice', stage: 'brokers' };
  const reading = getSeriesReadingState(us, articles, 'BBAE', 'traditional-us-stocks', context);
  for (const href of [reading.first.href, reading.previous.href, reading.next.href, reading.overviewHref, ...reading.chapters.map(chapter => chapter.href)]) {
    const url = readUrl(href);
    assert.equal(url.searchParams.get('fromSeries'), nasdaq.id);
    assert.equal(url.searchParams.get('fromStage'), 'practice');
    assert.equal(url.searchParams.get('route'), 'traditional-us-stocks');
  }
  assert.equal(reading.stages[reading.currentStageIndex].id, 'brokers');
  assert.equal(reading.mapHref, '/roadmap?route=traditional-us-stocks');
  const account = getSeriesReadingState(us, articles, 'ifast-guide', undefined, context);
  assert.equal(account.stages[account.currentStageIndex].id, 'accounts');
  assert.equal(account.returnTo.href, reading.returnTo.href);
});

test('forged, unrelated, self and malformed parent contexts never create a return target', () => {
  for (const context of [
    { fromSeries: 'https://evil.example', fromStage: 'practice' },
    { fromSeries: nasdaq.id, fromStage: 'compare' },
    { fromSeries: nasdaq.id, fromStage: 'missing' },
    { fromSeries: nasdaq.id, fromStage: ['practice'] },
    { fromSeries: us.id, fromStage: 'brokers' },
    { fromSeries: 'crypto-tools', fromStage: 'exchanges' },
    { fromSeries: nasdaq.id },
  ]) {
    const reading = getSeriesReadingState(us, articles, undefined, undefined, context);
    assert.equal(reading.returnTo, undefined);
    assert.ok(!reading.overviewHref.includes('fromSeries'));
  }
  assert.equal(getSeriesReadingState(us, articles, undefined, undefined, { stage: 'bad-stage' }).currentStageIndex, -1);
});

test('resources identify articles, series, books and tools without turning every resource into a series', () => {
  const resources = getSeriesReadingState(nasdaq, []).stages.flatMap(stage => stage.resources ?? []);
  assert.deepEqual(resources.map(resource => resource.kind), ['book', 'tool', 'tool', 'series', 'series']);
  assert.equal(resources[0].href, '/book/nasdaq');
  assert.equal(resources[1].href, 'https://www.wise-etf.com/today/etf-premium');
  assert.equal(resolveSeriesResource('/articles/index/mSIqvwVp?x=1#h-3', nasdaq, 'practice').label, '学习文章');
  assert.equal(resolveSeriesResource('https://outside.example/guide', nasdaq, 'practice').kind, 'resource');
  assert.equal(resolveSeriesResource('/articles/series/missing', nasdaq, 'practice').kind, 'resource');
  assert.equal(resolveSeriesResource('/articles/series/us-stock-funding#stage-brokers', nasdaq, 'compare').href.includes('fromSeries'), false);
});

test('context propagation is restricted to the active child and preserves query/hash', () => {
  const returnTo = getSeriesReadingState(hk, [], undefined, undefined, { fromSeries: nasdaq.id, fromStage: 'practice' }).returnTo;
  const href = '/articles/broker/sQSbLRe8?series=hk-stock-funding&route=traditional-ipo#h-3';
  const propagated = readUrl(addSeriesReturnContext(href, returnTo));
  assert.equal(propagated.searchParams.get('route'), 'traditional-ipo');
  assert.equal(propagated.hash, '#h-3');
  assert.equal(propagated.searchParams.get('fromSeries'), nasdaq.id);
  for (const other of [
    '/articles/series/us-stock-funding', '/book/nasdaq', '/roadmap',
    '/articles/broker/sQSbLRe8', '/articles/broker/sQSbLRe8?series=us-stock-funding',
    'https://evil.example/articles/series/hk-stock-funding',
    '//evil.example/articles/series/hk-stock-funding',
    'javascript:alert(1)',
  ]) assert.equal(addSeriesReturnContext(other, returnTo), other);
});

test('direct entry keeps existing map-route defaults and has no invented parent', () => {
  const reading = getSeriesReadingState(us, articles);
  assert.equal(reading.returnTo, undefined);
  assert.equal(reading.overviewHref, '/articles/series/us-stock-funding?route=transfer-to-us-broker');
  assert.equal(reading.mapHref, '/roadmap?route=transfer-to-us-broker');
  assert.equal(reading.currentStageIndex, -1);
  assert.ok(!reading.first.href.includes('fromSeries'));
});

test('a configured parent map context survives an existing comprehensive guide; invalid routes use the parent default', () => {
  const parent = {
    id: 'test-parent-path', title: '测试父路线', kind: 'path', status: 'updating', artwork: '', description: '',
    mapRouteIds: ['map-default', 'map-selected'], chapters: [],
    stages: [{ id: 'trade', title: '学习交易', description: '', resources: [{ title: '币安系列', href: '/articles/series/binance' }] }],
  };
  articleSeries.push(parent);
  try {
    const binance = getArticleSeries('binance');
    const context = { fromSeries: parent.id, fromStage: 'trade', fromRoute: 'map-selected' };
    const reading = getSeriesReadingState(binance, [{ id: binance.existingArticleId, categoryId: 'crypto' }], binance.existingArticleId, undefined, context);
    assert.equal(readUrl(reading.existingHref).searchParams.get('fromRoute'), 'map-selected');
    assert.equal(readUrl(reading.returnTo.href).searchParams.get('route'), 'map-selected');
    assert.equal(readUrl(reading.returnTo.href).hash, '#stage-trade');
    const fallback = getSeriesReadingState(binance, [], undefined, undefined, { ...context, fromRoute: 'https://evil.example' });
    assert.equal(readUrl(fallback.returnTo.href).searchParams.get('route'), 'map-default');
  } finally {
    articleSeries.pop();
  }
});
