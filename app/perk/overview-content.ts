import { perkSections } from "./data";
import { virtualCardProducts } from "../card/data";

export type OverviewEntry = {
  id: string;
  title: string;
  description?: string;
  href: string;
  action: string;
  image?: string;
  marks?: { src: string; name: string }[];
  icon?: "document" | "sim" | "tools";
  kind?: "card" | "resource";
  highlighted?: boolean;
};

export type OverviewTopic = {
  id: string;
  title: string;
  nav: string;
  description: string;
  allHref?: string;
  allLabel?: string;
  entries: OverviewEntry[];
};

export type PerkSearchEntry = {
  id: string;
  title: string;
  category: string;
  keywords: string;
  href: string;
};

// Keep the original product configuration as the source of tutorial links.
function tutorial(sectionSlug: string, productId: string) {
  const product = perkSections.find((section) => section.slug === sectionSlug)
    ?.subcategories.flatMap((category) => category.products ?? [])
    .find((item) => item.id === productId);
  if (!product?.tutorialLink) throw new Error(`Missing perk tutorial: ${productId}`);
  return internalHref(product.tutorialLink);
}

function cardTutorial(id: string) {
  const product = virtualCardProducts.find((card) => card.id === id);
  if (!product?.tutorialLink) throw new Error(`Missing card tutorial: ${id}`);
  return internalHref(product.tutorialLink);
}

function internalHref(href: string) {
  return href.replace(/^https:\/\/(?:www\.)?wise-invest\.org(?=\/)/, "");
}

export const featuredPerks = [
  { id: "binance", title: "Binance 币安", description: "注册前，先看专属手续费福利。", action: "查看注册福利", href: "/perk/crypto#product-binance" },
  { id: "bbae", title: "BBAE 证券", description: "开户、入金与转仓教程。", action: "开户教程", href: tutorial("broker", "bbae") },
  { id: "gate", title: "Gate Card", description: "申请、使用与费用说明。", action: "查看详情", href: cardTutorial("gate-card") },
] as const;

export const overviewTopics: OverviewTopic[] = [
  {
    id: "exchanges", title: "交易所", nav: "注册交易所", description: "合作渠道与手续费福利",
    allHref: "/perk/crypto", allLabel: "查看全部交易所",
    entries: [
      { id: "binance", title: "Binance 币安", description: "手续费减免", href: "/perk/crypto#product-binance", action: "查看注册福利", image: "/images/perks/overview/binance.svg", highlighted: true },
      { id: "bitget", title: "Bitget", description: "新人福利与手续费减免", href: "/perk/crypto#product-bitget", action: "查看注册福利", image: "/images/capital-flow/bitget.jpeg" },
      { id: "okx", title: "OKX 欧易", description: "交易与钱包手续费减免", href: "/perk/crypto#product-okx", action: "查看注册福利", image: "/images/capital-flow/okx.jpeg" },
    ],
  },
  {
    id: "brokers", title: "券商开户", nav: "开证券账户", description: "港美股与 A 股开户指南",
    allHref: "/perk/broker", allLabel: "查看全部券商",
    entries: [
      { id: "bbae", title: "BBAE 证券", description: "开户、入金与转仓", href: tutorial("broker", "bbae"), action: "开户教程", image: "/images/perks/overview/bbae-mark.webp" },
      { id: "schwab", title: "嘉信证券", description: "账户申请指南", href: tutorial("broker", "charles-schwab"), action: "开户教程", image: "/images/capital-flow/schwab.jpeg" },
      { id: "firstrade", title: "第一证券", description: "开户流程与材料", href: tutorial("broker", "diyi-securities"), action: "开户教程", image: "/images/capital-flow/firstrade.jpeg" },
    ],
  },
  {
    id: "banking", title: "银行卡", nav: "办银行卡", description: "香港与海外账户开户指南",
    allHref: "/perk/bank", allLabel: "查看全部银行卡",
    entries: [
      { id: "hong-kong-bank", title: "香港银行卡", description: "汇丰 · 众安", href: "/perk/bank#hong-kong-bank", action: "查看指南", marks: [{ src: "/images/capital-flow/hsbc-hk.jpeg", name: "HSBC" }, { src: "/images/capital-flow/za-bank.jpeg", name: "ZA Bank" }] },
      { id: "overseas-bank", title: "海外账户", description: "汇款与账户服务", href: "/perk/bank#overseas-bank", action: "查看指南", marks: [{ src: "/images/capital-flow/wise.jpeg", name: "Wise" }, { src: "/images/capital-flow/ifast.jpeg", name: "iFAST" }] },
      { id: "witness-account", title: "见证开户", description: "材料准备与申请流程", href: "/perk/bank#witness-account", action: "查看说明", icon: "document" },
    ],
  },
  {
    id: "cards", title: "虚拟 U 卡", nav: "选虚拟 U 卡", description: "订阅支付与日常消费",
    allHref: "/card", allLabel: "对比全部卡片",
    entries: [
      { id: "gate-card", title: "Gate Card", href: cardTutorial("gate-card"), action: "查看详情", image: "/images/perks/overview/gate-card.webp", kind: "card" },
      { id: "bitget-card", title: "Bitget Wallet Card", href: cardTutorial("bitget-wallet-card"), action: "查看详情", image: "/images/perks/overview/bitget-card.webp", kind: "card" },
      { id: "safepal-card", title: "SafePal Card", href: cardTutorial("safepal-card"), action: "查看详情", image: "/images/perks/overview/safepal-card.webp", kind: "card" },
    ],
  },
  {
    id: "ipo", title: "打新", nav: "参与打新", description: "申购流程与门槛说明",
    allHref: "/perk/ipo", allLabel: "查看全部打新",
    entries: [
      { id: "traditional-broker-ipo", title: "港美股打新", description: "传统券商申购", href: "/perk/ipo#traditional-broker-ipo", action: "查看指南" },
      { id: "onchain-broker-ipo", title: "链上打新", description: "链上券商入口", href: "/perk/ipo#onchain-broker-ipo", action: "查看指南" },
      { id: "a-share-ipo", title: "A 股打新", description: "账户准备与申购", href: "/perk/ipo#a-share-ipo", action: "查看指南" },
    ],
  },
  {
    id: "tools", title: "国际互联与工具", nav: "找出海工具", description: "通信、保号与订阅资源",
    entries: [
      { id: "global-access", title: "国际互联", description: "eSIM · 海外保号 · 读卡器", href: "/perk/global-access", action: "查看通信资源", icon: "sim", kind: "resource" },
      { id: "other-resources", title: "其他资源", description: "AI 订阅 · 效率工具", href: "/perk/other-resources", action: "查看工具资源", icon: "tools", kind: "resource" },
    ],
  },
];

// Search covers the full existing catalogue, not just the few featured entries.
export const perkSearchEntries: PerkSearchEntry[] = [
  ...perkSections.flatMap((section) => section.subcategories.flatMap((category) => [
    { id: `${section.slug}-${category.slug}`, title: category.title, category: section.title, keywords: `${section.title} ${category.description}`, href: `/perk/${section.slug}#${category.slug}` },
    ...(category.products ?? []).map((product) => ({
      id: `${section.slug}-${product.id}`, title: product.title, category: section.title,
      keywords: `${category.title} ${product.benefit} ${product.description}`,
      href: `/perk/${section.slug}#product-${product.id}`,
    })),
  ])),
  ...virtualCardProducts.map((card) => ({
    id: `card-${card.id}`, title: card.name, category: "虚拟 U 卡",
    keywords: `${card.issuer} ${card.bestFor.join(" ")}`, href: card.tutorialLink ? internalHref(card.tutorialLink) : "/card",
  })),
];
