import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const modules = new Map();
const Link = ({ children, href, prefetch, ...props }) => React.createElement('a', { href, ...props }, children);
const Image = ({ unoptimized, priority, ...props }) => React.createElement('img', props);
function loadModule(relativePath) {
  const filename = path.join(root, relativePath);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const requireMock = name => {
    if (name === 'fs') return fs;
    if (name === 'path') return path;
    if (name === 'react') return React;
    if (name === 'react/jsx-runtime') return jsxRuntime;
    if (name === 'next/link') return { __esModule: true, default: Link };
    if (name === 'next/image') return { __esModule: true, default: Image };
    if (name === '@/components/content-access-gate') return { ProtectedContentLink: props => React.createElement(Link, { ...props, 'data-protected': true }) };
    if (name === 'lucide-react') return new Proxy({}, { get: () => () => React.createElement('svg', { 'aria-hidden': true }) });
    if (name.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) };
    const resolved = name.startsWith('@/') ? path.join(root, name.slice(2)) : path.resolve(path.dirname(filename), name);
    const file = ['.ts', '.tsx'].map(extension => resolved + extension).find(candidate => fs.existsSync(candidate));
    if (file) return loadModule(path.relative(root, file));
    throw new Error(`Unexpected dependency: ${name}`);
  };
  new Function('require', 'module', 'exports', compiled)(requireMock, module, module.exports);
  return module.exports;
}

const { getAllArticles, toArticleListItem } = loadModule('lib/articles.ts');
const { getArticleSeries, getSeriesReadingState, getSeriesAvailabilityLabel } = loadModule('lib/article-series.ts');
const { SeriesNavigation, SeriesOverview } = loadModule('app/articles/series-reader.tsx');
const articles = getAllArticles().map(toArticleListItem);
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));

test('learning path directory defaults to one stage, with real button controls and protected map access', () => {
  const series = getArticleSeries('us-stock-funding');
  const reading = getSeriesReadingState(series, articles);
  const html = render(SeriesNavigation, { series, reading });
  assert.equal((html.match(/aria-expanded="true"/g) ?? []).length, 1);
  assert.equal((html.match(/aria-expanded="false"/g) ?? []).length, reading.stages.length - 1);
  assert.equal((html.match(/ hidden=""/g) ?? []).length, reading.stages.length - 1);
  const buttons = [...html.matchAll(/<button[^>]*aria-expanded="(true|false)"[^>]*aria-controls="([^"]+)"/g)];
  assert.equal(buttons[0][1], 'true');
  for (const [, expanded, id] of buttons) {
    assert.ok(html.includes(`<div id="${id}"${expanded === 'false' ? ' hidden=""' : ''} aria-labelledby="${id}-toggle">`));
  }
  assert.match(html, /href="\/roadmap[^>]+data-protected="true"/);
});

test('each article opens its own stage and navigation resets when article context changes', () => {
  const series = getArticleSeries('us-stock-funding');
  const overview = SeriesNavigation({ series, reading: getSeriesReadingState(series, articles) });
  for (const articleId of series.chapters.map(chapter => chapter.articleId)) {
    const reading = getSeriesReadingState(series, articles, articleId);
    const props = { series, reading, articleId };
    const html = render(SeriesNavigation, props);
    const expanded = [...html.matchAll(/<button[^>]*aria-expanded="(true|false)"/g)].map(match => match[1]);
    assert.equal(expanded.filter(value => value === 'true').length, 1);
    assert.equal(expanded[reading.currentStageIndex], 'true');
    assert.match(html, /class="chapter" aria-current="page"/);
    assert.notEqual(SeriesNavigation(props).key, overview.key);
  }
});

test('Binance exposes its existing guide before collapsed planning without inventing published chapters', () => {
  const series = getArticleSeries('binance');
  const reading = getSeriesReadingState(series, articles, series.existingArticleId);
  assert.equal(reading.publishedCount, 0);
  assert.equal(getSeriesAvailabilityLabel(series, reading), '综合教程已可读 · 独立章节筹备');
  for (const Component of [SeriesNavigation, SeriesOverview]) {
    const html = render(Component, { series, reading, articleId: series.existingArticleId, articles });
    assert.match(html, /综合教程已可读 · 独立章节筹备/);
    assert.ok(html.indexOf(`href="${reading.existingHref}"`) < html.indexOf('<details'));
    assert.doesNotMatch(html, /<details[^>]* open|6 篇已发布/);
    const planned = html.match(/<details[\s\S]*?<\/details>/)?.[0];
    assert.ok(planned);
    assert.doesNotMatch(planned, /<a /);
  }
  assert.match(render(SeriesNavigation, { series, reading, articleId: series.existingArticleId }), /class="supplement" aria-current="page"/);
});

test('published topic articles stay outside the collapsed planned section; missing guide is not advertised as readable', () => {
  const series = getArticleSeries('exchange-referral');
  const reading = getSeriesReadingState(series, articles);
  for (const Component of [SeriesNavigation, SeriesOverview]) {
    const html = render(Component, { series, reading, articles });
    const beforePlanning = html.split('<details')[0];
    for (const chapter of reading.chapters.filter(chapter => chapter.href)) assert.ok(beforePlanning.includes(`href="${chapter.href}"`));
    assert.doesNotMatch(html.match(/<details[\s\S]*?<\/details>/)?.[0] ?? '', /<a /);
  }
  const binance = getArticleSeries('binance');
  assert.doesNotMatch(getSeriesAvailabilityLabel(binance, getSeriesReadingState(binance, [])), /已可读|已发布/);
});
