import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import sharp from 'sharp';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = fs.readFileSync(path.join(root, 'content/articles/domestic/galaxy-etf/galaxy-etf-guide.md'), 'utf8');
const body = source.replace(/^---[\s\S]*?---\s*/, '');

test('Galaxy article preserves the channel conditions and separates ETF from stocks', () => {
  assert.match(source, /^id: galaxy-etf-guide$/m);
  assert.match(source, /^categoryId: domestic$/m);
  assert.deepEqual([...body.matchAll(/^## ([一二三四五六])、/gm)].map(match => match[1]), [...'一二三四五六']);
  assert.match(body, /1\.5 万元/);
  assert.match(body, /留存 2 个月/);
  assert.match(body, /可申请.*ETF \/ LOF 永久免五/);
  assert.match(body, /股票佣金.*万 0\.86，仍然每笔 5 元起/);
  assert.match(body, /不是所有银河账户开户后自动享有/);
  assert.match(body, /不是三家券商给每位客户的最终报价/);
  assert.match(body, /买入和卖出分别计费/);
});

test('all published commission examples isolate the minimum fee and calculate correctly', () => {
  const rows = [...body.matchAll(/^\| ([\d,]+) 元 \| ([\d.]+) 元 \| ([\d.]+) 元 \| ([\d.]+) 元 \|$/gm)];
  assert.equal(rows.length, 6);
  for (const [, amountText, oldText, channelText, savingText] of rows) {
    const amount = Number(amountText.replaceAll(',', ''));
    const ordinary = Math.max(amount * 0.00005, 5);
    const channel = Math.max(amount * 0.00005, 0.1);
    assert.equal(Number(oldText), ordinary);
    assert.equal(Number(channelText), channel);
    assert.equal(Number(savingText), Number((ordinary - channel).toFixed(2)));
  }
  assert.match(body, /都为万 0\.5/);
  assert.match(body, /60 元.*1\.2 元.*58\.8 元/);
});

test('contact reuses the existing real QR, with no invented registration URL or embedded cover', () => {
  const images = [...body.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map(match => match[1]);
  assert.deepEqual(images, ['/images/微信图片520.png']);
  assert.ok(fs.statSync(path.join(root, 'public', images[0])).size > 0);
  assert.match(body, /!\[portrait: Wise 微信咨询二维码/);
  assert.match(body, /\[银河证券福利入口\]\(\/perk\/ipo#a-share-ipo\)/);
  assert.doesNotMatch(body, /邀请码：|\]\(https?:[^)]*(?:ref=|invite)/);
});

test('central list cover is 640 by 360, under 25 KB, and keeps its editable original', async () => {
  const module = { exports: {} };
  const js = ts.transpileModule(fs.readFileSync(path.join(root, 'lib/article-covers.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  new Function('module', 'exports', js)(module, module.exports);
  const cover = module.exports.articleCovers['galaxy-etf-guide'];
  assert.ok(cover);
  const file = path.join(root, 'public', cover.src);
  const metadata = await sharp(file).metadata();
  assert.equal(metadata.width, 640);
  assert.equal(metadata.height, 360);
  assert.equal(metadata.format, 'webp');
  assert.ok(fs.statSync(file).size <= 25 * 1024);
  assert.ok(fs.existsSync(path.join(root, 'assets/source-images/article-covers/galaxy-etf-guide.png')));
});
