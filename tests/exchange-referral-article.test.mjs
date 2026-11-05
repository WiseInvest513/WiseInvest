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
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const requireLocal = name => {
    if (name === 'fs') return fs;
    if (name === 'path') return path;
    const resolved = name.startsWith('@/') ? path.join(root, name.slice(2)) : path.resolve(path.dirname(filename), name);
    const file = ['.ts', '.tsx'].map(ext => resolved + ext).find(candidate => fs.existsSync(candidate));
    if (!file) throw new Error(`Unexpected dependency: ${name}`);
    return loadModule(path.relative(root, file));
  };
  new Function('require', 'module', 'exports', compiled)(requireLocal, module, module.exports);
  return module.exports;
}

const { getAllArticles, getArticleRoute } = loadModule('lib/articles.ts');
const { createArticlePreview } = loadModule('lib/article-preview.ts');
const { getArticleSeries, getSeriesArticleHref, getSeriesReadingState } = loadModule('lib/article-series.ts');
const articles = getAllArticles();
const article = articles.find(item => item.id === 'binance-referral');

test('Binance referral is a distinct article and the existing registration guide stays intact', () => {
  assert.ok(article);
  assert.equal(article.categoryId, 'crypto');
  assert.equal(getArticleRoute(article), '/articles/crypto/2WaKMVIz');
  assert.equal(getArticleRoute(articles.find(item => item.id === 'biance-guide')), '/articles/crypto/GaM38JYk');
  assert.equal(getSeriesArticleHref('exchange-referral', article), '/articles/crypto/2WaKMVIz?series=exchange-referral');
});

test('the very first block and unauthenticated preview disclose the existing-inviter restriction', () => {
  const firstBlock = article.content.split('\n\n')[0];
  assert.match(firstBlock, /^> \*\*先说结论/);
  assert.match(firstBlock, /已经绑定了邀请人/);
  assert.match(firstBlock, /不能.*更换/);
  const preview = createArticlePreview(article);
  assert.ok(preview.startsWith(firstBlock));
  assert.match(preview, /不要借用别人的身份证/);
});

test('the three dated routes retain the verified thresholds and application-versus-binding distinction', () => {
  assert.equal((article.content.match(/^## [三四五]、/gm) ?? []).length, 3);
  assert.match(article.content, /过去 180 天没有用于其他账户/);
  assert.match(article.content, /低于 5,000 美元或等值金额/);
  assert.match(article.content, /邀请方也须完成 KYC/);
  assert.match(article.content, /提交申请不等于绑定成功。从提交当天起算，30 天内累计达到 150,000 美元/);
  assert.match(article.content, /不计子账户、零手续费交易对/);
  assert.match(article.content, /注册已超过 90 天、从未绑定过邀请人/);
  assert.match(article.content, /没有使用任何币安产品/);
  assert.match(article.content, /2026 年 11 月 5 日/);
});

test('article explains the process without external links or invented URLs and screenshots', () => {
  assert.doesNotMatch(article.content, /https?:\/\/|(?:www\.)?binance\.com/i);
  assert.match(article.content, /\[交易所邀请码补填指南\]\(\/articles\/series\/exchange-referral\)/);
  assert.match(article.content, /向官方客服说明“注册时漏填邀请码，需要自助补绑”/);
  assert.match(article.content, /联系 Wise 获取当前专用链接/);
  assert.match(article.content, /联系 Wise 说明需要“老用户召回”/);
  assert.match(article.content, /可能获得平台佣金/);
  assert.doesNotMatch(article.content, /!\[[^\]]*\]\(|TODO|待补截图|bsmkweb/);
  const series = getArticleSeries('exchange-referral', article.id);
  const reading = getSeriesReadingState(series, articles, article.id);
  assert.equal(reading.publishedCount, 2);
  assert.equal(reading.next.articleId, 'bitget-referral');
  assert.equal(reading.next.href, '/articles/crypto/o85j85GH?series=exchange-referral');
  assert.ok([1, 3, 4].every(index => !reading.chapters[index].href));
});

test('the old guide points to the new article without contradicting Binance rules', () => {
  const oldGuide = fs.readFileSync(path.join(root, 'app/guide/exchange-referral/page.tsx'), 'utf8');
  assert.match(oldGuide, /genUid\("binance-referral"\)/);
  assert.match(oldGuide, /阅读完整币安补绑指南/);
  assert.match(oldGuide, /近 90 天低于 5,000 美元/);
  assert.match(oldGuide, /提交当天起 30 天内累计达到 15 万美元/);
  assert.doesNotMatch(oldGuide, /bsmkweb|不超过 5,000|补绑后 30 天|绑定后 30 天|可以使用其他身份/);
});
