"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  Banknote,
  ChevronDown,
  CreditCard,
  Landmark,
  Network,
  Route,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NodeKind =
  | "domestic-bank"
  | "transfer-card"
  | "hk-bank"
  | "us-bank"
  | "us-broker"
  | "hk-broker"
  | "exchange"
  | "u-card"
  | "payment"
  | "process";

type Point = {
  x: number;
  y: number;
};

type FlowNode = Point & {
  id: string;
  label: string;
  subtitle: string;
  kind: NodeKind;
  icon?: string;
  showInOverview?: boolean;
};

type GroupTone = Exclude<NodeKind, "process">;

type FlowGroup = {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tone: GroupTone;
  variant?: "section" | "sub";
};

type StageLabel = Point & {
  label: string;
};

type GuidePath = {
  id: string;
  points: Point[];
};

type RoutePreset = {
  id: string;
  label: string;
  description: string;
  tone: keyof typeof routeTones;
  paths: string[][];
  guidePaths?: GuidePath[];
  steps: string[];
  layout?: Record<string, Point>;
  groups?: FlowGroup[];
  stageLabels?: StageLabel[];
};

const iconBase = "/images/capital-flow";
const graphWidth = 1200;
const graphHeight = 760;
const overviewSize = 760;

const nodeKinds: Record<
  NodeKind,
  { label: string; color: string; bg: string; dot: string; icon: LucideIcon }
> = {
  "domestic-bank": {
    label: "中国境内银行卡",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    dot: "#ef4444",
    icon: Landmark,
  },
  "transfer-card": {
    label: "中转银行卡",
    color: "text-violet-700",
    bg: "bg-violet-50 border-violet-200",
    dot: "#8b5cf6",
    icon: CreditCard,
  },
  "hk-bank": {
    label: "港资银行卡",
    color: "text-sky-700",
    bg: "bg-sky-50 border-sky-200",
    dot: "#0ea5e9",
    icon: Landmark,
  },
  "us-bank": {
    label: "美资银行卡",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    dot: "#2563eb",
    icon: Landmark,
  },
  "us-broker": {
    label: "美资券商",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    dot: "#10b981",
    icon: Banknote,
  },
  "hk-broker": {
    label: "港资券商",
    color: "text-teal-700",
    bg: "bg-teal-50 border-teal-200",
    dot: "#14b8a6",
    icon: Banknote,
  },
  exchange: {
    label: "交易所",
    color: "text-orange-700",
    bg: "bg-orange-50 border-orange-200",
    dot: "#f97316",
    icon: Network,
  },
  "u-card": {
    label: "虚拟 U 卡 / 钱包",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    dot: "#f59e0b",
    icon: WalletCards,
  },
  payment: {
    label: "国内支付消费",
    color: "text-rose-700",
    bg: "bg-rose-50 border-rose-200",
    dot: "#e11d48",
    icon: CreditCard,
  },
  process: {
    label: "流程节点",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    dot: "#f59e0b",
    icon: Route,
  },
};

const routeTones = {
  overview: { stroke: "#f59e0b", label: "总览" },
  bank: { stroke: "#f97316", label: "跨境通道" },
  broker: { stroke: "#10b981", label: "入券商" },
  return: { stroke: "#64748b", label: "资金回流" },
  crypto: { stroke: "#f59e0b", label: "加密路径" },
  consume: { stroke: "#e11d48", label: "直接消费" },
  direct: { stroke: "#2563eb", label: "美元直连" },
};

const nodes: FlowNode[] = [
  { id: "domestic-hub", label: "国内银行卡", subtitle: "起点 / 承接", kind: "domestic-bank", icon: `${iconBase}/ccb.jpeg`, x: 140, y: 390 },
  { id: "cib", label: "兴业", subtitle: "启动", kind: "domestic-bank", icon: `${iconBase}/cib.jpeg`, x: 190, y: 250 },
  { id: "ccb", label: "建行", subtitle: "承接", kind: "domestic-bank", icon: `${iconBase}/ccb.jpeg`, x: 190, y: 500 },
  { id: "cmb", label: "招商", subtitle: "承接", kind: "domestic-bank", icon: `${iconBase}/cmb.jpeg`, x: 280, y: 620 },

  { id: "ifast", label: "iFast", subtitle: "中转", kind: "transfer-card", icon: `${iconBase}/ifast.jpeg`, x: 420, y: 125 },
  { id: "wise", label: "Wise", subtitle: "中转", kind: "transfer-card", icon: `${iconBase}/wise.jpeg`, x: 560, y: 95 },
  { id: "starryblu", label: "StarryBlu", subtitle: "中转 / U 卡", kind: "transfer-card", icon: `${iconBase}/starryblu.jpeg`, x: 700, y: 125 },

  { id: "hsbc-hk", label: "汇丰香港", subtitle: "港卡", kind: "hk-bank", icon: `${iconBase}/hsbc-hk.jpeg`, x: 380, y: 260 },
  { id: "bochk", label: "中银香港", subtitle: "港卡", kind: "hk-bank", icon: `${iconBase}/bochk.jpeg`, x: 505, y: 285 },
  { id: "za-bank", label: "众安", subtitle: "微信支付", kind: "hk-bank", icon: `${iconBase}/za-bank.jpeg`, x: 630, y: 285 },
  { id: "airstar", label: "天星", subtitle: "港卡", kind: "hk-bank", icon: `${iconBase}/airstar.jpeg`, x: 755, y: 260 },

  { id: "east-west", label: "华美", subtitle: "美卡", kind: "us-bank", icon: `${iconBase}/east-west.jpeg`, x: 870, y: 125 },
  { id: "hsbc-us", label: "汇丰美国", subtitle: "美卡", kind: "us-bank", icon: `${iconBase}/hsbc-us.jpeg`, x: 1010, y: 190 },

  { id: "ibkr", label: "盈透", subtitle: "美资券商", kind: "us-broker", icon: `${iconBase}/ibkr.jpeg`, x: 930, y: 335 },
  { id: "schwab", label: "嘉信", subtitle: "美资券商", kind: "us-broker", icon: `${iconBase}/schwab.jpeg`, x: 1040, y: 420 },
  { id: "firstrade", label: "第一", subtitle: "美资券商", kind: "us-broker", icon: `${iconBase}/firstrade.jpeg`, x: 930, y: 505 },

  { id: "tiger", label: "老虎", subtitle: "港资券商", kind: "hk-broker", icon: `${iconBase}/tiger.jpeg`, x: 810, y: 365 },
  { id: "futu", label: "富途", subtitle: "港资券商", kind: "hk-broker", icon: `${iconBase}/futu.jpeg`, x: 860, y: 470 },
  { id: "longbridge", label: "长桥", subtitle: "港资券商", kind: "hk-broker", icon: `${iconBase}/longbridge.jpeg`, x: 790, y: 575 },
  { id: "fosun", label: "复星", subtitle: "港资券商", kind: "hk-broker", icon: `${iconBase}/fosun.jpeg`, x: 670, y: 650 },
  { id: "chief", label: "致富", subtitle: "港资券商", kind: "hk-broker", icon: `${iconBase}/chief.jpeg`, x: 540, y: 670 },
  { id: "tengda", label: "腾达", subtitle: "港资券商", kind: "hk-broker", icon: `${iconBase}/tengda.jpeg`, x: 410, y: 650 },
  { id: "usmart", label: "盈立", subtitle: "港资券商", kind: "hk-broker", icon: `${iconBase}/usmart.jpeg`, x: 330, y: 560 },

  { id: "binance", label: "币安", subtitle: "交易所", kind: "exchange", icon: `${iconBase}/binance.jpeg`, x: 305, y: 670 },
  { id: "okx", label: "欧易", subtitle: "交易所", kind: "exchange", icon: `${iconBase}/okx.jpeg`, x: 445, y: 690 },
  { id: "bitget-exchange", label: "Bitget", subtitle: "交易所", kind: "exchange", icon: `${iconBase}/bitget.jpeg`, x: 585, y: 690 },
  { id: "bybit", label: "Bybit", subtitle: "交易所", kind: "exchange", icon: `${iconBase}/bybit.jpeg`, x: 725, y: 670 },

  { id: "bitget-wallet", label: "Bitget Wallet", subtitle: "虚拟 U 卡", kind: "u-card", icon: `${iconBase}/bitget-wallet.jpeg`, x: 900, y: 620 },
  { id: "safepal", label: "SafePal", subtitle: "虚拟 U 卡", kind: "u-card", icon: `${iconBase}/safepal.jpeg`, x: 1030, y: 585 },
  { id: "neverless", label: "Neverless", subtitle: "回流工具", kind: "u-card", icon: `${iconBase}/neverless.jpeg`, x: 1090, y: 520 },

  { id: "wechat", label: "微信", subtitle: "支付", kind: "payment", icon: `${iconBase}/wechat.jpeg`, x: 1080, y: 300 },
  { id: "alipay", label: "支付宝", subtitle: "支付", kind: "payment", icon: `${iconBase}/alipay.jpeg`, x: 1120, y: 390 },
  { id: "taobao", label: "淘宝", subtitle: "消费", kind: "payment", icon: `${iconBase}/taobao.jpeg`, x: 1110, y: 660 },
  { id: "meituan", label: "美团", subtitle: "消费", kind: "payment", icon: `${iconBase}/meituan.jpeg`, x: 980, y: 680 },

  { id: "cross-border-pay", label: "跨境支付通", subtitle: "港币 / 美元", kind: "process", x: 410, y: 380, showInOverview: false },
  { id: "usd-exchange", label: "美元换汇", subtitle: "电汇 / ACH", kind: "process", x: 420, y: 380, showInOverview: false },
  { id: "crypto-rail", label: "链上转账", subtitle: "USDT / USDC", kind: "process", x: 420, y: 380, showInOverview: false },
  { id: "return-rail", label: "回流通道", subtitle: "出金 / 消费", kind: "process", x: 420, y: 380, showInOverview: false },
];

const overviewRings = [
  {
    radius: 160,
    startDeg: -92,
    ids: ["wise", "starryblu", "hsbc-hk", "bochk", "za-bank", "airstar", "tiger", "futu", "bitget-wallet", "safepal"],
  },
  {
    radius: 245,
    startDeg: -105,
    ids: [
      "domestic-hub",
      "cib",
      "ccb",
      "cmb",
      "ifast",
      "east-west",
      "hsbc-us",
      "ibkr",
      "schwab",
      "firstrade",
      "longbridge",
      "usmart",
      "binance",
      "okx",
    ],
  },
  {
    radius: 318,
    startDeg: -98,
    ids: ["bitget-exchange", "bybit", "fosun", "chief", "tengda", "neverless", "wechat", "alipay", "taobao", "meituan"],
  },
];

function pointOnCircle(index: number, total: number, radius: number, startDeg: number): Point {
  const angle = ((startDeg + (360 / total) * index) * Math.PI) / 180;
  const center = overviewSize / 2;
  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius,
  };
}

const overviewPointById = new Map<string, Point>(
  overviewRings.flatMap((ring) => ring.ids.map((id, index) => [id, pointOnCircle(index, ring.ids.length, ring.radius, ring.startDeg)] as const))
);

const routes: RoutePreset[] = [
  {
    id: "overview",
    label: "完整资金环形总览",
    description: "默认只展示产品在资金地图中的位置。节点会在圆环上轻微浮动，方便先建立整体印象；选择具体路线后，产品会重组为从左到右的资金链路。",
    tone: "overview",
    paths: [],
    steps: ["左侧是国内资金起点", "上方是中转卡、港卡和美卡", "右侧是券商与国内消费", "下方是交易所、虚拟 U 卡和回流工具"],
  },
  {
    id: "domestic-to-hk-card",
    label: "国内银行卡 → 港卡",
    description: "从兴业、建设、招商等国内银行卡出发，通过跨境支付通转入香港银行卡；汇丰、中银是实体港卡，众安和天星属于虚拟银行，需要单独识别。",
    tone: "bank",
    paths: [
      ["cib", "cross-border-pay", "hsbc-hk"],
      ["ccb", "cross-border-pay", "bochk"],
      ["cmb", "cross-border-pay", "za-bank"],
      ["cmb", "cross-border-pay", "airstar"],
    ],
    guidePaths: [{ id: "domestic-to-hk-main", points: [{ x: 245, y: 380 }, { x: 410, y: 380 }, { x: 610, y: 380 }] }],
    steps: ["起始端是国内银行卡", "中间通过跨境支付通完成跨境转账", "接收端是香港银行账户", "众安和天星按虚拟银行单独框出"],
    layout: {
      cib: { x: 158, y: 245 },
      ccb: { x: 158, y: 380 },
      cmb: { x: 158, y: 515 },
      "cross-border-pay": { x: 410, y: 380 },
      "hsbc-hk": { x: 715, y: 300 },
      bochk: { x: 715, y: 430 },
      "za-bank": { x: 955, y: 315 },
      airstar: { x: 955, y: 455 },
    },
    groups: [
      { label: "国内资金", x: 55, y: 180, width: 205, height: 420, tone: "domestic-bank", variant: "section" },
      { label: "港资银行卡", x: 600, y: 165, width: 485, height: 420, tone: "hk-bank", variant: "section" },
      { label: "实体银行卡", x: 635, y: 235, width: 160, height: 245, tone: "hk-bank", variant: "sub" },
      { label: "虚拟银行卡", x: 850, y: 240, width: 205, height: 290, tone: "hk-bank", variant: "sub" },
    ],
    stageLabels: [
      { label: "起始端", x: 158, y: 125 },
      { label: "跨境支付通", x: 410, y: 125 },
      { label: "接收端（香港银行）", x: 815, y: 125 },
    ],
  },
  {
    id: "transfer-to-us-broker",
    label: "国内 → 中转卡 → 美资券商",
    description: "适合用 Wise / iFast / StarryBlu 作为桥梁，再把资金汇入盈透、嘉信、第一证券。",
    tone: "broker",
    paths: [
      ["cib", "ifast", "ibkr"],
      ["ccb", "wise", "schwab"],
      ["cmb", "starryblu", "firstrade"],
    ],
    guidePaths: [{ id: "transfer-to-us-broker-main", points: [{ x: 260, y: 380 }, { x: 455, y: 380 }, { x: 735, y: 380 }] }],
    steps: ["国内银行换汇或汇出", "资金进入 iFast / Wise / StarryBlu", "中转卡汇入美资券商", "后续可继续走回流路径"],
    layout: {
      cib: { x: 158, y: 245 },
      ccb: { x: 158, y: 380 },
      cmb: { x: 158, y: 515 },
      ifast: { x: 455, y: 245 },
      wise: { x: 455, y: 380 },
      starryblu: { x: 455, y: 515 },
      ibkr: { x: 860, y: 245 },
      schwab: { x: 860, y: 380 },
      firstrade: { x: 860, y: 515 },
    },
    groups: [
      { label: "国内资金", x: 55, y: 180, width: 205, height: 420, tone: "domestic-bank", variant: "section" },
      { label: "中转银行卡", x: 350, y: 180, width: 210, height: 420, tone: "transfer-card", variant: "section" },
      { label: "美资券商", x: 735, y: 180, width: 250, height: 420, tone: "us-broker", variant: "section" },
    ],
    stageLabels: [
      { label: "起始端", x: 158, y: 125 },
      { label: "中转银行卡", x: 455, y: 125 },
      { label: "美资券商", x: 860, y: 125 },
    ],
  },
  {
    id: "hk-card-to-hk-broker",
    label: "国内 → 港卡 → 港资券商",
    description: "适合使用汇丰香港、中银香港、众安、天星等港卡进入港资券商，用于港股、美股和打新场景。",
    tone: "broker",
    paths: [
      ["cib", "hsbc-hk", "tiger"],
      ["ccb", "bochk", "futu"],
      ["cmb", "airstar", "longbridge"],
      ["ccb", "za-bank", "tengda"],
      ["hsbc-hk", "fosun"],
      ["bochk", "chief"],
    ],
    guidePaths: [{ id: "hk-card-to-broker-main", points: [{ x: 245, y: 390 }, { x: 540, y: 390 }, { x: 640, y: 390 }] }],
    steps: ["国内银行卡准备资金", "资金进入港资银行卡", "港卡入金港资券商", "适合港股、美股和打新"],
    layout: {
      cib: { x: 140, y: 255 },
      ccb: { x: 140, y: 390 },
      cmb: { x: 140, y: 525 },
      "hsbc-hk": { x: 415, y: 305 },
      bochk: { x: 415, y: 420 },
      "za-bank": { x: 415, y: 560 },
      airstar: { x: 415, y: 650 },
      tiger: { x: 690, y: 390 },
      futu: { x: 770, y: 390 },
      longbridge: { x: 850, y: 390 },
      fosun: { x: 930, y: 390 },
      chief: { x: 1010, y: 390 },
      tengda: { x: 1090, y: 390 },
    },
    groups: [
      { label: "国内资金", x: 45, y: 200, width: 190, height: 380, tone: "domestic-bank", variant: "section" },
      { label: "港资银行卡", x: 290, y: 175, width: 250, height: 575, tone: "hk-bank", variant: "section" },
      { label: "实体银行卡", x: 325, y: 250, width: 180, height: 220, tone: "hk-bank", variant: "sub" },
      { label: "虚拟银行卡", x: 325, y: 500, width: 180, height: 240, tone: "hk-bank", variant: "sub" },
      { label: "港资券商", x: 640, y: 285, width: 520, height: 210, tone: "hk-broker", variant: "section" },
    ],
    stageLabels: [
      { label: "国内资金", x: 140, y: 125 },
      { label: "港资银行卡", x: 415, y: 125 },
      { label: "港资券商", x: 900, y: 125 },
    ],
  },
  {
    id: "us-bank-direct",
    label: "国内 → 美卡 → 美资券商",
    description: "美元体系路径：国内换汇到华美银行或汇丰美国，再连接盈透、嘉信、第一证券。",
    tone: "direct",
    paths: [
      ["domestic-hub", "usd-exchange", "east-west", "ibkr"],
      ["domestic-hub", "usd-exchange", "hsbc-us", "schwab"],
      ["cmb", "usd-exchange", "east-west", "firstrade"],
    ],
    guidePaths: [{ id: "us-bank-direct-main", points: [{ x: 230, y: 385 }, { x: 390, y: 385 }, { x: 570, y: 385 }, { x: 845, y: 385 }] }],
    steps: ["国内换汇成美元", "资金进入华美银行或汇丰美国", "美卡直接汇入美资券商", "资金留在美元体系周转"],
    layout: {
      "domestic-hub": { x: 140, y: 320 },
      cmb: { x: 140, y: 455 },
      "usd-exchange": { x: 390, y: 385 },
      "east-west": { x: 665, y: 310 },
      "hsbc-us": { x: 665, y: 460 },
      ibkr: { x: 955, y: 265 },
      schwab: { x: 955, y: 385 },
      firstrade: { x: 955, y: 505 },
    },
    groups: [
      { label: "国内资金", x: 45, y: 245, width: 190, height: 270, tone: "domestic-bank", variant: "section" },
      { label: "美资银行卡", x: 570, y: 220, width: 190, height: 330, tone: "us-bank", variant: "section" },
      { label: "美资券商", x: 845, y: 205, width: 220, height: 380, tone: "us-broker", variant: "section" },
    ],
    stageLabels: [
      { label: "国内资金", x: 140, y: 145 },
      { label: "美元换汇", x: 390, y: 145 },
      { label: "美卡 / 美资券商", x: 800, y: 145 },
    ],
  },
  {
    id: "hk-card-u-card-consume",
    label: "港卡 → U 卡 / 微信消费",
    description: "资金不一定要回国：港卡可以进入 StarryBlu U 卡，也可以用众安直接绑定国内微信支付。",
    tone: "consume",
    paths: [
      ["hsbc-hk", "starryblu", "wechat"],
      ["bochk", "starryblu", "alipay"],
      ["hsbc-hk", "za-bank", "wechat"],
      ["bochk", "za-bank", "wechat"],
    ],
    guidePaths: [{ id: "hk-u-card-consume-main", points: [{ x: 225, y: 372 }, { x: 465, y: 372 }, { x: 780, y: 372 }] }],
    steps: ["港卡资金进入 StarryBlu 或众安", "StarryBlu 作为虚拟 U 卡直接消费", "众安可绑定国内微信支付", "资金不必先回到国内银行卡"],
    layout: {
      "hsbc-hk": { x: 155, y: 290 },
      bochk: { x: 155, y: 455 },
      starryblu: { x: 468, y: 290 },
      "za-bank": { x: 468, y: 455 },
      wechat: { x: 865, y: 290 },
      alipay: { x: 865, y: 455 },
    },
    groups: [
      { label: "港卡资金", x: 70, y: 220, width: 170, height: 290, tone: "hk-bank", variant: "section" },
      { label: "U 卡 / 支付绑定", x: 380, y: 205, width: 175, height: 330, tone: "u-card", variant: "section" },
      { label: "国内平台", x: 780, y: 220, width: 170, height: 290, tone: "payment", variant: "section" },
    ],
    stageLabels: [
      { label: "港卡资金", x: 155, y: 150 },
      { label: "U 卡 / 绑定支付", x: 468, y: 150 },
      { label: "国内消费", x: 865, y: 150 },
    ],
  },
  {
    id: "crypto-u-card-consume",
    label: "国内平台 → 交易所 → 虚拟 U 卡 → 国内消费",
    description: "支付宝、微信等国内平台作为启动入口，资金进入币安 / 欧易等交易所，再转入 Bitget Wallet 或 SafePal，最后通过虚拟 U 卡在国内消费。",
    tone: "crypto",
    paths: [
      ["alipay", "binance", "bitget-wallet", "taobao"],
      ["wechat", "okx", "safepal", "meituan"],
      ["alipay", "bitget-exchange", "bitget-wallet", "taobao"],
      ["wechat", "bybit", "safepal", "meituan"],
    ],
    guidePaths: [{ id: "crypto-u-card-consume-main", points: [{ x: 235, y: 390 }, { x: 355, y: 390 }, { x: 540, y: 390 }, { x: 840, y: 390 }] }],
    steps: ["支付宝 / 微信作为境内平台起点", "资金进入币安、欧易、Bitget 或 Bybit", "加密资产转入 Bitget Wallet / SafePal", "虚拟 U 卡可直接用于淘宝、美团等消费"],
    layout: {
      wechat: { x: 145, y: 295 },
      alipay: { x: 145, y: 445 },
      binance: { x: 350, y: 230 },
      okx: { x: 350, y: 350 },
      "bitget-exchange": { x: 350, y: 470 },
      bybit: { x: 350, y: 590 },
      "bitget-wallet": { x: 635, y: 320 },
      safepal: { x: 635, y: 465 },
      taobao: { x: 935, y: 320 },
      meituan: { x: 935, y: 465 },
    },
    groups: [
      { label: "国内平台", x: 55, y: 230, width: 180, height: 290, tone: "payment", variant: "section" },
      { label: "交易所", x: 275, y: 170, width: 150, height: 470, tone: "exchange", variant: "section" },
      { label: "虚拟 U 卡", x: 540, y: 235, width: 190, height: 320, tone: "u-card", variant: "section" },
      { label: "国内消费", x: 840, y: 245, width: 190, height: 260, tone: "payment", variant: "section" },
    ],
    stageLabels: [
      { label: "国内平台", x: 145, y: 135 },
      { label: "交易所", x: 350, y: 135 },
      { label: "虚拟 U 卡 / 国内消费", x: 780, y: 135 },
    ],
  },
  {
    id: "crypto-to-us-broker",
    label: "国内平台 → 交易所 → U 卡 → 美资券商 / 美卡",
    description: "支付宝、微信等国内平台先进入币安 / 欧易，再通过 Bitget Wallet / SafePal 衔接盈透、嘉信，也可以转向华美银行、汇丰美国。",
    tone: "crypto",
    paths: [
      ["alipay", "binance", "bitget-wallet", "east-west", "ibkr"],
      ["wechat", "okx", "safepal", "hsbc-us", "schwab"],
      ["alipay", "okx", "safepal", "hsbc-us", "schwab"],
    ],
    guidePaths: [{ id: "crypto-to-us-broker-main", points: [{ x: 190, y: 395 }, { x: 315, y: 395 }, { x: 520, y: 395 }, { x: 745, y: 395 }, { x: 900, y: 395 }] }],
    steps: ["支付宝 / 微信是境内平台起点", "币安 / 欧易作为加密资金入口", "资金进入 Bitget Wallet / SafePal", "资金可落到美卡或继续进入盈透、嘉信"],
    layout: {
      wechat: { x: 115, y: 330 },
      alipay: { x: 115, y: 460 },
      binance: { x: 315, y: 330 },
      okx: { x: 315, y: 460 },
      "bitget-wallet": { x: 530, y: 330 },
      safepal: { x: 530, y: 460 },
      "east-west": { x: 745, y: 300 },
      "hsbc-us": { x: 745, y: 490 },
      ibkr: { x: 978, y: 330 },
      schwab: { x: 978, y: 460 },
    },
    groups: [
      { label: "国内平台", x: 40, y: 245, width: 150, height: 285, tone: "payment", variant: "section" },
      { label: "交易所", x: 240, y: 245, width: 150, height: 285, tone: "exchange", variant: "section" },
      { label: "虚拟 U 卡", x: 455, y: 245, width: 150, height: 285, tone: "u-card", variant: "section" },
      { label: "美资银行卡", x: 670, y: 220, width: 150, height: 350, tone: "us-bank", variant: "section" },
      { label: "美资券商", x: 900, y: 245, width: 155, height: 285, tone: "us-broker", variant: "section" },
    ],
    stageLabels: [
      { label: "国内平台", x: 115, y: 145 },
      { label: "交易所 / 虚拟 U 卡", x: 415, y: 145 },
      { label: "美卡 / 美资券商", x: 850, y: 145 },
    ],
  },
  {
    id: "return-home",
    label: "券商 → 回流工具 → 国内消费",
    description: "券商资金可以回到 Wise / iFast、港卡或 Neverless，再回到国内银行，最后进入支付消费。",
    tone: "return",
    paths: [
      ["ibkr", "ifast", "ccb", "wechat"],
      ["schwab", "wise", "cmb", "alipay"],
      ["futu", "bochk", "ccb", "taobao"],
      ["ibkr", "neverless", "cmb", "meituan"],
    ],
    guidePaths: [{ id: "return-home-main", points: [{ x: 285, y: 390 }, { x: 600, y: 390 }, { x: 620, y: 390 }, { x: 850, y: 390 }] }],
    steps: ["券商出金到中转卡、港卡或 Neverless", "资金回到建设银行 / 招商银行", "国内银行卡再进入支付消费", "适合投资资金回到日常消费场景"],
    layout: {
      ibkr: { x: 170, y: 285 },
      schwab: { x: 170, y: 390 },
      futu: { x: 170, y: 495 },
      ifast: { x: 410, y: 300 },
      wise: { x: 520, y: 300 },
      bochk: { x: 410, y: 480 },
      neverless: { x: 520, y: 480 },
      ccb: { x: 700, y: 330 },
      cmb: { x: 700, y: 455 },
      wechat: { x: 910, y: 310 },
      alipay: { x: 1020, y: 310 },
      taobao: { x: 910, y: 480 },
      meituan: { x: 1020, y: 480 },
    },
    groups: [
      { label: "券商出金", x: 55, y: 215, width: 230, height: 355, tone: "us-broker", variant: "section" },
      { label: "中转 / 回流", x: 330, y: 205, width: 270, height: 370, tone: "transfer-card", variant: "section" },
      { label: "国内银行卡", x: 620, y: 270, width: 160, height: 245, tone: "domestic-bank", variant: "section" },
      { label: "国内支付消费", x: 850, y: 230, width: 235, height: 340, tone: "payment", variant: "section" },
    ],
    stageLabels: [
      { label: "券商出金", x: 170, y: 125 },
      { label: "中转 / 回流", x: 465, y: 125 },
      { label: "国内银行卡", x: 700, y: 125 },
      { label: "国内支付消费", x: 970, y: 125 },
    ],
  },
];

const nodeById = new Map(nodes.map((node) => [node.id, node]));

function getRouteNodeIds(route: RoutePreset) {
  if (route.id === "overview") {
    return new Set(nodes.filter((node) => node.showInOverview !== false).map((node) => node.id));
  }
  return new Set(route.paths.flat());
}

function getNodePoint(node: FlowNode, route: RoutePreset): Point {
  const overviewPoint = overviewPointById.get(node.id) ?? node;
  return route.id === "overview" ? overviewPoint : route.layout?.[node.id] ?? overviewPoint;
}

function percent(value: number, base: number) {
  return `${(value / base) * 100}%`;
}

function pathFor(fromId: string, toId: string, route: RoutePreset) {
  const from = nodeById.get(fromId);
  const to = nodeById.get(toId);
  if (!from || !to) return "";

  const start = getNodePoint(from, route);
  const end = getNodePoint(to, route);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const curve = Math.max(80, Math.min(210, Math.abs(dx) * 0.38 + Math.abs(dy) * 0.1));
  const c1x = start.x + (dx >= 0 ? curve : -curve);
  const c2x = end.x - (dx >= 0 ? curve : -curve);

  return `M ${start.x} ${start.y} C ${c1x} ${start.y}, ${c2x} ${end.y}, ${end.x} ${end.y}`;
}

function pathFromPoints(points: Point[]) {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  return rest.reduce((path, end, index) => {
    const start = index === 0 ? first : rest[index - 1];
    const dx = end.x - start.x;
    const curve = Math.max(56, Math.min(180, Math.abs(dx) * 0.42));
    const c1x = start.x + (dx >= 0 ? curve : -curve);
    const c2x = end.x - (dx >= 0 ? curve : -curve);
    return `${path} C ${c1x} ${start.y}, ${c2x} ${end.y}, ${end.x} ${end.y}`;
  }, `M ${first.x} ${first.y}`);
}

function routeLineDescriptors(route: RoutePreset) {
  if (route.guidePaths?.length) {
    return route.guidePaths.map((guidePath) => ({
      id: `${route.id}-${guidePath.id}`,
      d: pathFromPoints(guidePath.points),
    }));
  }

  return route.paths.flatMap((path, pathIndex) =>
    path.slice(0, -1).map((from, index) => ({
      id: `${route.id}-${pathIndex}-${from}-${path[index + 1]}`,
      d: pathFor(from, path[index + 1], route),
    }))
  );
}

function FlowNodeCard({
  node,
  point,
  active,
  dimmed,
  overview,
  index,
  canvasWidth,
  canvasHeight,
}: {
  node: FlowNode;
  point: Point;
  active: boolean;
  dimmed: boolean;
  overview: boolean;
  index: number;
  canvasWidth: number;
  canvasHeight: number;
}) {
  const kind = nodeKinds[node.kind];

  return (
    <div
      className={cn(
        "absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-[cubic-bezier(.2,.8,.2,1)]",
        overview && "overview-float",
        active && !overview && "z-20 scale-105",
        dimmed && "pointer-events-none scale-75 opacity-0 grayscale"
      )}
      style={{
        left: percent(point.x, canvasWidth),
        top: percent(point.y, canvasHeight),
        animationDelay: `${(index % 9) * 130}ms`,
      }}
    >
      {node.kind === "process" ? (
        <div className="flex min-w-[150px] items-center justify-center gap-2 rounded-2xl border border-amber-300 bg-amber-50/95 px-4 py-3 text-center shadow-[0_16px_36px_rgba(245,158,11,0.16)] ring-1 ring-white/80 backdrop-blur dark:border-amber-700 dark:bg-amber-900/30">
          <Route className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
          <div>
            <div className="text-sm font-black leading-5 text-amber-800 dark:text-amber-200">{node.label}</div>
            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-300">{node.subtitle}</div>
          </div>
        </div>
      ) : (
        <div className="flex min-w-[78px] flex-col items-center">
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl border-2 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.14)] ring-4 ring-white/85 dark:ring-slate-950/75",
              kind.bg,
              overview ? "h-[58px] w-[58px]" : "h-[64px] w-[64px]",
              active && !overview && "shadow-[0_22px_46px_rgba(245,158,11,0.24)] ring-amber-200"
            )}
          >
            {node.icon ? <Image src={node.icon} alt={node.label} fill sizes="64px" className="object-cover" /> : null}
          </div>
          <div className="mt-1 max-w-[112px] rounded-xl bg-white/55 px-1.5 py-0.5 text-center backdrop-blur-sm dark:bg-slate-950/55">
            <div className="truncate text-[11px] font-black leading-4 text-slate-950 dark:text-white">{node.label}</div>
            <div className={cn("truncate text-[9px] font-black leading-3", kind.color)}>{node.subtitle}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function RouteGroupBox({ group }: { group: FlowGroup }) {
  const kind = nodeKinds[group.tone];
  const section = group.variant !== "sub";
  return (
    <div
      className={cn(
        "absolute rounded-[30px] backdrop-blur-[1px]",
        section
          ? "z-[1] border bg-white/42 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_18px_48px_rgba(15,23,42,0.05)] ring-1 ring-white/70"
          : "z-[2] border-2 border-dashed bg-white/24 shadow-inner",
        kind.bg
      )}
      style={{
        left: percent(group.x, graphWidth),
        top: percent(group.y, graphHeight),
        width: percent(group.width, graphWidth),
        height: percent(group.height, graphHeight),
      }}
    >
      <span
        className={cn(
          "absolute left-4 rounded-full border bg-white px-3 py-1 font-black shadow-sm",
          section ? "-top-3.5 text-[11px]" : "-top-3 text-[10px]",
          kind.bg,
          kind.color
        )}
      >
        {group.label}
      </span>
    </div>
  );
}

function StageLabelChip({ label }: { label: StageLabel }) {
  return (
    <div
      className="absolute z-[5] -translate-x-1/2 rounded-full border border-slate-200 bg-white/88 px-3 py-1 text-xs font-black text-slate-500 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-300"
      style={{ left: percent(label.x, graphWidth), top: percent(label.y, graphHeight) }}
    >
      {label.label}
    </div>
  );
}

function RouteLines({ route }: { route: RoutePreset }) {
  if (route.id === "overview") {
    const center = overviewSize / 2;
    return (
      <>
        <circle cx={center} cy={center} r="318" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="9 12" opacity="0.26" className="orbit-line" />
        <circle cx={center} cy={center} r="245" fill="none" stroke="#94a3b8" strokeWidth="1.6" strokeDasharray="5 10" opacity="0.25" className="orbit-line orbit-line-slow" />
        <circle cx={center} cy={center} r="160" fill="none" stroke="#f59e0b" strokeWidth="1.4" strokeDasharray="4 12" opacity="0.18" />
      </>
    );
  }

  const stroke = routeTones[route.tone].stroke;
  const lines = routeLineDescriptors(route).filter((line) => line.d);
  return (
    <>
      {lines.map((line) => (
        <path key={`${line.id}-underlay`} d={line.d} fill="none" stroke={stroke} strokeWidth="15" strokeLinecap="round" opacity="0.12" />
      ))}
      {lines.map((line, index) => (
        <path
          key={line.id}
          id={`flow-${line.id}`}
          d={line.d}
          fill="none"
          stroke={stroke}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray="1 16"
          markerEnd={`url(#arrow-${route.tone})`}
          className="flow-line"
          style={{ animationDelay: `${index * 90}ms` }}
        />
      ))}
      {lines.map((line, index) => (
        <circle key={`${line.id}-dot`} r="5.5" fill={stroke} className="flow-particle">
          <animateMotion dur="2.35s" repeatCount="indefinite" begin={`${index * 0.16}s`}>
            <mpath href={`#flow-${line.id}`} />
          </animateMotion>
        </circle>
      ))}
    </>
  );
}

export default function CapitalFlowMap() {
  const [selectedRouteId, setSelectedRouteId] = useState("overview");
  const selectedRoute = routes.find((route) => route.id === selectedRouteId) ?? routes[0];
  const overview = selectedRoute.id === "overview";
  const activeNodeIds = useMemo(() => getRouteNodeIds(selectedRoute), [selectedRoute]);
  const visibleNodes = useMemo(() => {
    return nodes.filter((node) => overview ? node.showInOverview !== false : node.showInOverview !== false || activeNodeIds.has(node.id));
  }, [activeNodeIds, overview]);
  const canvasWidth = overview ? overviewSize : graphWidth;
  const canvasHeight = overview ? overviewSize : graphHeight;

  return (
    <div className="relative h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dot-grid dot-grid-light dark:bg-slate-950">
      <div className="relative z-[1] grid h-full w-full gap-3 px-3 py-3 xl:grid-cols-[minmax(0,1fr)_286px]">
        <section className="min-h-0 overflow-hidden rounded-[28px] border border-slate-200/90 bg-white/86 shadow-[0_24px_72px_rgba(15,23,42,0.09)] ring-1 ring-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/86 dark:ring-white/5">
          <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.28)_1px,transparent_0)] [background-size:22px_22px]">
            <div
              className={cn(
                "absolute transition-all duration-700 ease-[cubic-bezier(.2,.8,.2,1)]",
                overview
                  ? "left-1/2 top-1/2 aspect-square max-h-[calc(100%-24px)] max-w-[calc(100%-24px)] -translate-x-1/2 -translate-y-1/2"
                  : "inset-0 h-full w-full"
              )}
              style={overview ? { width: "min(100%, calc(100vh - 112px))" } : undefined}
            >
            <svg
              className="absolute inset-0 z-[3] h-full w-full"
              viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
              preserveAspectRatio={overview ? "xMidYMid meet" : "none"}
              aria-hidden="true"
            >
              <defs>
                {(Object.keys(routeTones) as RoutePreset["tone"][]).map((tone) => (
                  <marker key={tone} id={`arrow-${tone}`} markerWidth="12" markerHeight="12" refX="9" refY="4" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,8 L10,4 z" fill={routeTones[tone].stroke} />
                  </marker>
                ))}
              </defs>
              <RouteLines route={selectedRoute} />
            </svg>

            {selectedRoute.groups?.map((group) => <RouteGroupBox key={group.label} group={group} />)}
            {selectedRoute.stageLabels?.map((label) => <StageLabelChip key={label.label} label={label} />)}

            {overview ? (
              <div className="absolute left-1/2 top-1/2 z-[4] flex h-40 w-40 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-amber-200 bg-white/88 text-center shadow-[0_20px_58px_rgba(15,23,42,0.10)] ring-1 ring-white/90 backdrop-blur-xl dark:border-amber-800/60 dark:bg-slate-950/88">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">WiseInvest</div>
                <div className="mt-1 px-5 text-lg font-black leading-6 text-slate-950 dark:text-white">资金路径地图</div>
                <div className="mt-2 text-[11px] font-bold text-slate-400">右侧选择链路</div>
              </div>
            ) : null}

            {visibleNodes.map((node, index) => {
              const active = activeNodeIds.has(node.id);
              return (
                <FlowNodeCard
                  key={node.id}
                  node={node}
                  point={getNodePoint(node, selectedRoute)}
                  active={!overview && active}
                  dimmed={!overview && !active}
                  overview={overview}
                  index={index}
                  canvasWidth={canvasWidth}
                  canvasHeight={canvasHeight}
                />
              );
            })}
            </div>
          </div>
        </section>

        <aside className="min-h-0 overflow-y-auto rounded-[26px] border border-slate-200/90 bg-white/92 p-3 shadow-[0_18px_54px_rgba(15,23,42,0.07)] ring-1 ring-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/92 dark:ring-white/5">
          <div className="mb-3">
            <label className="mb-1.5 block text-[11px] font-black text-slate-400">选择资金路线</label>
            <div className="relative">
              <select
                value={selectedRouteId}
                onChange={(event) => setSelectedRouteId(event.target.value)}
                className="h-10 w-full appearance-none rounded-xl border border-amber-200 bg-amber-50 px-3 pr-9 text-xs font-black text-amber-800 outline-none transition-colors hover:border-amber-300 focus:border-amber-400 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300"
              >
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-700 dark:text-amber-300" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/70">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[10px] font-black text-amber-700 dark:border-amber-800/60 dark:bg-slate-950 dark:text-amber-300">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: routeTones[selectedRoute.tone].stroke }} />
              {routeTones[selectedRoute.tone].label}
            </div>
            <h2 className="text-base font-black leading-6 text-slate-950 dark:text-white">{selectedRoute.label}</h2>
            <p className="mt-2 text-xs font-medium leading-6 text-slate-600 dark:text-slate-300">{selectedRoute.description}</p>
          </div>

          <div className="mt-3 space-y-2">
            {selectedRoute.steps.map((step, index) => (
              <div key={step} className="flex gap-2 rounded-2xl border border-slate-200/80 bg-white/70 p-2.5 dark:border-slate-800 dark:bg-slate-950/60">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-950 font-mono text-[10px] font-black text-amber-300 dark:bg-amber-400 dark:text-slate-950">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-[11px] font-semibold leading-5 text-slate-600 dark:text-slate-300">{step}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <style jsx>{`
        .flow-line {
          animation: flow-dash 1.4s linear infinite;
          filter: drop-shadow(0 8px 10px rgba(15, 23, 42, 0.12));
          opacity: 0.82;
        }

        .flow-particle {
          opacity: 0.96;
          filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.42)) drop-shadow(0 4px 10px rgba(15, 23, 42, 0.16));
        }

        .orbit-line {
          animation: flow-dash 5.6s linear infinite;
        }

        .orbit-line-slow {
          animation-duration: 8s;
        }

        .overview-float {
          animation-name: node-float;
          animation-duration: 5.6s;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }

        @keyframes flow-dash {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: -50;
          }
        }

        @keyframes node-float {
          0%,
          100% {
            transform: translate(-50%, -50%) translate3d(0, 0, 0);
          }
          50% {
            transform: translate(-50%, -50%) translate3d(0, -8px, 0);
          }
        }
      `}</style>
    </div>
  );
}
