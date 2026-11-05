import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const article = read('content/articles/crypto/bitget-referral/bitget-referral.md');
const body = article.replace(/^---[\s\S]*?---\s*/, '');

test('Bitget referral is a separate article with the two requested account scenarios', () => {
  assert.match(article, /^---\nid: bitget-referral\n/);
  assert.match(article, /categoryId: crypto\ndate: 2026-11-05/);
  assert.match(body.split('\n\n')[0], /先说结论.*注册三天内.*联系 Wise.*老账户/);
  assert.match(body, /## 二、注册三天内，先联系 Wise 核对换绑/);
  assert.match(body, /## 三、老账户想换绑，先确认注销是否值得/);
  assert.match(read('content/articles/crypto/Bitget/bitget.md'), /id: bitget-exchange/);
});

test('the three-day channel process is not presented as guaranteed platform approval', () => {
  assert.match(body, /三天内联系不代表所有账户都能直接改/);
  assert.match(body, /是否受理.*最终绑定结果.*平台/);
  assert.match(body, /不是 Bitget Wallet/);
  assert.doesNotMatch(body, /三天内一定|保证换绑|所有账户都能换绑/);
});

test('the reported 24-hour process is attributed and distinct from the published 30-day policy', () => {
  const introduction = body.split('## 一、')[0];
  assert.match(introduction, /据 Wise 反馈，注销完成后通常 24 小时即可重新注册/);
  assert.match(introduction, /不是 Wise 专属渠道/);
  assert.match(introduction, /官方公开指南.*同手机号、邮箱或身份证需等待 30 天/);
  assert.match(introduction, /注销前.*向客服确认本人账户是否适用/);
  assert.match(body, /24 小时从旧账户注销完成后算，不是从提交注销申请时算/);
  assert.match(body, /注销完成 24 小时后，可以尝试重新注册/);
  assert.match(body, /仍提示身份信息或注册资料被占用.*先联系官方客服核对/);
  assert.doesNotMatch(body, /官方保证.*24 小时|所有账户.*24 小时.*保证/);
  assert.match(body, /实名信息从旧账户移除，不等于立即可以在新账户通过认证/);
  assert.match(body, /旧账户注销后不可恢复/);
});

test('assets must arrive before closure, and identity or account access is never delegated', () => {
  assert.match(body, /接收方实际到账.*再进行注销/);
  assert.match(body, /不需要把资金交给 Wise 代管/);
  assert.match(body, /由本人完成安全验证/);
  assert.match(body, /不要通过更换他人身份资料绕过限制/);
  assert.match(body, /不要把密码、验证码、API Secret 或助记词发给任何人/);
});

test('article has only internal reading links and the established exchange code', () => {
  assert.doesNotMatch(body, /https?:\/\/|(?:www\.)?bitget\.com|!\[[^\]]*\]\(/i);
  assert.match(body, /\*\*wise5130\*\*，字母全部小写/);
  assert.match(body, /\]\(\/articles\/crypto\/k3RVVcw4\)/);
  assert.match(body, /\]\(\/articles\/series\/exchange-referral\)/);
  assert.match(body, /Wise 可能获得平台佣金/);
  assert.match(body, /2026 年 11 月 5 日/);
});

test('existing guide and FAQ match the attributed 24-hour process and retain the policy difference', () => {
  const guide = read('app/guide/exchange-referral/page.tsx');
  assert.match(guide, /genUid\("bitget-referral"\)/);
  assert.match(guide, /阅读完整 Bitget 处理指南/);
  assert.equal((guide.match(/据 Wise 反馈，注销完成后通常 24 小时即可重新注册/g) ?? []).length, 2);
  assert.equal((guide.match(/官方公开指南仍写同手机号、邮箱或身份证需等待 30 天/g) ?? []).length, 2);
  assert.match(article, /summary: .*据 Wise 反馈.*24 小时/);
});
