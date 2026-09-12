import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { getArticleVipInvitation } = require("../lib/article-vip-invitation.ts");
const { genUid } = require("../lib/article-uid.ts");

// Exact local registration guides, not every article in these categories.
const guides = [
  { id: "biance-guide", categoryId: "crypto", platform: "Binance 币安", kind: "exchange", file: "crypto/biance/biance.md", uid: "GaM38JYk", title: "币安 Binance 注册入金教程" },
  { id: "okx-guide", categoryId: "crypto", platform: "OKX 欧易", kind: "exchange", file: "crypto/okx/okx.md", uid: "mAPQm7WZ", title: "OKX 欧易注册入金教程" },
  { id: "bitget-exchange", categoryId: "crypto", platform: "Bitget", kind: "exchange", file: "crypto/Bitget/bitget.md", uid: "k3RVVcw4", title: "Bitget 交易所注册入金教程" },
  { id: "bybit-guide", categoryId: "crypto", platform: "Bybit", kind: "exchange", file: "crypto/bybit/bybit.md", uid: "e6utod7B", title: "Bybit 注册入金教程" },
  { id: "Gate-vcard", categoryId: "vcard", platform: "Gate", kind: "exchange", file: "vcard/Gate/Gate.md", uid: "GUhygjYV", title: "Gate &Gate Card 一站式开户申请流程" },
  { id: "zhifu", categoryId: "broker", platform: "致富证券", kind: "broker", file: "broker/致富/zhifu.md", uid: "GaobLP0X", title: "致富证券开户入金最详细教程" },
  { id: "futu-broker", categoryId: "broker", platform: "复星证券", kind: "broker", file: "broker/fuxing/fuxing.md", uid: "sQSbLRe8", title: "2026 年复星券商开户详细教程" },
  { id: "tengda-broker", categoryId: "broker", platform: "腾达证券", kind: "broker", file: "broker/腾达/腾达.md", uid: "4k1kTctf", title: "腾达证券开户、入金全流程实测" },
];

for (const guide of guides) {
  test(`${guide.platform}: matches its exact article and invitation kind`, () => {
    const article = Object.freeze({ id: guide.id, categoryId: guide.categoryId });
    assert.deepEqual(getArticleVipInvitation(article), { platform: guide.platform, kind: guide.kind });
  });

  test(`${guide.platform}: local Markdown identity and canonical route remain aligned`, () => {
    const markdown = readFileSync(new URL(`../content/articles/${guide.file}`, import.meta.url), "utf8");
    const frontmatter = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
    assert.ok(frontmatter, `Missing frontmatter: ${guide.file}`);
    const field = (name) => frontmatter.match(new RegExp(`^${name}:\\s*(.*?)\\s*$`, "m"))?.[1];
    assert.equal(field("id"), guide.id);
    assert.equal(field("categoryId"), guide.categoryId);
    assert.ok(field("title")?.includes(guide.title), `Unexpected title in ${guide.file}`);
    assert.equal(`/articles/${field("categoryId")}/${genUid(field("id"))}`, `/articles/${guide.categoryId}/${guide.uid}`);
  });

  test(`${guide.platform}: rejects a correct ID under a different category`, () => {
    for (const categoryId of ["crypto", "broker", "vcard", "bank", "VIP", "domestic", "onchain", ""]) {
      if (categoryId === guide.categoryId) continue;
      assert.equal(getArticleVipInvitation({ id: guide.id, categoryId }), null, `${guide.id}/${categoryId}`);
    }
    assert.equal(getArticleVipInvitation({ id: guide.id, categoryId: guide.categoryId.toUpperCase() }), null);
  });
}

test("unrelated banks, brokers, wallet cards, unpublished partners and VIP articles stay excluded", () => {
  const excluded = [
    ["bank", "wise-register"],
    ["bank", "ifast"],
    ["broker", "IBKR"],
    ["broker", "jiaxin"],
    ["broker", "diyi"],
    ["broker", "ifas-fuxing"],
    ["vcard", "bitget-vcard"],
    ["vcard", "bitget-vcard-new"],
    ["vcard", "bybit-vcard"],
    ["broker", "galaxy-securities"],
    ["broker", "china-galaxy"],
    ["broker", "bbae"],
    ["broker", "BBAE"],
    ["VIP", "VIP"],
    ["VIP", "VIP001"],
  ];
  for (const [categoryId, id] of excluded) {
    assert.equal(getArticleVipInvitation({ id, categoryId }), null, `${categoryId}/${id}`);
  }
});

test("matching never expands to prefixes, suffixes, normalized names or trimmed IDs", () => {
  for (const { id, categoryId } of guides) {
    for (const changedId of [`${id}-extra`, `extra-${id}`, ` ${id}`, `${id} `, id.toUpperCase()]) {
      assert.equal(getArticleVipInvitation({ id: changedId, categoryId }), null, changedId);
    }
  }
  assert.equal(getArticleVipInvitation({ id: "binance-guide", categoryId: "crypto" }), null,
    "The existing Binance frontmatter intentionally uses biance-guide");
  assert.equal(getArticleVipInvitation({ id: "gate-vcard", categoryId: "vcard" }), null);
});

test("futu-broker identifies Fosun, not Futu or an unrelated brokerage", () => {
  assert.deepEqual(getArticleVipInvitation({ id: "futu-broker", categoryId: "broker" }), {
    platform: "复星证券",
    kind: "broker",
  });
});

test("null, undefined and empty identifiers have no invitation", () => {
  assert.equal(getArticleVipInvitation(null), null);
  assert.equal(getArticleVipInvitation(undefined), null);
  assert.equal(getArticleVipInvitation(), null);
  assert.equal(getArticleVipInvitation({ id: "", categoryId: "" }), null);
  assert.equal(getArticleVipInvitation({ id: "", categoryId: "crypto" }), null);
});

test("object prototype property names cannot accidentally match the whitelist", () => {
  for (const id of ["__proto__", "constructor", "toString", "hasOwnProperty"]) {
    assert.equal(getArticleVipInvitation({ id, categoryId: "crypto" }), null);
    assert.equal(getArticleVipInvitation({ id, categoryId: "broker" }), null);
  }
});
