import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function load(file, dependencies = {}) {
  const module = { exports: {} };
  const source = fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', compiled)(name => {
    if (name in dependencies) return dependencies[name];
    if (name === '@/lib/article-image-metadata.json') return JSON.parse(fs.readFileSync(new URL('../lib/article-image-metadata.json', import.meta.url), 'utf8'));
    if (name.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) };
    return require(name);
  }, module, module.exports);
  return module.exports;
}
const imageModule = load('components/article-image.tsx');
const { ArticleImage, shouldFoldArticleImage: fold } = imageModule;
const renderer = load('lib/article-renderer.tsx', {
  '@/components/article-image': imageModule,
  '@/components/article-registration-card': { ArticleRegistrationCard: () => null },
  '@/components/article-link-card': { ArticleLinkCard: () => null },
  '@/lib/article-registration': { parseRegistrationCallout: () => null },
  '@/lib/article-uid': { genUid: value => value },
});

test('real Fosun tall screenshots fold at article width on desktop and mobile', () => {
  for (const [width, height] of [[430, 1200], [675, 1200], [529, 1200], [779, 1200], [636, 900]]) {
    assert.equal(fold(width, height, 872, 448), true);
    assert.equal(fold(width, height, 326, 352), true);
  }
});

test('landscape illustrations, QR codes and small portrait images remain complete', () => {
  assert.equal(fold(1600, 900, 872, 448), false);
  assert.equal(fold(600, 600, 872, 448), false);
  assert.equal(fold(1280, 1600, 872, 448, false, '专属邀请二维码'), false);
  assert.equal(fold(800, 4000, 872, 448, false, '开户步骤与二维码'), true);
  assert.equal(fold(750, 1200, 244, 448), false);
  assert.equal(fold(750, 1200, 163, 352), false);
  assert.equal(fold(0, 0, 872, 448), false);
});

test('a screenshot can stop needing folding in a narrower layout; guide mode retains explicit height handling', () => {
  assert.equal(fold(800, 1200, 872, 448), true);
  assert.equal(fold(800, 1200, 200, 352), false);
  assert.equal(fold(1200, 900, 872, 448, true), true);
});

test('single, side-by-side, portrait and guide Markdown images use the same viewer without duplicating images', () => {
  for (const [markdown, mode, count] of [
    ['![开户流程](/steps.jpg)', undefined, 1],
    ['![左图](/one.jpg) ![右图](/two.jpg)', undefined, 2],
    ['![portrait: 手机步骤](/phone.jpg)', undefined, 1],
    ['![BIT 图解](/bit.webp)', 'guide', 1],
  ]) {
    const html = renderToStaticMarkup(renderer.renderMarkdown(markdown, [], mode));
    assert.equal((html.match(/data-article-image=/g) ?? []).length, count);
    assert.equal((html.match(/<img\b/g) ?? []).length, count, 'closed viewers do not load duplicate original images');
    assert.equal((html.match(/aria-label="放大查看：/g) ?? []).length, count);
  }
  const portrait = renderToStaticMarkup(renderer.renderMarkdown('![portrait: 手机步骤](/phone.jpg)', []));
  assert.match(portrait, /w-\[260px\]/);
  assert.match(portrait, /alt="手机步骤"/);
  assert.doesNotMatch(portrait, /alt="portrait:/);
});

test('image previews are keyboard buttons and retain their original source and alt text', () => {
  const html = renderToStaticMarkup(createElement(ArticleImage, { src: '/original.png', alt: '证件提交示意' }));
  assert.match(html, /<button[^>]+aria-label="放大查看：证件提交示意"/);
  assert.match(html, /src="\/original.png"/);
  assert.match(html, /alt="证件提交示意"/);
  assert.match(html, /<dialog[^>]+aria-labelledby=/);
});

test('known local long images reserve their geometry before lazy image downloads', () => {
  const html = renderToStaticMarkup(createElement(ArticleImage, { src: '/content/articles/broker/fuxing/9.jpeg', alt: '入金福利详情' }));
  assert.match(html, /width="430"/);
  assert.match(html, /height="1200"/);
  assert.match(html, /data-long="true"/);
  assert.match(html, /data-pending="false"/);
});
