import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import sharp from 'sharp';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = fs.readFileSync(path.join(root, 'content/articles/web/wise-witness/wise-witness-guide.md'), 'utf8');
const body = source.replace(/^---[\s\S]*?---\s*/, '');

test('Witness overview has its own guide and preserves seven numbered sections', () => {
  assert.match(source, /^id: wise-witness-guide$/m);
  assert.match(source, /^categoryId: web$/m);
  assert.match(source, /^articleType: overview$/m);
  for (const field of ['guideAudience', 'guideOutcomes', 'guidePrepare', 'guideStatus']) {
    assert.match(source, new RegExp(`^${field}: .+`, 'm'));
  }
  assert.deepEqual([...body.matchAll(/^## ([一二三四五六七])、/gm)].map(match => match[1]), [...'一二三四五六七']);
  assert.match(body, /信息整理与咨询对接网站，不是银行/);
});

test('channel quotes stay distinct from bank eligibility and application approval', () => {
  assert.match(body, /渠道方案的参考记录，不是五家银行共同发布的收费表/);
  assert.match(body, /不等于存入一笔钱就一定能开户/);
  assert.match(body, /不应交给 Wise、律师或个人代办/);
  assert.match(body, /连续三个月日均资产总值/);
  assert.match(body, /50 万元人民币或等值外币/);
  assert.match(body, /90 天以上/);
  assert.match(body, /港澳通行证及长期签证/);
  assert.match(body, /内地的优越理财家庭账户/);
  assert.match(body, /香港的 Family\+ 服务/);
  assert.doesNotMatch(body, /98%|百分之九十八/);
});

test('contact uses the supplied site and WeChat, with a real series card and no body cover', () => {
  assert.match(body, /\]\(https:\/\/www\.wise-witness\.com\/\)/);
  assert.match(body, /微信搜索 \*\*WiseInvest513\*\*/);
  assert.match(body, /\[港资券商开户与入金\]\(\/articles\/series\/hk-stock-funding\)\{card\}/);
  assert.match(fs.readFileSync(path.join(root, 'lib/article-library.ts'), 'utf8'), /id: ["']hk-stock-funding["']/);
  assert.doesNotMatch(body, /!\[[^\]]*\]\(|邀请码：|\]\(https?:[^)]*(?:ref=|invite)/);
});

test('Witness cover is centrally mapped, lightweight and retains an editable original', async () => {
  const module = { exports: {} };
  const compiled = ts.transpileModule(fs.readFileSync(path.join(root, 'lib/article-covers.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  new Function('module', 'exports', compiled)(module, module.exports);
  const cover = module.exports.articleCovers['wise-witness-guide'];
  assert.ok(cover);
  const file = path.join(root, 'public', cover.src);
  const metadata = await sharp(file).metadata();
  assert.equal(metadata.width, 640);
  assert.equal(metadata.height, 360);
  assert.equal(metadata.format, 'webp');
  assert.ok(fs.statSync(file).size <= 25 * 1024);
  assert.ok(fs.existsSync(path.join(root, 'assets/source-images/article-covers/wise-witness-guide.png')));
});
