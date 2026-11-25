import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../components/article-vip-invitation.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const module = { exports: {} };
new Function("require", "module", "exports", compiled)(name => {
  if (name.endsWith('.module.css')) return { default: new Proxy({}, { get: (_, key) => key }) };
  if (name === '@/lib/article-vip-invitation') return require('../lib/article-vip-invitation.ts');
  return require(name);
}, module, module.exports);
const { ArticleVipInvitation } = module.exports;

for (const [name, invitation] of [
  ["ordinary article", undefined],
  ["locked preview or non-partner article", null],
  ["exchange tutorial", { platform: "Binance 币安", kind: "exchange" }],
  ["broker tutorial", { platform: "致富证券", kind: "broker" }],
]) {
  test(`${name}: explains benefits and offers application and details without numeric requirements`, () => {
    const html = renderToStaticMarkup(createElement(ArticleVipInvitation, { invitation }));
    assert.match(html, /Wise VIP/);
    assert.equal((html.match(/<a\b/g) ?? []).length, 2);
    assert.match(html, /href="\/account\/vip\?apply=1/);
    assert.match(html, /href="\/vip"/);
    assert.match(html, /target="_blank"/);
    assert.match(html, /rel="noopener noreferrer"/);
    assert.match(html, />成为 VIP<svg/);
    for (const benefit of ['社群交流', '市场投研', '专属工具', '申请资格，通过后开通']) assert.ok(html.includes(benefit));
    assert.doesNotMatch(html, /免费群|CommunityDialog|1,?000|10,?000|入金|合约交易/);
    if (invitation) assert.ok(html.includes(invitation.platform));
  });
}

test('Bitget application selects the actual exchange; unknown products never become arbitrary parameters', () => {
  const { getArticleVipApplyHref } = require('../lib/article-vip-invitation.ts');
  assert.equal(getArticleVipApplyHref({platform: 'Bitget', kind: 'exchange'}), '/account/vip?apply=1&partner=bitget');
  assert.equal(getArticleVipApplyHref({platform: 'constructor', kind: 'broker'}), '/account/vip?apply=1');
});
