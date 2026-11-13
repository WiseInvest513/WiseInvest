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

const { extractArticleBodyFaqs, getArticleFaqs, getAllArticles } = loadModule('lib/articles.ts');

test('extracts H3 questions under an FAQ heading and ignores a later non-FAQ section', () => {
  const faqs = extractArticleBodyFaqs(`---
title: demo
---

## 二、正文

不是问答。

## 七、常见问题

### 以太币怎么买？

和买 BTC 同一条路径。

[第一次买币去哪？](/articles/crypto/gHntO7zV){card}

### 以太币怎么玩？

先现货，不要一上来开合约。

## 八、接下来按自己的问题继续读

这里不是 FAQ。
`);
  assert.equal(faqs.length, 2);
  assert.equal(faqs[0].question, '以太币怎么买？');
  assert.match(faqs[0].answer, /和买 BTC 同一条路径/);
  assert.match(faqs[0].answer, /另见：第一次买币去哪？/);
  assert.equal(faqs[1].question, '以太币怎么玩？');
  assert.doesNotMatch(faqs[1].answer, /这里不是 FAQ/);
});

test('a heading that only mentions 问题 is not treated as an FAQ section', () => {
  const faqs = extractArticleBodyFaqs(`## 七、接下来按自己的问题继续读\n\n### 看起来像问题？\n\n不应被提取。\n`);
  assert.deepEqual(faqs, []);
});

test('the seven thickened crypto articles expose in-body FAQs instead of the generic crypto footer', () => {
  const articles = getAllArticles();
  const ids = [
    'crypto-buying-platforms',
    'okx-guide',
    'crypto-c2c-funding',
    'bitget-exchange',
    'crypto-spot-futures',
    'crypto-first-steps',
    'bybit-guide',
  ];
  const expected = {
    'crypto-buying-platforms': '比特币怎么买？',
    'okx-guide': 'OKX / 欧易官方怎么下载？',
    'crypto-c2c-funding': 'P2P 和 C2C 有什么区别？',
    'bitget-exchange': 'Bitget怎么注册？',
    'crypto-spot-futures': '现货和合约的区别是什么？',
    'crypto-first-steps': '以太币 / ETH 怎么买？',
    'bybit-guide': 'Bybit 还能注册吗？大陆可以吗？',
  };
  for (const id of ids) {
    const article = articles.find(item => item.id === id);
    assert.ok(article, `missing ${id}`);
    const faqs = getArticleFaqs(article);
    assert.ok(faqs.length > 0, `${id} should have body FAQs`);
    assert.ok(faqs.some(item => item.question === expected[id]), `${id} missing ${expected[id]}: ${faqs.map(item => item.question).join(' | ')}`);
    assert.ok(!faqs.some(item => item.question.includes('大陆用户注册交易所前要先看什么')), `${id} still returning generic footer FAQ`);
  }
});

test('prediction articles without a body FAQ still use the category Q&A', () => {
  const article = getAllArticles().find(item => item.categoryId === 'predict');
  assert.ok(article);
  const faqs = getArticleFaqs(article);
  assert.ok(faqs.some(item => item.question.includes('预测市场')));
  assert.ok(faqs.some(item => item.answer.includes('地区限制')));
});
