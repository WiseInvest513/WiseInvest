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
new Function("require", "module", "exports", compiled)(require, module, module.exports);
const { ArticleVipInvitation } = module.exports;

for (const [name, invitation] of [
  ["ordinary article", undefined],
  ["locked preview or non-partner article", null],
  ["exchange tutorial", { platform: "Binance 币安", kind: "exchange" }],
  ["broker tutorial", { platform: "致富证券", kind: "broker" }],
]) {
  test(`${name}: renders one public VIP join link, never a free-group button`, () => {
    const html = renderToStaticMarkup(createElement(ArticleVipInvitation, { invitation }));
    assert.match(html, /加入 Wise VIP/);
    assert.equal((html.match(/<a\b/g) ?? []).length, 1);
    assert.match(html, /href="https:\/\/vip\.wise-invest\.org\/join"/);
    assert.match(html, /target="_blank"/);
    assert.match(html, /rel="noopener noreferrer"/);
    assert.match(html, />加入 VIP<svg/);
    assert.doesNotMatch(html, /免费群|加入群聊|CommunityDialog|href="\/vip"/);
    if (!invitation) assert.doesNotMatch(html, /1000U|10000U|券商账户需/);
    else assert.ok(html.includes(invitation.platform));
  });
}
