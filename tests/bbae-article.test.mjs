import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const markdownPath = path.join(root, 'content/articles/broker/BBAE/IBKR.md');
const markdown = fs.readFileSync(markdownPath, 'utf8');
const expectedTitle = '不用 CRS，不用地址证明、只需一天即可开户的 BBAE 证券，最全介绍、开户入金教程来了……';
const expectedImages = ['3.png', '4.png', '5.png', '6.png', '7.png', '8.png', '10.png', '11.png', '12.png', '13.png', '14.png', '16.png', '17.jpeg', '18.png'];

// Run the real loader, UID helper and landing metadata with only local access.
// A future database/network dependency must fail instead of running in this test.
function loadLocalModule(relativePath) {
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
    throw new Error(`Unexpected dependency in filesystem-only article test: ${name}`);
  };
  new Function('require', 'module', 'exports', 'process', compiled)(
    localRequire, module, module.exports, { cwd: () => root },
  );
  return module.exports;
}

const { loadFsArticles } = loadLocalModule('lib/articles-fs.ts');
const { genUid } = loadLocalModule('lib/article-uid.ts');
const { brokerageChannels } = loadLocalModule('app/vip/landing-content.ts');
const articles = loadFsArticles();
const article = articles.find(item => item.id === 'BBAE');

test('BBAE loads from its real Markdown with the original title and brokerage metadata', () => {
  assert.ok(article, 'The BBAE Markdown must be discoverable by loadFsArticles');
  assert.equal(article.title, expectedTitle);
  assert.equal(article.summary, expectedTitle);
  assert.equal(article.categoryId, 'broker');
  assert.equal(article.subcategoryId, 'us-broker');
  assert.equal(article.basePath, 'broker/BBAE');
  assert.equal(article.date, '2026-09-11');
  assert.equal(article.readTime, 38);
  assert.match(markdown, /^---\nid: BBAE\n/);
});

test('BBAE has a stable, unique canonical article URL', () => {
  assert.equal(genUid('BBAE'), 'I0AIBXus');
  assert.equal(`/articles/${article.categoryId}/${genUid(article.id)}`, '/articles/broker/I0AIBXus');
  assert.deepEqual(articles.filter(item => genUid(item.id) === 'I0AIBXus').map(item => item.id), ['BBAE']);
});

test('the VIP landing page links BBAE to its published tutorial rather than a pending entry', () => {
  const bbae = brokerageChannels.find(channel => channel.name === 'BBAE 证券');
  assert.deepEqual(bbae, {
    name: 'BBAE 证券',
    href: `/articles/${article.categoryId}/${genUid(article.id)}`,
    cta: '查看教程',
  });
  assert.doesNotMatch(bbae.cta, /筹备|待上线/);
});

test('adding the BBAE tutorial preserves the other four brokerage links and their order', () => {
  assert.deepEqual(brokerageChannels.map(channel => channel.name), [
    '银河证券', '腾达证券', '致富证券', '复星证券', 'BBAE 证券',
  ]);
  assert.deepEqual(brokerageChannels.slice(0, 4), [
    { name: '银河证券', href: '/perk/broker#a-share-broker', cta: '开户说明' },
    { name: '腾达证券', href: '/articles/broker/4k1kTctf', cta: '查看教程' },
    { name: '致富证券', href: '/articles/broker/GaobLP0X', cta: '查看教程' },
    { name: '复星证券', href: '/articles/broker/sQSbLRe8', cta: '查看教程' },
  ]);
});

test('all 14 image references resolve in order to existing public assets, including 17.jpeg', () => {
  const images = [...article.content.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)];
  assert.equal(images.length, 14);
  assert.deepEqual(images.map(([, , url]) => url), expectedImages.map(filename => `/content/articles/broker/BBAE/${filename}`));
  for (const [, caption, url] of images) {
    assert.ok(caption.trim().length >= 6, `Image needs a descriptive caption: ${url}`);
    assert.doesNotMatch(caption, /提供字幕|可选|^(?:图(?:片)?\s*)?\d+$|\.(?:png|jpe?g)$/i);
    const publicFile = path.join(root, 'public', url.slice(1));
    assert.ok(fs.statSync(publicFile).isFile(), `Missing public image: ${url}`);
    assert.ok(fs.statSync(publicFile).size > 0, `Empty public image: ${url}`);
  }
  assert.doesNotMatch(article.content, /!\[[^\]]*\]\(\.\//);
  assert.doesNotMatch(article.content, /\/api\/content\/articles\//);
});

test('the Markdown keeps images out of the server content directory and has no caption placeholders', () => {
  const sourceImages = [...markdown.matchAll(/!\[[^\]]*\]\(\.\/([^)]+)\)/g)].map(match => match[1]);
  assert.deepEqual(sourceImages, expectedImages);
  for (const filename of expectedImages) {
    assert.equal(fs.existsSync(path.join(path.dirname(markdownPath), filename)), false,
      `Images belong in public/, not traced server content: ${filename}`);
  }
  assert.doesNotMatch(markdown, /提供字幕\s*[（(]\s*可选\s*[）)]/);
  assert.doesNotMatch(article.content, /提供字幕/);
});

test('six primary sections and twelve subsections remain Markdown headings for the renderer and TOC', () => {
  const mainHeadings = [...article.content.matchAll(/^## (.+)$/gm)].map(match => match[1]);
  assert.deepEqual(mainHeadings, [
    '一、写在前面', '二、产品介绍', '三、开户', '四、入金', '五、福利', '六、写在最后',
  ]);
  const subheadings = [...article.content.matchAll(/^### (.+)$/gm)].map(match => match[1]);
  assert.equal(subheadings.length, 12);
  assert.ok(subheadings.includes('1、平台背景与券商主体'));
  assert.ok(subheadings.includes('2、注册账户与填写邀请码'));
  assert.ok(subheadings.includes('3、汇丰银行入金'));
  assert.ok(subheadings.includes('领取奖励与后续使用'));
  assert.doesNotMatch(article.content, /^# /m, 'The article page already renders the frontmatter title');
});

test('emphasis, invitation code and the SIPC note retain renderable Markdown syntax', () => {
  const strongPhrases = [...article.content.matchAll(/\*\*([^*\n]+)\*\*/g)].map(match => match[1]);
  assert.ok(strongPhrases.length >= 8);
  assert.ok(strongPhrases.includes('身份证'));
  assert.ok(strongPhrases.includes('Wise VIP 独家服务群'));
  assert.ok(strongPhrases.includes('付款附言'));
  assert.match(article.content, /`stiibsmu3`/);
  assert.match(article.content, /^> \*\*需要注意：\*\* SIPC /m);
});

test('bank tutorial videos use descriptive, clickable Markdown links', () => {
  const videos = [...article.content.matchAll(/(?<!!)\[([^\]]+)\]\((https:\/\/youtu\.be\/[^)]+)\)/g)];
  assert.deepEqual(videos.map(([, label, url]) => ({ label, url })), [
    { label: '查看实体银行开户教程', url: 'https://youtu.be/8zzn-IHIBIk?si=jzf-U5ZIWApagUHV' },
    { label: '查看虚拟银行开户教程', url: 'https://youtu.be/wqMChW__dyk?si=pjv8ztmAQLbWxpVj' },
  ]);
  assert.doesNotMatch(article.content, /^https?:\/\/youtu\.be\//m, 'Video links should not appear as bare URL paragraphs');
});
