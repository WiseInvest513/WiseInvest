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
  const js = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', js)(name => {
    if (name.endsWith('.css')) return new Proxy({}, { get: (_, key) => String(key) });
    if (name === '@/components/copy-text-button') return { CopyTextButton: ({ value, children }) => createElement('button', { 'data-copy': value }, children) };
    if (name.startsWith('@/')) {
      const base = name.slice(2);
      return load(['.ts', '.tsx'].map(ext => base + ext).find(file => fs.existsSync(path.join(root, file))));
    }
    return require(name);
  }, module, module.exports);
  return module.exports;
}
const { parseRegistrationCallout } = load('lib/article-registration.ts');
const { getRegistrationBrand } = load('lib/registration-brands.ts');
const { ArticleRegistrationCard } = load('components/article-registration-card.tsx');
const render = props => renderToStaticMarkup(createElement(ArticleRegistrationCard, props));
const plainText = html => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
function benefitSection(html) {
  const section = html.match(/<section\b[^>]*>[\s\S]*?<\/section>/)?.[0];
  assert.ok(section, 'registration cards keep their benefit section');
  return section;
}
const benefitItems = html => [...benefitSection(html).matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map(match => plainText(match[1]));

test('every published invitation card has an explicit brand and a nonempty local icon', () => {
  const directory = path.join(root, 'content/articles');
  const files = fs.readdirSync(directory, { recursive: true }).filter(file => /\.mdx?$/.test(file));
  let checked = 0;
  for (const file of files) {
    const raw = fs.readFileSync(path.join(directory, file), 'utf8');
    if (!/^id:/m.test(raw)) continue;
    for (const line of raw.split('\n')) {
      const card = parseRegistrationCallout(line);
      if (!card) continue;
      const brand = getRegistrationBrand(card.href, card.title);
      assert.ok(brand, `${file}: missing brand for ${card.title}`);
      assert.ok(brand.iconSrc.startsWith('/'), `${file}: use a bundled brand icon`);
      const icon = path.join(root, 'public', brand.iconSrc);
      assert.ok(fs.existsSync(icon) && fs.statSync(icon).size > 0, `${file}: missing or empty icon ${brand.iconSrc}`);
      assert.match(render(card), /<section[^>]+aria-label=/, `${file}: every invitation keeps its benefit column`);
      checked++;
    }
  }
  assert.ok(checked > 0);
});

test('generic invitations display exclusive invitation guidance without claiming a reward or missing offer', () => {
  for (const props of [
    { title: '注册 GamsGo 账户', href: 'https://gamsgo.com/partner/GwZjT' },
    { title: '注册 SGB 账户', code: '3p1o5t' },
    { title: '注册 Wise 账户', href: 'https://wise.com/invite/ihpc/ewke85g' },
    { title: '注册 汇立银行 账户', code: 'FPNLGF' },
  ]) {
    const brand = getRegistrationBrand(props.href, props.title);
    assert.equal(brand.benefits.kind, 'invitation', props.title);
    assert.ok(brand.benefits.items.every(item => item.value === ''), props.title);
    const section = benefitSection(render(props));
    assert.match(section, /aria-label="独家福利"/);
    assert.match(section, /绑定邀请关系/);
    assert.doesNotMatch(plainText(section), /暂无|待补|\d+\s*%|返佣|现金|手续费|减免|折扣/, props.title);
  }
  const unknown = benefitSection(render({ title: '注册 示例云工具 账户', href: 'https://example.com/invite' }));
  assert.match(unknown, /aria-label="独家福利"/);
  assert.match(unknown, /绑定邀请关系/);
  assert.doesNotMatch(plainText(unknown), /暂无|待补|\d+\s*%|返佣|现金|手续费|减免|折扣/);
});

test('an unknown discount code keeps discount guidance without inventing a discount amount', () => {
  const coupon = render({ title: '领取 示例产品 优惠', code: 'EXAMPLE', codeLabel: '优惠码', href: 'https://example.com/buy' });
  assert.match(coupon, /<section[^>]+aria-label="优惠说明"/);
  assert.match(coupon, /福利待补充/);
  assert.match(coupon, /结算时填写优惠码/);
  assert.doesNotMatch(coupon, /独家福利|九折|9折|20%/);
});

test('Predict applies its confirmed 10 percent reduction to trading fees, not a permanent commission rebate', () => {
  const html = render({ title: '注册 Predict 账户', code: '05JQU', href: 'https://predict.fun?ref=05JQU' });
  const section = plainText(benefitSection(html));
  assert.match(section, /交易手续费减免/);
  assert.match(section, /10%/);
  assert.match(section, /05JQU/);
  assert.doesNotMatch(section, /20%|永久|返佣|现金|本金|福利待补充/);
  assert.match(html, /href="https:\/\/predict\.fun\?ref=05JQU"/);
  assert.match(html, /data-copy="05JQU"/);
});

test('IBKR promises application support while leaving approval and processing time to the broker', () => {
  const html = render({ title: '注册 盈透证券 账户', href: 'https://ibkr.com/referral/fengyang247' });
  const section = plainText(benefitSection(html));
  assert.match(section, /开户支持/);
  assert.match(section, /快速通过/);
  assert.match(section, /协助.*开户审核/);
  assert.match(section, /审核结果与处理时间由券商决定/);
  assert.doesNotMatch(section, /开户即通过|\d+\s*%|现金|福利待补充/);
});

test('Tengda invitation card uses exclusive invitation copy after July 2026 campaign samples expired', () => {
  const html = render({ title: '注册 腾达证券 账户', code: 'XDG74RHG' });
  const section = plainText(benefitSection(html));
  assert.match(section, /独家福利/);
  assert.match(section, /专属邀请入口/);
  assert.doesNotMatch(section, /免佣|HK\$300|HK\$10,000|HK\$20,000|福利待补充/);
  assert.match(html, /data-copy="XDG74RHG"/);
});

test('Chief retains the US-stock waiver and the voucher-plus-stock composition of its HK$300 reward', () => {
  const html = render({ title: '注册 致富证券 账户', code: 'HN7787' });
  const items = benefitItems(html);
  const waiver = items.find(item => /免佣/.test(item));
  const reward = items.find(item => /HK\$300/.test(item));
  assert.ok(waiver);
  assert.ok(reward);
  assert.match(waiver, /美股交易.*HK\$10,000/);
  assert.doesNotMatch(waiver, /港美股|港股交易/);
  assert.match(reward, /交易券及股票奖励/);
  assert.match(reward, /开户 7 天内入金 HK\$10,000/);
  assert.match(reward, /留存 60 天并完成一笔港股或美股交易/);
  const section = plainText(benefitSection(html));
  assert.match(section, /HK\$100 美股交易券与 HK\$200 英伟达股票/);
  assert.doesNotMatch(section, /HK\$300.*现金奖励|开户即送|福利待补充/);
});

test('Ant Bank Macau invitation card uses exclusive invitation copy after March 2026 gift samples expired', () => {
  const html = render({ title: '注册 蚂蚁银行澳门 账户', code: 'LPQEUGML' });
  const section = plainText(benefitSection(html));
  assert.match(section, /独家福利/);
  assert.match(section, /专属邀请入口/);
  assert.doesNotMatch(section, /2 股|阿里巴巴|iPhone|HK\$3,000|HK\$1,000,000|福利待补充/);
  assert.match(html, /data-copy="LPQEUGML"/);
});

test('registration callouts support codes, link-only invitations and discount codes without inventing a URL', () => {
  const bbae = parseRegistrationCallout('> 注册 BBAE 账户 · 邀请码：**stiibsmu3** · 福利：首次入金 2,000 美元，领取 20 美元奖励');
  assert.equal(bbae.href, undefined);
  assert.equal(bbae.code, 'stiibsmu3');
  assert.match(bbae.benefitText, /2,000/);
  const wise = parseRegistrationCallout('> [注册 Wise 账户](https://wise.com/invite/ihpc/ewke85g) · 邀请链接');
  assert.equal(wise.code, undefined);
  assert.equal(wise.href, 'https://wise.com/invite/ihpc/ewke85g');
  const discount = parseRegistrationCallout('> [领取 XeSIM 优惠](https://xesim.cc/?DIST=RkJHFVg%3D) · 优惠码：**WISE666**');
  assert.equal(discount.codeLabel, '优惠码');
  for (const text of ['> [普通链接](https://example.com)', '> https://example.com', '> 注册流程需要邀请码', '> [注册 示例 账户](javascript:alert) · 邀请码：**ABC**']) assert.equal(parseRegistrationCallout(text), undefined);
});

test('wallets and payment cards never inherit the exchange trading rebate', () => {
  for (const name of ['Bitget Wallet Card', 'Bybit Card', 'Gate Card', '币安钱包', 'OKX Web3 钱包', 'Bybit Wallet']) {
    const brand = getRegistrationBrand('https://partner.bybit.com/b/WISE6666', `注册 ${name} 账户`);
    assert.doesNotMatch(JSON.stringify(brand?.benefits ?? {}), /20%|交易手续费返佣/, name);
    const html = render({ title: `注册 ${name} 账户`, code: 'EXAMPLE' });
    assert.doesNotMatch(html, /20%|交易手续费返佣/, name);
  }
  for (const name of ['币安', 'OKX 欧易', 'Bitget', 'Bybit', 'Gate 交易所', 'WEEX']) {
    const brand = getRegistrationBrand(undefined, `注册 ${name} 账户`);
    assert.equal(brand.benefits.period, '永久有效');
    assert.equal(brand.benefits.items[0].value, '20%');
    assert.ok(fs.existsSync(path.join(root, 'public', brand.iconSrc)));
  }
});

test('article rewards retain their basis, thresholds and voucher or shipping limits', () => {
  const stable = render({ title: '注册 StableStock 账户', code: 'WISE666' });
  assert.match(stable, /20%/);
  assert.match(stable, /返还基数.*待补充/);
  assert.match(stable, /不代表交易本金返还/);
  assert.match(render({ title: '注册 StockCoin 账户', code: 'OQTACJ' }), /35%.*现货与合约返佣/s);
  const bybit = render({ title: '注册 Bybit Card 账户', code: 'JJKZWA4' });
  assert.match(bybit, /10%/);
  assert.match(bybit, /充值至少 100U/);
  assert.match(bybit, /75U/);
  assert.doesNotMatch(bybit, /永久|交易手续费返佣/);
  const uu = render({ title: '注册 UU Wallet 账户', code: 'd1wvsq' });
  assert.match(uu, /100%/);
  assert.match(uu, /50%/);
  assert.match(uu, /开卡费/);
  assert.match(uu, /回传表单/);
  assert.match(render({ title: '注册 StarryBlu 账户', code: 'MPFK00F' }), /优惠券.*(?:不是|非)现金/s);
  assert.match(render({ title: '注册 SafePal 账户', code: '884823' }), /邮费自付/);
  const xesim = render({ title: '领取 XeSIM 优惠', code: 'WISE666', codeLabel: '优惠码' });
  assert.match(xesim, /9 折/);
  assert.match(xesim, /X2 Pro/);
});

test('code-only cards explain App entry and do not turn the article into a fake registration link', () => {
  const html = render({ title: '注册 BBAE 账户', code: 'stiibsmu3' });
  assert.match(html, /在 App 注册页面填写/);
  assert.match(html, /\$2,000/);
  assert.match(html, /\$20/);
  assert.doesNotMatch(html, /<a\b/);
  const wise = render({ title: '注册 Wise 账户', href: 'https://wise.com/invite/ihpc/ewke85g' });
  assert.match(wise, /通过邀请链接注册/);
  assert.doesNotMatch(wise, /复制邀请码|undefined/);
});

test('explicit article benefit corrections override outdated brand formatting', () => {
  const html = render({ title: '注册 BBAE 账户', code: 'stiibsmu3', benefitText: '此奖励已结束，仅保留邀请入口。' });
  assert.match(html, /此奖励已结束/);
  assert.doesNotMatch(html, /\$20|\$2,000/);
});

test('published OKX and Bybit text and channel links use the confirmed WISE6666 code', () => {
  for (const name of ['okx', 'bybit']) {
    const raw = fs.readFileSync(path.join(root, `content/articles/crypto/${name}/${name}.md`), 'utf8');
    const cards = raw.split('\n').map(parseRegistrationCallout).filter(Boolean);
    assert.equal(cards.length, 1);
    assert.equal(cards[0].code, 'WISE6666');
    assert.ok(cards[0].href.endsWith('/WISE6666'));
    assert.doesNotMatch(raw, /58547997|WISE5130|oyicn\.link/);
  }
});
