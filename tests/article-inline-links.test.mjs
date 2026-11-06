import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = fs.readFileSync(new URL('../lib/article-renderer.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
const module = { exports: {} };
new Function('require', 'module', 'exports', compiled)(name => {
  if (name === '@/components/article-image') return { ArticleImage: () => null };
  if (name === '@/components/article-registration-card') return { ArticleRegistrationCard: () => null };
  if (name === '@/components/article-link-card') return { ArticleLinkCard: () => null };
  if (name === '@/lib/article-uid') return { genUid: id => id };
  if (name === '@/lib/article-registration') {
    const helper = { exports: {} };
    const helperSource = fs.readFileSync(new URL('../lib/article-registration.ts', import.meta.url), 'utf8');
    new Function('module', 'exports', ts.transpileModule(helperSource, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(helper, helper.exports);
    return helper.exports;
  }
  return require(name);
}, module, module.exports);
const { renderInline } = module.exports;

test('URL-valued Markdown labels render a single anchor without hydration-breaking nesting', () => {
  const url = 'https://appleid.apple.com/account';
  const html = renderToStaticMarkup(renderInline(`**注册地址**：[${url}](${url})`));
  assert.equal((html.match(/<a\b/g) ?? []).length, 1);
  assert.match(html, /<strong[^>]*>注册地址<\/strong>/);
  assert.ok(html.includes(`href="${url}"`));
  assert.ok(html.includes(`<span>${url}</span></a>`));
});

test('Markdown links retain label formatting while standalone URLs remain clickable', () => {
  const html = renderToStaticMarkup(renderInline('[**官网**与 `帮助`](https://example.com) https://example.org/help'));
  assert.equal((html.match(/<a\b/g) ?? []).length, 2);
  assert.match(html, /<strong[^>]*>官网<\/strong>/);
  assert.match(html, /<code[^>]*>帮助<\/code>/);
  assert.match(html, /href="https:\/\/example.org\/help"/);
  assert.doesNotMatch(html, /<a\b[^>]*>[^]*?<a\b[^>]*>[^]*?<\/a>[^]*?<\/a>/);
});
