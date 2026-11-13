import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const modules = new Map();
function load(relative) {
  const filename = path.join(root, relative);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', compiled)(name => {
    if (name.endsWith('.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (name === '@/components/article-image') return { ArticleImage: () => null };
    if (name === '@/components/article-registration-card') return { ArticleRegistrationCard: props => createElement('aside', { 'data-registration': props.title }) };
    if (name === '@/components/content-access-gate') return {
      ProtectedContentLink: ({ prefetch: _prefetch, children, ...props }) => createElement('a', { ...props, 'data-protected-link': true }, children),
    };
    if (name.startsWith('@/') || name.startsWith('.')) {
      const base = name.startsWith('@/') ? path.join(root, name.slice(2)) : path.resolve(path.dirname(filename), name);
      const resolved = ['.ts', '.tsx'].map(ext => base + ext).find(file => fs.existsSync(file));
      assert.ok(resolved, `missing dependency: ${name}`);
      return load(path.relative(root, resolved));
    }
    return require(name);
  }, module, module.exports);
  return module.exports;
}

const { renderMarkdown, extractToc, genUid } = load('lib/article-renderer.tsx');
const { createContentPreview } = load('lib/content-access.ts');
const article = {
  id: 'linked-article-fixture', categoryId: 'index', title: '支付宝购买教程的真实标题',
  summary: '搜索基金、确认份额和检查实际扣款。', readTime: 8,
  coverImage: '/images/articles/covers/fixture.webp',
  content: '不得嵌入目标文章的私有正文', guideProfile: { prepare: '不得嵌入目标文章的完整导读' },
};
const href = `/articles/${article.categoryId}/${genUid(article.id)}`;
const cardLine = `[作者的短标签](${href}){card}`;
const series = {
  kind: 'series', id: 'linked-route-fixture', title: '美股账户准备与入金',
  summary: '按需选择银行、券商与入金教程。', articleCount: 9,
  coverImage: '/images/articles/series/fixture.webp',
  content: '不得嵌入系列中各篇文章的正文', chapters: [{ content: '不得嵌入隐藏的章节内容' }],
};
const seriesHref = `/articles/series/${series.id}`;
const seriesLine = `[作者的路线标签](${seriesHref}){card}`;
const render = (content, articles = [article], linkedSeries = [series]) => renderToStaticMarkup(renderMarkdown(content, extractToc(content), undefined, articles, linkedSeries));
const cardCount = html => (html.match(/data-article-link-card/g) ?? []).length;
const groupCount = html => (html.match(/data-article-link-group/g) ?? []).length;

test('nested-series cards and table links keep the parent stage without changing their presentation', () => {
  const { getArticleSeries, resolveSeriesResource } = load('lib/article-series.ts');
  const parent = getArticleSeries('nasdaq-investing');
  const target = '/articles/series/hk-stock-funding#stage-brokers';
  const content = `[港资路线](${target}){card}\n\n| 入口 | 说明 |\n| --- | --- |\n| [港资路线](${target}) | [官方资料](https://example.com/source) |`;
  const metadata = { ...series, id: 'hk-stock-funding' };
  const mapHref = href => resolveSeriesResource(href, parent, 'practice').href;
  const html = renderToStaticMarkup(renderMarkdown(content, [], undefined, [], [metadata], mapHref));
  assert.equal(cardCount(html), 1);
  assert.equal((html.match(/fromSeries=nasdaq-investing/g) ?? []).length, 2);
  assert.equal((html.match(/fromStage=practice/g) ?? []).length, 2);
  assert.match(html, /<td[^>]*><a[^>]+#stage-brokers/);
  assert.ok(html.includes('href="https://example.com/source"'));
  assert.doesNotMatch(html.match(/<table[\s\S]*?<\/table>/)?.[0] ?? '', /data-article-link-card/);
});

test('explicit standalone cards use public article metadata and the protected canonical link', () => {
  const tree = renderMarkdown(cardLine, [], undefined, [article]);
  const card = tree[0];
  assert.deepEqual(Object.keys(card.props.article).sort(), ['categoryId', 'coverImage', 'id', 'readTime', 'summary', 'title'].sort());
  const html = render(cardLine);
  assert.equal(cardCount(html), 1);
  assert.match(html, /data-protected-link="true"/);
  assert.ok(html.includes(`href="${href}"`));
  assert.ok(html.includes(article.title));
  assert.ok(html.includes(article.summary));
  assert.ok(html.includes(`src="${article.coverImage}"`));
  assert.match(html, /8 分钟阅读/);
  assert.doesNotMatch(html, /作者的短标签|私有正文|完整导读|\{card\}/);
});

test('same-site absolute card links normalize the host and preserve series context and heading anchors', () => {
  const suffix = '?series=nasdaq-investing#h-3';
  const html = render(`[继续阅读](https://www.wise-invest.org${href}${suffix}){card}`);
  assert.equal(cardCount(html), 1);
  assert.ok(html.includes(`href="${href}${suffix}"`));
  assert.doesNotMatch(html, /href="https:\/\/www\.wise-invest\.org/);
});

test('series cards use public route metadata and preserve stage and funding-route navigation', () => {
  const suffix = '?route=traditional-us-stocks#stage-brokers';
  const markdown = `[作者的路线标签](https://www.wise-invest.org${seriesHref}${suffix}){card}`;
  const tree = renderMarkdown(markdown, [], undefined, [article], [series]);
  assert.deepEqual(Object.keys(tree[0].props.article).sort(), ['articleCount', 'coverImage', 'id', 'kind', 'summary', 'title'].sort());
  const html = render(markdown);
  assert.equal(cardCount(html), 1);
  assert.ok(html.includes(`href="${seriesHref}${suffix}"`));
  assert.match(html, /data-protected-link="true"/);
  assert.ok(html.includes(series.title));
  assert.ok(html.includes(series.summary));
  assert.match(html, /系列教程/);
  assert.match(html, /9 篇文章/);
  assert.match(html, /查看路线/);
  assert.doesNotMatch(html, /作者的路线标签|分钟阅读|各篇文章的正文|隐藏的章节内容|\{card\}/);
  assert.equal(cardCount(render(seriesLine, [article], [])), 0, 'a route needs explicit metadata');
});

test('adjacent article and series cards share one group across blank lines without changing order', () => {
  const html = render(`${cardLine}\n\n${seriesLine}\n\n\n[再次阅读](${href}?series=linked-route-fixture#h-2){card}`);
  assert.equal(groupCount(html), 1);
  assert.equal(cardCount(html), 3);
  const destinations = [...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(destinations, [href, seriesHref, `${href}?series=linked-route-fixture#h-2`]);
});

test('ordinary prose separates card groups and remains in the original reading order', () => {
  const html = render(`${cardLine}\n${seriesLine}\n\n这里解释两个购买路径的差别。\n\n${seriesLine}\n${cardLine}`);
  assert.equal(groupCount(html), 2);
  assert.equal(cardCount(html), 4);
  assert.match(html, /<p\b[^>]*>[^]*这里解释两个购买路径的差别。/);
  const explanation = html.indexOf('这里解释两个购买路径的差别。');
  const groups = [...html.matchAll(/data-article-link-group/g)].map(match => match.index);
  assert.ok(groups[0] < explanation && explanation < groups[1]);
});

test('comparison-table references remain ordinary text links beside article and series cards', () => {
  const table = `| 购买方式 | 教程入口 |\n| --- | --- |\n| 支付宝 | [支付宝教程](${href}) |\n| 美资券商 | [开户路线](${seriesHref}#stage-brokers) |`;
  const html = render(`${cardLine}\n${seriesLine}\n\n${table}`);
  assert.equal(cardCount(html), 2);
  assert.equal(groupCount(html), 1);
  const tableHtml = html.match(/<table\b[^]*?<\/table>/)?.[0];
  assert.ok(tableHtml);
  assert.equal(cardCount(tableHtml), 0);
  assert.equal((tableHtml.match(/<a\b/g) ?? []).length, 2);
  assert.ok(tableHtml.includes(`href="${href}"`));
  assert.ok(tableHtml.includes(`href="${seriesHref}#stage-brokers"`));
  assert.match(tableHtml, /text-blue-600/);
  assert.doesNotMatch(tableHtml, /data-protected-link|data-article-link-group/);
});

test('ordinary text links, fenced examples and referral cards retain their original rendering', () => {
  const ordinary = render(`看[这篇教程](${href})了解细节。\n\n[独立的文字链接](${href})`);
  assert.equal(cardCount(ordinary), 0);
  assert.equal((ordinary.match(/<a\b/g) ?? []).length, 2);
  assert.match(ordinary, /text-blue-600/);
  const example = render('```markdown\n' + cardLine + '\n```');
  assert.equal(cardCount(example), 0);
  assert.equal((example.match(/<a\b/g) ?? []).length, 0);
  assert.ok(example.includes('{card}'));
  const referral = render('> [注册 BIT 账户](https://invest.matrixport.com/newRegister/cn?invite_code=WISE666) · 邀请码：**WISE666**');
  assert.equal(cardCount(referral), 0);
  assert.match(referral, /data-registration="注册 BIT 账户"/);
});

test('missing articles, wrong categories, external sites and series routes fall back to ordinary links', () => {
  const targets = [
    '/articles/index/missing1',
    href.replace('/index/', '/broker/'),
    `https://example.org${href}`,
    `https://www.wise-invest.org.evil.example${href}`,
    '/articles/series/nasdaq-investing',
  ];
  for (const target of targets) {
    const html = render(`[继续阅读](${target}){card}`);
    assert.equal(cardCount(html), 0, target);
    assert.ok(html.includes(`href="${target}"`), target);
    assert.match(html, /继续阅读/);
    assert.doesNotMatch(html, /\{card\}|支付宝购买教程的真实标题/);
  }
  assert.equal(cardCount(render(cardLine, [])), 0, 'metadata is required before a card is advertised');
});

test('cards neither add headings nor shift article TOC anchors', () => {
  const markdown = `## 一、选择渠道\n\n${cardLine}\n\n## 二、继续操作`;
  const toc = extractToc(markdown);
  assert.deepEqual(toc.map(({ id, level }) => [id, level]), [['h-0', 2], ['h-1', 2]]);
  const html = render(markdown);
  assert.equal(cardCount(html), 1);
  assert.equal((html.match(/<h[1-6]\b/g) ?? []).length, 2);
  assert.match(html, /id="h-1"/);
});

test('rendering an access-limited preview does not discover cards or private text after its cutoff', () => {
  const content = `## 一、公开预览\n\n${'这是允许阅读的正文。'.repeat(100)}\n\n${cardLine}\n\n隐藏的源文章正文`;
  const preview = createContentPreview(content, 180);
  assert.ok(!preview.includes('{card}'));
  const html = render(preview);
  assert.equal(cardCount(html), 0);
  assert.doesNotMatch(html, /隐藏的源文章正文|私有正文|完整导读|支付宝购买教程的真实标题/);
  assert.equal(cardCount(render(content)), 1, 'the complete source contains the later card');
  const mixedContent = `## 一、公开预览\n\n${cardLine}\n\n${'这是允许阅读的正文。'.repeat(100)}\n\n${seriesLine}`;
  const limited = render(createContentPreview(mixedContent, 300));
  assert.equal(cardCount(limited), 1, 'only the article card preceding the cutoff remains visible');
  assert.doesNotMatch(limited, /美股账户准备与入金|各篇文章的正文|隐藏的章节内容/);
});

test('missing or remote covers retain a readable title and link without requesting another article image', () => {
  for (const coverImage of [undefined, 'https://example.org/private-body-image.png']) {
    const html = render(cardLine, [{ ...article, coverImage }]);
    assert.equal(cardCount(html), 1);
    assert.ok(html.includes(article.title));
    assert.ok(html.includes(`href="${href}"`));
    assert.doesNotMatch(html, /<img\b|private-body-image/);
  }
});

test('the Nasdaq purchase guide renders its authored article and route cards in order while retaining any table links', () => {
  const { getAllArticles, toArticleListItem } = load('lib/articles.ts');
  const { articleSeries } = load('lib/article-library.ts');
  const { getSeriesReadingState } = load('lib/article-series.ts');
  const articles = getAllArticles();
  const guide = articles.find(item => item.id === 'nasdaq-investment-guide');
  assert.ok(guide);
  const linkedSeries = articleSeries.map(item => {
    const reading = getSeriesReadingState(item, articles);
    return {
      kind: 'series', id: item.id, title: item.title, summary: item.description,
      articleCount: reading.publishedCount || (reading.existingHref ? 1 : 0),
      coverImage: item.cardArtwork ?? item.cover ?? item.artwork,
    };
  });
  const articleLinks = /\[[^\]]+\]\((\/articles\/[^)]+)\)/g;
  const lines = guide.content.split('\n');
  const cards = lines.flatMap(line => {
    const match = line.trim().match(/^\[[^\]]+\]\((\/articles\/[^)]+)\)\{card\}$/);
    return match ? [{ href: match[1], kind: match[1].startsWith('/articles/series/') ? 'series' : 'article' }] : [];
  });
  assert.ok(cards.some(card => card.kind === 'article'), 'the guide includes article references');
  assert.ok(cards.some(card => card.kind === 'series'), 'the guide includes series references');
  const plainBodyLinks = lines.filter(line => !line.trim().startsWith('|') && !line.trim().endsWith('{card}'))
    .flatMap(line => [...line.matchAll(articleLinks)]);
  assert.deepEqual(plainBodyLinks, [], 'all non-table site article and series references opt into cards');
  const tableLinks = lines.filter(line => line.trim().startsWith('|'))
    .flatMap(line => [...line.matchAll(articleLinks)].map(match => match[1]));

  const html = render(guide.content, articles.map(toArticleListItem), linkedSeries);
  assert.equal(cardCount(html), cards.length, 'every requested card resolves to an existing article or series');
  const renderedCards = [...html.matchAll(/<a\b[^>]*data-article-link-card[^>]*>/g)].map(([tag]) => ({
    href: tag.match(/href="([^"]+)"/)?.[1].replace(/&amp;/g, '&'),
    kind: tag.match(/data-link-kind="([^"]+)"/)?.[1],
  }));
  assert.deepEqual(renderedCards, cards, 'each card retains its authored destination, order and content type');
  const tables = [...html.matchAll(/<table\b[^]*?<\/table>/g)].map(match => match[0]).join('');
  assert.equal(cardCount(tables), 0);
  const renderedTableLinks = [...tables.matchAll(/<a\b[^>]*href="(\/articles\/[^\"]+)"/g)]
    .map(match => match[1].replace(/&amp;/g, '&'));
  assert.deepEqual(renderedTableLinks, tableLinks);
  assert.equal((html.match(/data-registration=/g) ?? []).length, 1, 'the BIT invitation remains a separate referral card');
  assert.equal((html.match(/<h2\b/g) ?? []).length, 11);
  assert.equal((html.match(/<h3\b/g) ?? []).length, 12);
  assert.doesNotMatch(html, /\{card\}/);
});

test('published article references resolve to cards across the library, with table and same-page anchors kept as text', () => {
  const { getAllArticles, getArticleRoute, toArticleListItem } = load('lib/articles.ts');
  const { articleSeries } = load('lib/article-library.ts');
  const { getSeriesReadingState } = load('lib/article-series.ts');
  const articles = getAllArticles();
  const linkedArticles = articles.map(toArticleListItem);
  const linkedSeries = articleSeries.map(item => {
    const reading = getSeriesReadingState(item, articles);
    return {
      kind: 'series', id: item.id, title: item.title, summary: item.description,
      articleCount: reading.publishedCount || (reading.existingHref ? 1 : 0),
      coverImage: item.cardArtwork ?? item.cover ?? item.artwork,
    };
  });
  const targets = new Map([
    ...linkedArticles.map(item => [getArticleRoute(item), item]),
    ...linkedSeries.map(item => [`/articles/series/${item.id}`, item]),
  ]);
  let checkedCards = 0;
  for (const source of articles) {
    const html = render(source.content, linkedArticles, linkedSeries);
    const tables = [...html.matchAll(/<table\b[^]*?<\/table>/g)].map(match => match[0]).join('');
    assert.equal(cardCount(tables), 0, `${source.id}: table links must stay compact text`);
    const body = html.replace(/<table\b[^]*?<\/table>|<pre\b[^]*?<\/pre>/g, '');
    for (const [, attributes, rawHref] of body.matchAll(/<a\b([^>]*?href="([^"]+)"[^>]*)>/g)) {
      const url = new URL(rawHref.replace(/&amp;/g, '&'), 'https://www.wise-invest.org');
      if (url.origin !== 'https://www.wise-invest.org' || !/^\/articles\/[^/]+\/[^/]+$/.test(url.pathname)) continue;
      if (url.pathname === getArticleRoute(source) && url.hash) continue;
      const target = targets.get(url.pathname);
      assert.ok(target, `${source.id}: missing article/series target ${url.pathname}`);
      assert.match(attributes, /data-article-link-card/, `${source.id}: unconverted reference ${url.href}`);
      assert.ok(target.title && target.summary, `${source.id}: card metadata is incomplete`);
      assert.ok(target.coverImage?.startsWith('/images/'), `${source.id}: missing local card cover`);
      assert.ok(fs.existsSync(path.join(root, 'public', target.coverImage)), `${source.id}: cover file missing`);
      checkedCards++;
    }
    assert.doesNotMatch(body, /\{card\}/, `${source.id}: unparsed card markup`);
  }
  assert.ok(checkedCards > 0, 'exercise the real published reference inventory');
});
