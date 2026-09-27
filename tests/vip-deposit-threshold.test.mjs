import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const oldThreshold = /(?:入金(?:了)?\s*(?:\*\*)?(?:1000|300)\s*U\b|(?<!\d)(?:1000|300)\s*U\s*入金)/i;
const newThreshold = /(?<![\d,.])100\s*U\b/i;
const requiredTrade = /(?<![\d,.])10000\s*U\s*合约交易/i;
const oldTrade = /(?<!\d)300\s*U\s*杠杆交易/i;

const surfaces = [
  'app/vip/page.tsx',
  'app/vip/landing-content.ts',
  'components/article-vip-invitation.tsx',
  'app/perk/[section]/register-reward-button.tsx',
  'app/perk/data.ts',
  'lib/perks-data.ts',
  'lib/identity/dev-preview-data.ts',
  'app/account/vip/binding-form.tsx',
  'app/admin/vip/page.tsx',
];

test('threshold assertions distinguish the 100U deposit from 10000U trading volume', () => {
  assert.match('入金 100U', newThreshold);
  assert.doesNotMatch('入金 1000U、完成 10000U 合约交易', newThreshold);
  assert.doesNotMatch('入金 1100U', newThreshold);
  assert.match('完成 10000U 合约交易', requiredTrade);
  assert.doesNotMatch('完成 110000U 合约交易', requiredTrade);
});

test('all Wise VIP eligibility surfaces require 100U deposit and 10000U contract trading', () => {
  for (const file of surfaces) {
    const source = read(file);
    assert.match(source, newThreshold, file);
    assert.match(source, requiredTrade, file);
    assert.doesNotMatch(source, oldThreshold, file);
    assert.doesNotMatch(source, oldTrade, file);
    assert.doesNotMatch(source, /交易任意金额|任意金额交易/, file);
  }
  const popup = read('app/perk/[section]/register-reward-button.tsx');
  assert.equal((popup.match(/(?<!\d)100U\b/g) || []).length, 3, 'Accessible dialog description, body and deposit step must agree');
  assert.equal((popup.match(/(?<!\d)10000U 合约交易/g) || []).length, 3, 'Accessible dialog description, body and trading step must agree');
  assert.match(popup, /5U 现金红包奖励/);
  assert.match(read('app/card/data.ts'), /Gate 注册与平台充值奖励、入金 100U 并完成 10000U 合约交易后申请 Wise VIP/);
});

test('all six tutorial referral/VIP notes reflect the new conditions without rewriting deposit walkthroughs', () => {
  const notes = [
    ['content/articles/VIP/web.md', '如果你是对于加密感兴趣'],
    ['content/articles/crypto/Bitget/bitget.md', '> 填写我的邀请码'],
    ['content/articles/crypto/bybit/bybit.md', '> 如果你通过我的邀请码注册了 Bybit'],
    ['content/articles/crypto/biance/biance.md', '**3、** 在「是否有邀请人」'],
    ['content/articles/vcard/Gate/Gate.md', '那同时大家如果说注册了 Gate'],
    ['content/articles/vcard/MP/MP.md', '同时，如果大家通过我的邀请码进行注册，入金'],
  ];
  for (const [file, prefix] of notes) {
    const paragraph = read(file).split('\n').find(line => line.startsWith(prefix));
    assert.ok(paragraph, `${file} qualification paragraph must exist`);
    assert.match(paragraph, newThreshold, file);
    assert.match(paragraph, requiredTrade, file);
    assert.doesNotMatch(paragraph, oldThreshold, file);
    assert.doesNotMatch(paragraph, oldTrade, file);
    assert.doesNotMatch(paragraph, /交易任意金额|任意金额交易/, file);
  }
});

test('official promotions, card fees, actual transfer examples and regular investments remain unchanged', () => {
  assert.match(read('app/card/data.ts'), /教程里提到 100U 入金后解锁高比例优惠/);
  assert.match(read('content/articles/vcard/Gate/Gate.md'), /首笔充值大于 100U 之后，也可以领取到额外的 50U 奖励/);
  assert.match(read('content/articles/vcard/MP/MP.md'), /开卡及制卡费用是 \*\*100 USDT\*\*/);
  assert.match(read('content/articles/vcard/Bybit/bybit.md'), /充值至少 \*\*100U\*\*，方可解锁 \*\*10% 的消费返现\*\*/);
  assert.match(read('content/articles/crypto/Bitget/bitget.md'), /!\[成功充值 100U 到 Bitget\]\(\.\/22.png\)/);
  assert.match(read('content/articles/crypto/bybit/bybit.md'), /充值入金 100U，并且交易量大于 10U/);
  assert.match(read('content/articles/crypto/bybit/bybit.md'), /如果你放里面 300U，两天之后可以收获 9U 左右/);
  assert.match(read('content/articles/crypto/okx/okx.md'), /价值 100U 的新手奖励/);
  assert.match(read('content/articles/crypto/biance/biance.md'), /每周 100U 的 BTC\/ETH/);
  assert.match(read('app/practice/dca-investment/page.tsx'), /每周末定投 BTC \/ ETH 各 100U/);
});

test('broker requirements, USD300 SVIP payment, UID validation and pending manual review remain unchanged', () => {
  assert.match(read('app/vip/landing-content.ts'), /支付 300 美元开通 SVIP，长期有效/);
  assert.match(read('content/articles/VIP/web.md'), /付费 300U 的方式/);
  assert.match(read('components/article-vip-invitation.tsx'), /券商账户需通过 Wise 合作渠道开户，完成入金并激活账户/);
  assert.match(read('app/vip/page.tsx'), /绑定 Wise 邀请关系/);
  assert.match(read('app/vip/page.tsx'), /入金 100U、完成 10000U 合约交易/);
  assert.match(read('lib/vip/partners.ts'), /vipPlusVolumeThreshold: "50000"/);
  const api = read('app/api/account/partner-accounts/route.ts');
  assert.match(api, /getPartnerIdentifierError\(partnerSlug, rawIdentifier\)/);
  assert.match(api, /if \(!userNote\)/);
  assert.match(api, /status: "PENDING"/);
});
