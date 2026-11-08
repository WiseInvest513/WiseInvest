import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const modules = new Map();
const jsx = (type, props) => ({ type, props });

function loadModule(relativePath) {
  const filename = path.join(root, relativePath);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const requireMock = (name) => {
    if (name === 'fs') return fs;
    if (name === 'path') return path;
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'fragment' };
    if (name === 'react') return { useState: initial => [typeof initial === 'function' ? initial() : initial, () => {}], useId: () => 'series-nav-test', useEffect() {} };
    if (name === 'next/link') return { __esModule: true, default: 'a' };
    if (name === 'next/image') return { __esModule: true, default: 'img' };
    if (name === '@/components/content-access-gate') return { ProtectedContentLink: 'a', LoginRequiredDialog: () => null };
    if (name === 'lucide-react') return new Proxy({}, { get: (_, key) => `Icon.${String(key)}` });
    if (name.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) };
    const resolved = name.startsWith('@/') ? path.join(root, name.slice(2)) : path.resolve(path.dirname(filename), name);
    const file = ['.ts', '.tsx'].map(extension => resolved + extension).find(candidate => fs.existsSync(candidate));
    if (file) return loadModule(path.relative(root, file));
    throw new Error(`Unexpected dependency: ${name}`);
  };
  new Function('require', 'module', 'exports', compiled)(requireMock, module, module.exports);
  return module.exports;
}

const { articleSeries, getRecommendedArticles, searchArticleSeries } = loadModule('lib/article-library.ts');
const { getAllArticles, getArticleRoute, toArticleListItem } = loadModule('lib/articles.ts');
const articles = getAllArticles();
const listItems = articles.map(toArticleListItem);
const { getArticleSeries, getArticleLearningPaths, getMapArticleSeries, getSeriesOverviewHref, getSeriesArticleHref, getSeriesReadingState, isTopicSeriesArticle, getPrimaryArticleSeries, resolveArticleSeries } = loadModule('lib/article-series.ts');
const { LearningPathLinks, SeriesNavigation, SeriesOverview, SeriesPagination } = loadModule('app/articles/series-reader.tsx');
const { RoadmapLearning } = loadModule('components/roadmap-learning.tsx');

function renderedNodes(tree) {
  const nodes = [];
  function visit(node) {
    if (node === null || node === undefined || typeof node === 'boolean') return;
    if (Array.isArray(node)) return node.forEach(visit);
    if (typeof node !== 'object') { nodes.push(node); return; }
    if (typeof node.type === 'function') return visit(node.type(node.props));
    nodes.push(node);
    visit(node.props?.children);
  }
  visit(tree);
  return nodes;
}

const renderedText = tree => renderedNodes(tree).filter(node => typeof node !== 'object').join('');

test('recommendations use four real article IDs in the intended order and exact homepage copy', () => {
  const recommended = getRecommendedArticles([...listItems].reverse());
  assert.deepEqual(recommended.map(({ id, displayTitle, displaySummary }) => ({ id, displayTitle, displaySummary })), [
    {
      id: 'web-guide',
      displayTitle: '一篇带你玩转 Wise 旗下网站',
      displaySummary: '出海、投资与工具的使用入口，先从这里了解。',
    },
    {
      id: 'VIP',
      displayTitle: 'Wise VIP 体系介绍',
      displaySummary: '了解服务内容、研究工具与加入方式。',
    },
    {
      id: 'predict',
      displayTitle: '预测市场 Predict 从 0 到 1 入门',
      displaySummary: '从基础概念开始，理解预测市场的使用方式。',
    },
    {
      id: 'BBAE',
      displayTitle: 'BBAE 证券开户与使用指南',
      displaySummary: '账户开通、入金与基础功能，一篇了解。',
    },
  ]);
});

test('display overrides do not mutate published metadata, IDs or article routes', () => {
  const originalItems = structuredClone(listItems);
  for (const recommended of getRecommendedArticles(listItems)) {
    const original = listItems.find(article => article.id === recommended.id);
    const { displayTitle, displaySummary, ...metadata } = recommended;
    assert.deepEqual(metadata, original);
    assert.notEqual(displayTitle, original.title);
    assert.notEqual(displaySummary, original.summary);
    assert.equal(getArticleRoute(recommended), getArticleRoute(original));
    assert.ok(!Object.hasOwn(recommended, 'content'));
    assert.ok(!Object.hasOwn(recommended, 'lockedContent'));
  }
  assert.deepEqual(listItems, originalItems);
  assert.equal(getArticleRoute(getRecommendedArticles(listItems).find(article => article.id === 'BBAE')), '/articles/broker/I0AIBXus');
});

test('missing source articles are omitted without inventing placeholder entries', () => {
  assert.deepEqual(getRecommendedArticles([]), []);
  const partial = listItems.filter(article => ['predict', 'BBAE'].includes(article.id));
  assert.deepEqual(getRecommendedArticles(partial).map(article => article.id), ['predict', 'BBAE']);
  const duplicate = [...partial, partial[0]];
  assert.equal(getRecommendedArticles(duplicate).length, 2);
});

test('series are clearly planned metadata, with no fabricated chapters, articles or routes', () => {
  // Binance keeps an existing comprehensive guide plus unlinked chapter plans; it is updating, not a hollow planned shell.
  assert.deepEqual(articleSeries.filter(series => series.status === 'planned').map(({ id }) => id), []);
  const binance = articleSeries.find(series => series.id === 'binance');
  assert.equal(binance.status, 'updating');
  assert.equal(binance.existingArticleId, 'biance-guide');
  assert.ok(binance.chapters.every(chapter => !chapter.articleId));
  assert.ok(binance.chapters.every(chapter => chapter.summary && /规划中/.test(chapter.summary)));
  assert.ok(!articles.some(article => article.id === 'binance'), 'a series plan must not become a published article');
  assert.ok(!Object.hasOwn(binance, 'content'));
  const crypto = articleSeries.find(series => series.id === 'crypto-basics');
  assert.equal(crypto.status, 'updating');
  assert.deepEqual(crypto.chapters.map(chapter => chapter.articleId), [
    'crypto-first-steps', 'crypto-buying-platforms', 'crypto-c2c-funding', 'crypto-spot-futures', 'crypto-transfer-basics',
  ]);
  assert.ok(crypto.chapters.every(chapter => articles.some(article => article.id === chapter.articleId)));
  assert.equal(articleSeries[1].chapters.length, 6);
  assert.ok(!Object.hasOwn(articleSeries[0], 'existingArticleId'));
});

test('the existing Binance guide remains a separate real article, not six repeated chapter links', () => {
  const binance = articleSeries.find(series => series.id === 'binance');
  assert.equal(binance.existingArticleId, 'biance-guide');
  const existing = articles.find(article => article.id === binance.existingArticleId);
  assert.ok(existing);
  assert.equal(getArticleRoute(existing), '/articles/crypto/GaM38JYk');
  assert.ok(binance.chapters.every(chapter => !chapter.articleId));
  for (const topic of ['产品介绍', '注册', '认证', '安全', '入金', '买币', '福利政策', '常用产品', '钱包', '生态']) {
    assert.ok(binance.chapters.some(chapter => chapter.title.includes(topic)), `Missing planned topic: ${topic}`);
  }
});

test('series search covers titles, descriptions and planned chapter titles', () => {
  const ids = query => searchArticleSeries(query).map(series => series.id);
  assert.deepEqual(ids(''), articleSeries.map(series => series.id));
  assert.deepEqual(ids('出海'), ['overseas']);
  assert.deepEqual(ids('Google'), ['overseas', 'ai-reading']);
  assert.deepEqual(ids('  BINANCE  '), ['binance']);
  assert.deepEqual(ids('加密货币'), ['crypto-basics']);
  assert.deepEqual(ids('开户'), ['binance', 'investment-foundations', 'nasdaq-investing', 'us-stock-funding', 'hk-stock-funding', 'us-stock-zero-to-one']);
  assert.deepEqual(ids('波动'), ['crypto-basics']);
  assert.deepEqual(ids('钱包'), ['crypto-basics', 'binance', 'crypto-tools']);
  assert.deepEqual(ids('不存在的系列'), []);
  assert.deepEqual(ids('邀请码'), ['exchange-referral']);
  assert.deepEqual(ids('OKX'), ['exchange-referral', 'crypto-tools', 'us-stock-zero-to-one']);
  assert.deepEqual(ids('官方办理入口'), ['exchange-referral']);
});

test('the homepage model is dependency-free metadata and never loads article bodies', () => {
  const source = fs.readFileSync(path.join(root, 'lib/article-library.ts'), 'utf8');
  const parsed = ts.createSourceFile('article-library.ts', source, ts.ScriptTarget.Latest, true);
  assert.ok(!parsed.statements.some(statement => ts.isImportDeclaration(statement)));
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  }).outputText;
  assert.doesNotMatch(compiled, /require\(|readFile|loadFsArticles|\.mdx?\b/);
});

test('retained series cover assets remain available', () => {
  for (const series of articleSeries.filter(series => series.cover)) {
    const image = fs.readFileSync(path.join(root, 'public', series.cover));
    assert.equal(image.subarray(0, 4).toString(), 'RIFF');
    assert.equal(image.subarray(8, 12).toString(), 'WEBP');
    assert.ok(image.length < 150000);
  }
});

test('overseas chapters link to five distinct published tutorials', () => {
  const overseas = articleSeries.find(series => series.id === 'overseas');
  assert.equal(overseas.status, 'updating');
  assert.equal(overseas.chapters.length, 5);
  assert.equal(new Set(overseas.chapters.map(chapter => chapter.articleId)).size, 5);
  for (const chapter of overseas.chapters) {
    const article = articles.find(article => article.id === chapter.articleId);
    assert.ok(article, `Missing article: ${chapter.articleId}`);
    assert.match(getArticleRoute(article), /^\/articles\/(outside|simcard)\/[a-zA-Z0-9]{8}$/);
  }
});

test('series context accepts only known series and articles belonging to them', () => {
  assert.equal(getArticleSeries('overseas', 'google-id')?.id, 'overseas');
  assert.equal(getArticleSeries('binance', 'biance-guide')?.id, 'binance');
  for (const invalid of [undefined, ['overseas'], 'unknown', '__proto__']) assert.equal(getArticleSeries(invalid), undefined);
  assert.equal(getArticleSeries('overseas', 'VIP'), undefined);
  assert.equal(getArticleSeries('binance', 'google-id'), undefined);
});

test('series chapter links preserve canonical article paths and carry context through previous/next', () => {
  const series = getArticleSeries('overseas');
  series.chapters.forEach((chapter, index) => {
    const state = getSeriesReadingState(series, listItems, chapter.articleId);
    assert.equal(state.currentIndex, index);
    assert.equal(state.publishedCount, 5);
    assert.equal(state.previous?.articleId, series.chapters[index - 1]?.articleId);
    assert.equal(state.next?.articleId, series.chapters[index + 1]?.articleId);
    const article = articles.find(item => item.id === chapter.articleId);
    assert.equal(state.chapters[index].href, `${getArticleRoute(article)}?series=overseas`);
    assert.equal(getSeriesArticleHref(series.id, article), state.chapters[index].href);
  });
});

test('unpublished or missing chapters have no href and are skipped by reading navigation', () => {
  const series = getArticleSeries('overseas');
  const partial = listItems.filter(article => article.id !== 'AppleID');
  const state = getSeriesReadingState(series, partial, 'google-id');
  assert.equal(state.chapters[1].href, undefined);
  assert.equal(state.next.articleId, 'giffgaff-guide');
  assert.equal(getSeriesReadingState(series, [], 'google-id').currentIndex, -1);
  assert.equal(getSeriesReadingState(series, []).first, undefined);
  const binance = getSeriesReadingState(getArticleSeries('binance'), listItems);
  assert.equal(binance.first, undefined);
  assert.equal(binance.publishedCount, 0);
  assert.equal(binance.existingHref, '/articles/crypto/GaM38JYk?series=binance');
  assert.ok(binance.chapters.every(chapter => !chapter.href));
});

test('exchange referral publishes Binance and Bitget while skipping three unlinked plans', () => {
  const series = getArticleSeries('exchange-referral');
  assert.equal(series.kind, 'topic');
  assert.equal(series.status, 'updating');
  assert.equal(series.chapters.length, 5);
  assert.equal(series.chapters[0].articleId, 'binance-referral');
  assert.equal(series.chapters[2].articleId, 'bitget-referral');
  assert.deepEqual([1, 3, 4].map(index => Object.keys(series.chapters[index]).sort()), Array.from({ length: 3 }, () => ['summary', 'title']));
  assert.ok([1, 3, 4].every(index => /待补写/.test(series.chapters[index].summary)));
  assert.match(series.introduction, /各平台规则独立核实/);
  const article = articles.find(item => item.id === 'binance-referral');
  assert.ok(article, 'The linked Binance article must actually exist');
  const reading = getSeriesReadingState(series, listItems, article.id);
  assert.equal(reading.publishedCount, 2);
  assert.equal(reading.currentIndex, 0);
  assert.equal(reading.first.href, `${getArticleRoute(article)}?series=exchange-referral`);
  assert.equal(reading.previous, undefined);
  assert.equal(reading.next.articleId, 'bitget-referral');
  assert.equal(reading.next.href, '/articles/crypto/o85j85GH?series=exchange-referral');
  assert.ok([1, 3, 4].every(index => reading.chapters[index].href === undefined));
  const bitget = articles.find(item => item.id === 'bitget-referral');
  assert.ok(bitget, 'The linked Bitget article must actually exist');
  assert.equal(getArticleRoute(bitget), '/articles/crypto/o85j85GH');
  const bitgetReading = getSeriesReadingState(series, listItems, bitget.id);
  assert.equal(bitgetReading.currentIndex, 2);
  assert.equal(bitgetReading.publishedCount, 2);
  assert.equal(bitgetReading.previous.articleId, 'binance-referral');
  assert.equal(bitgetReading.previous.href, '/articles/crypto/2WaKMVIz?series=exchange-referral');
  assert.equal(bitgetReading.next, undefined);
  assert.equal(getArticleSeries('exchange-referral', 'biance-guide'), undefined);
});

test('topic navigation uses neutral reading copy and omits an empty learning-outcomes section', () => {
  const series = getArticleSeries('exchange-referral');
  const available = ['binance-referral', 'bitget-referral'].map(id => ({ id, categoryId: 'crypto' }));
  const reading = getSeriesReadingState(series, available, 'binance-referral');
  const context = { series, reading, articleId: 'binance-referral' };
  const overview = SeriesOverview(context);
  const text = renderedText(overview);
  assert.match(text, /2 篇已发布 · 5 篇内容/);
  assert.match(text, /开始阅读/);
  assert.match(text, /内容目录/);
  assert.doesNotMatch(text, /开始学习|学习目录|你将在这个系列学到/);
  assert.ok(!renderedNodes(overview).some(node => node?.props?.id === 'series-learning-heading'));
  assert.equal(renderedNodes(overview).filter(node => node?.props?.['aria-disabled'] === 'true').length, 3);
  assert.match(renderedText(SeriesNavigation(context)), /第 1 篇/);
  assert.match(renderedText(SeriesPagination({ ...context, compact: true })), /第 1 \/ 5 篇/);
  assert.equal(renderedNodes(SeriesPagination({ ...context, compact: true })).filter(node => node?.type === 'button' && node.props.disabled).length, 1);
  const lastContext = { series, reading: getSeriesReadingState(series, available, 'bitget-referral'), articleId: 'bitget-referral' };
  assert.match(renderedText(SeriesPagination(lastContext)), /后续文章持续更新/);
  assert.match(renderedText(SeriesPagination({ ...lastContext, compact: true })), /第 3 \/ 5 篇/);
});

test('topic classification stays independent from per-article reading guides', () => {
  for (const id of ['binance-referral', 'bitget-referral']) assert.equal(isTopicSeriesArticle(id), true);
  for (const id of ['biance-guide', 'bitget-exchange', 'google-id', 'VIP', 'unknown', undefined, ['bitget-referral']]) {
    assert.equal(isTopicSeriesArticle(id), false);
  }
  const source = fs.readFileSync(path.join(root, 'app/articles/articles-content.tsx'), 'utf8');
  assert.match(source, /const guideProfile = selectedArticle\?\.guideProfile;/);
  assert.doesNotMatch(source, /shouldShowGuideProfile|defaultGuideProfile/);
});

test('tutorial series retain their chapter and learning language', () => {
  const series = getArticleSeries('overseas');
  const reading = getSeriesReadingState(series, listItems, 'google-id');
  const context = { series, reading, articleId: 'google-id' };
  assert.match(renderedText(SeriesOverview(context)), /开始学习/);
  assert.match(renderedText(SeriesOverview(context)), /你将在这个系列学到/);
  assert.match(renderedText(SeriesOverview(context)), /学习目录/);
  assert.match(renderedText(SeriesNavigation(context)), /第 1 章/);
  assert.match(renderedText(SeriesPagination({ ...context, compact: true })), /第 1 \/ 5 章/);
});

test('learning paths group distinct published articles into valid stages and allow only the named bank placeholder', () => {
  const paths = articleSeries.filter(series => series.kind === 'path');
  assert.equal(paths.length, 8);
  for (const series of paths) {
    assert.equal(series.status, 'updating');
    assert.equal(new Set(series.chapters.map(chapter => chapter.articleId)).size, series.chapters.length);
    assert.equal(new Set(series.stages.map(stage => stage.id)).size, series.stages.length);
    assert.ok(fs.existsSync(path.join(root, 'public', series.artwork)));
    for (const chapter of series.chapters) {
      assert.ok(series.stages.some(stage => stage.id === chapter.stageId), `Missing stage ${chapter.stageId}`);
      assert.ok(!Object.hasOwn(chapter, 'content'), 'existing article bodies must not be duplicated');
      if (!chapter.articleId) {
        assert.equal(series.id, 'us-stock-zero-to-one');
        assert.deepEqual(chapter, { title: '华美银行开户', stageId: 'banks', summary: '规划中（不可点开）：华美／East West 开户文尚未发表，仅占位；勿当作已有教程。' });
        continue;
      }
      assert.ok(articles.some(article => article.id === chapter.articleId), `Missing ${chapter.articleId}`);
    }
    assert.equal(getSeriesReadingState(series, listItems).publishedCount, series.chapters.filter(chapter => chapter.articleId).length);
  }
});

test('the independent US investing curriculum starts with the new introduction and finishes with the existing full guide', () => {
  const series = getArticleSeries('us-stock-zero-to-one');
  const reading = getSeriesReadingState(series, listItems);
  assert.equal(series.title, '美股从 0~1 投资开户教程');
  assert.deepEqual(reading.stages.map(stage => stage.id), ['start', 'accounts', 'banks', 'brokers', 'exchanges', 'practice']);
  assert.equal(reading.first.articleId, 'us-stock-start');
  assert.equal(reading.chapters.at(-1).articleId, 'us-guide');
  assert.equal(reading.publishedCount, 27);
  assert.equal(reading.existingHref, undefined, 'the concluding comprehensive guide must not replace the starting lesson');
  assert.deepEqual(reading.stages.at(-1).chapters.map(chapter => chapter.articleId), ['us-stock-account-basics', 'us-stock-first-order', 'us-stock-money-status', 'ifas-fuxing', 'us-guide']);
  for (const chapter of reading.chapters.filter(chapter => chapter.href)) {
    const article = articles.find(item => item.id === chapter.articleId);
    assert.equal(chapter.href, `${getArticleRoute(article)}?series=us-stock-zero-to-one`);
  }
  assert.equal(getArticleLearningPaths('ifast-guide')[0].id, 'us-stock-funding');
  assert.equal(getArticleLearningPaths('futu-broker')[0].id, 'hk-stock-funding');
  assert.equal(getMapArticleSeries('traditional-us-stocks').id, 'us-stock-funding');
  assert.equal(getMapArticleSeries('hk-card-to-hk-broker').id, 'hk-stock-funding');
});

test('the East West Bank chapter is visible planning, never a fake article link or next-reading destination', () => {
  const series = getArticleSeries('us-stock-zero-to-one');
  const reading = getSeriesReadingState(series, listItems, 'tianxing-register');
  const placeholder = reading.chapters.find(chapter => chapter.title === '华美银行开户');
  assert.equal(placeholder.articleId, undefined);
  assert.equal(placeholder.href, undefined);
  assert.equal(reading.chapters.filter(chapter => !chapter.href).length, 1);
  assert.equal(reading.next.articleId, 'futu-broker');
  const overview = renderedNodes(SeriesOverview({ series, reading, articles: listItems }));
  const planning = overview.find(node => node?.props?.['aria-disabled'] === 'true' && renderedText(node).includes('华美银行开户'));
  assert.ok(planning, 'the bank placeholder stays visible and explicitly disabled');
  assert.ok(!renderedNodes(planning).some(node => node?.props?.href));
  assert.match(renderedText(planning), /筹备|待更新/);
  assert.ok(!articles.some(article => /华美银行/.test(article.title)), 'the series placeholder must not publish an empty bank article');
});

test('a series overview opens its first stage instead of matching a planned chapter with no article ID', () => {
  const series = getArticleSeries('us-stock-zero-to-one');
  for (const articleId of [undefined, '', 'unknown-article']) {
    const reading = getSeriesReadingState(series, listItems, articleId);
    assert.equal(reading.currentIndex, -1);
    assert.equal(reading.currentStageIndex, -1);
    const stages = renderedNodes(SeriesNavigation({ series, reading, articleId }))
      .filter(node => node?.type === 'button' && Object.hasOwn(node.props, 'aria-expanded'));
    assert.deepEqual(stages.map(node => node.props['aria-expanded']), [true, false, false, false, false, false]);
  }
  assert.equal(getSeriesReadingState(series, listItems, 'tianxing-register').currentStageIndex, 2);
  assert.equal(getSeriesReadingState(series, listItems, 'bit-account-guide').currentStageIndex, 3);
  const unavailable = getSeriesReadingState(series, listItems.filter(article => article.id !== 'tianxing-register'), 'tianxing-register');
  assert.equal(unavailable.currentIndex, -1);
  assert.equal(unavailable.currentStageIndex, -1, 'an unavailable article cannot mark a stage as actively being read');
});

test('map associations are unique and resolve to real map presets', () => {
  const source = ts.createSourceFile('CapitalFlowMap.tsx', fs.readFileSync(path.join(root, 'components/CapitalFlowMap.tsx'), 'utf8'), ts.ScriptTarget.Latest, true);
  let routeIds = [];
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'routes') {
      routeIds = node.initializer.elements.map(route => route.properties.find(property => property.name.getText(source) === 'id').initializer.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  const mapped = articleSeries.flatMap(series => series.mapRouteIds ?? []);
  assert.equal(new Set(mapped).size, mapped.length);
  for (const id of mapped) {
    assert.ok(routeIds.includes(id), `Missing map route ${id}`);
    assert.ok(getMapArticleSeries(id).mapRouteIds.includes(id));
  }
  assert.equal(getMapArticleSeries('unknown'), undefined);
});

test('article links and series overviews retain the selected map route with an allowlisted fallback', () => {
  const series = getArticleSeries('us-stock-funding');
  const article = articles.find(item => item.id === 'ifast-guide');
  const state = getSeriesReadingState(series, listItems, article.id, 'traditional-us-stocks');
  assert.equal(state.mapHref, '/roadmap?route=traditional-us-stocks');
  assert.equal(state.overviewHref, '/articles/series/us-stock-funding?route=traditional-us-stocks');
  assert.equal(state.chapters[state.currentIndex].href, `${getArticleRoute(article)}?series=us-stock-funding&route=traditional-us-stocks`);
  assert.ok(state.chapters.every(chapter => chapter.href.endsWith('&route=traditional-us-stocks')));
  for (const route of ['https://example.com', 'onchain-ipo', ['traditional-us-stocks'], undefined]) {
    assert.equal(getSeriesReadingState(series, listItems, article.id, route).mapHref, '/roadmap?route=transfer-to-us-broker');
    assert.equal(getSeriesOverviewHref(series.id, route), '/articles/series/us-stock-funding?route=transfer-to-us-broker');
  }
  assert.equal(getSeriesReadingState(getArticleSeries('nasdaq-investing'), listItems).mapHref, '/roadmap');
  assert.equal(getSeriesReadingState(getArticleSeries('overseas'), listItems).mapHref, undefined);
});

test('path navigation separates alternative articles from the next stage', () => {
  const series = getArticleSeries('us-stock-funding');
  const reading = getSeriesReadingState(series, listItems, 'ifast-guide');
  const context = { series, reading, articleId: 'ifast-guide' };
  assert.equal(reading.stages[reading.currentStageIndex].id, 'accounts');
  const pagination = SeriesPagination(context);
  const text = renderedText(pagination);
  assert.match(text, /同阶段其他文章/);
  assert.match(text, /Wise 注册/);
  assert.match(text, /下一阶段选择券商/);
  assert.doesNotMatch(text, /下一篇/);
  assert.ok(renderedNodes(pagination).some(node => node.props?.href === '/articles/series/us-stock-funding?route=transfer-to-us-broker#stage-brokers'));
  assert.match(renderedText(SeriesNavigation(context)), /返回资金地图/);
  assert.ok(renderedText(SeriesOverview(context)).includes(`${reading.stages.length} 个阶段 · ${reading.publishedCount} 篇已有文章`));
});

test('Nasdaq starts with the existing book and canonical articles expose their learning paths', () => {
  const series = getArticleSeries('nasdaq-investing');
  const reading = getSeriesReadingState(series, listItems);
  assert.equal(reading.stages[0].resources[0].href, '/book/nasdaq');
  const nodes = renderedNodes(SeriesOverview({ series, reading }));
  assert.ok(nodes.some(node => node.props?.href === '/book/nasdaq'));
  assert.match(renderedText(SeriesOverview({ series, reading })), /阅读蓝皮书/);
  const afterBasics = renderedNodes(SeriesPagination({ series, reading: getSeriesReadingState(series, listItems, 'indexStock'), articleId: 'indexStock' }));
  assert.ok(afterBasics.some(node => node.props?.href === '/articles/series/nasdaq-investing#stage-compare'), 'the next learning stage remains reachable');
  assert.deepEqual(getArticleLearningPaths('indexStock').map(item => item.id), ['investment-foundations', 'nasdaq-investing']);
  assert.match(renderedText(LearningPathLinks({ articleId: 'indexStock' })), /投资基础起步/);
  assert.match(renderedText(LearningPathLinks({ articleId: 'indexStock' })), /纳指与标普：从入门到长期持有/);
  assert.equal(LearningPathLinks({ articleId: 'unknown' }), null);
});

test('the index curriculum covers all index lessons and the domestic ETF tutorial without duplicate chapters', () => {
  const series = getArticleSeries('nasdaq-investing');
  const reading = getSeriesReadingState(series, listItems);
  const indexIds = articles.filter(article => article.categoryId === 'index').map(article => article.id);
  const expectedIds = [...indexIds, 'galaxy-etf-guide'];
  assert.deepEqual(series.chapters.map(chapter => chapter.articleId).sort(), expectedIds.sort());
  assert.equal(new Set(series.chapters.map(chapter => chapter.articleId)).size, expectedIds.length);
  assert.deepEqual(reading.stages.map(stage => stage.id), ['understand', 'compare', 'practice']);
  const practice = reading.stages.find(stage => stage.id === 'practice');
  assert.deepEqual(practice.chapters.map(chapter => chapter.articleId), ['nasdaq-investment-guide', 'index-practice', 'galaxy-etf-guide', 'index-qa-2']);
  for (const id of ['idifferentIndex', 'index-guide', 'index-qa-1']) {
    assert.equal(series.chapters.find(chapter => chapter.articleId === id).stageId, 'compare');
  }
  for (const stage of reading.stages) {
    assert.ok(stage.chapters.some(chapter => chapter.href), `${stage.id} contains a real lesson`);
    for (const chapter of stage.chapters) {
      const article = articles.find(article => article.id === chapter.articleId);
      assert.equal(new URL(chapter.href, 'https://www.wise-invest.org').pathname, getArticleRoute(article));
    }
  }
});

test('map teaching panels include the crypto curriculum, contextual chapters and real fallback links', () => {
  const goals = renderedNodes(RoadmapLearning({ routeId: 'overview', articles: listItems, relatedArticles: [] }));
  assert.equal(goals.filter(node => node.type === 'a').length, 9);
  assert.ok(goals.some(node => node.type === 'a' && node.props.href.includes('/articles/series/crypto-basics')));
  const panel = RoadmapLearning({ routeId: 'traditional-us-stocks', articles: listItems, relatedArticles: [] });
  const publishedCount = getSeriesReadingState(getArticleSeries('us-stock-funding'), listItems).publishedCount;
  assert.ok(renderedText(panel).includes(`配套教程${publishedCount} 篇文章`));
  const links = renderedNodes(panel).filter(node => node.type === 'a');
  assert.equal(links.length, publishedCount + 1);
  assert.ok(links.every(node => node.props.href.includes('route=traditional-us-stocks')));
  const partial = RoadmapLearning({ routeId: 'traditional-us-stocks', articles: [], relatedArticles: [] });
  assert.equal(renderedNodes(partial).filter(node => node.type === 'a').length, 1, 'missing articles must not become working-looking links');
  const fallback = RoadmapLearning({ routeId: 'onchain-us-stocks', articles: listItems, relatedArticles: [{ title: '已有教程', href: '/articles/crypto/GaM38JYk' }] });
  assert.match(renderedText(fallback), /已有相关文章/);
  assert.equal(renderedNodes(fallback).find(node => node.type === 'a').props.href, '/articles/crypto/GaM38JYk');
  assert.equal(RoadmapLearning({ routeId: 'unknown', articles: listItems, relatedArticles: [] }), null);
});

test('bare article URLs resolve a focused series without requiring ?series=', () => {
  assert.equal(getPrimaryArticleSeries('Gate-vcard')?.id, 'crypto-tools');
  assert.equal(getPrimaryArticleSeries('BBAE')?.id, 'us-stock-funding');
  assert.equal(getPrimaryArticleSeries('google-id')?.id, 'overseas');
  assert.equal(getPrimaryArticleSeries('binance-referral')?.id, 'exchange-referral');
  // Mega curriculum stays opt-in
  assert.equal(getPrimaryArticleSeries('bit-account-guide'), undefined);
  assert.equal(resolveArticleSeries('us-stock-zero-to-one', 'BBAE')?.id, 'us-stock-zero-to-one');
  assert.equal(resolveArticleSeries(undefined, 'BBAE')?.id, 'us-stock-funding');
});
