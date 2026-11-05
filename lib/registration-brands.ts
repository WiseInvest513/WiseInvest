import { articleRegistrationBenefits, registrationBenefitGaps, type RegistrationBenefits } from "@/lib/registration-benefits";

export type RegistrationBrand = {
  name: string;
  iconSrc: string;
  tone: "yellow" | "black" | "blue" | "green" | "orange" | "purple" | "red" | "teal";
  benefits?: RegistrationBenefits;
  benefitGap?: string;
};

export const registrationBrandColors = {
  binance: "yellow",
  okx: "black",
  bitget: "blue",
  bit: "blue",
} as const;

const bit: RegistrationBrand = {
  name: "BIT",
  iconSrc: "/images/registration/bit.jpeg",
  tone: registrationBrandColors.bit,
  benefits: {
    title: "11 月新人福利",
    period: "2026.11.01—11.30",
    items: [
      { value: "$100", label: "平台费抵扣卡", condition: "注册后进入证券页领取，30 天有效。" },
      { value: "最高 $200", label: "股票现金卡", condition: "活动期内首次入金，14 天内净入金达 $10,000，再连续留存 30 天。" },
    ],
    note: "按条件领取，卡券不可直接提现。",
    detailsHref: "/articles/broker/AEXjQDo5#h-15",
  },
};

const exchangeBenefits: RegistrationBrand["benefits"] = {
  summaryText: "永久 20% 交易手续费返佣",
  title: "Wise 专属返佣",
  period: "永久有效",
  items: [{ value: "20%", label: "交易手续费返佣", condition: "通过 Wise 邀请渠道注册，确认邀请关系已绑定。" }],
};

function exchange(name: string, iconSrc: string, tone: RegistrationBrand["tone"]): RegistrationBrand {
  return { name, iconSrc, tone, benefits: exchangeBenefits };
}

const binance = exchange("Binance 币安", "/images/perks/overview/binance.svg", "yellow");
const okx = exchange("OKX 欧易", "/images/capital-flow/okx.jpeg", "black");
const bitget = exchange("Bitget", "/images/capital-flow/bitget.jpeg", "blue");
const bybit = exchange("Bybit", "/images/capital-flow/bybit.jpeg", "black");
const gate = exchange("Gate", "/images/registration/gate.jpg", "blue");
const weex = exchange("WEEX", "/images/perks/weex.png", "yellow");
const bbae: RegistrationBrand = {
  name: "BBAE", iconSrc: "/images/registration/bbae.jpg", tone: "blue",
  benefits: {
    summaryText: "首次入金 2,000 美元，领取 20 美元奖励",
    title: "Wise 邀请奖励",
    items: [{ value: "$20", label: "现金奖励", condition: "填写 stiibsmu3，首次入金 $2,000 后领取。" }],
  },
};
const fosun: RegistrationBrand = {
  name: "复星证券", iconSrc: "/images/capital-flow/fosun.jpeg", tone: "orange",
  benefits: {
    summaryText: "入金等值 10,000 港币，解锁免佣",
    title: "Wise 开户权益",
    items: [{ value: "免佣", label: "入金达标解锁", condition: "填写 AGVPK3，入金等值 10,000 港币即可解锁免佣。" }],
  },
};

// Product titles take priority over domains. A card or wallet can share the
// exchange's domain and code without sharing its trading rebate.
const brandsByTitle: [RegExp, RegistrationBrand][] = [
  [/Bitget.*(?:Wallet|Card|钱包|卡)/i, { name: "Bitget Wallet", iconSrc: "/images/capital-flow/bitget-wallet.jpeg", tone: "blue" }],
  [/Bybit.*(?:Card|卡)/i, { name: "Bybit Card", iconSrc: "/images/capital-flow/bybit.jpeg", tone: "black" }],
  [/Gate.*(?:Card|卡)/i, { name: "Gate Card", iconSrc: "/images/registration/gate.jpg", tone: "blue" }],
  [/(?:币安|Binance)/i, binance], [/OKX|欧易/i, okx], [/Bitget/i, bitget], [/Bybit/i, bybit], [/Gate/i, gate], [/WEEX/i, weex],
  [/BBAE|必贝/i, bbae], [/复星/, fosun], [/\bBIT\b/i, bit],
  [/腾达/, { name: "腾达证券", iconSrc: "/images/capital-flow/tengda.jpeg", tone: "yellow" }],
  [/致富/, { name: "致富证券", iconSrc: "/images/capital-flow/chief.jpeg", tone: "blue" }],
  [/盈透|IBKR/i, { name: "盈透证券", iconSrc: "/images/capital-flow/ibkr.jpeg", tone: "red" }],
  [/SafePal/i, { name: "SafePal", iconSrc: "/images/capital-flow/safepal.jpeg", tone: "purple" }],
  [/BiyaPay/i, { name: "BiyaPay", iconSrc: "/images/capital-flow/biyapay.jpeg", tone: "black" }],
  [/StockCoin/i, { name: "StockCoin", iconSrc: "/images/perks/stockcoin-icon.svg", tone: "black" }],
  [/StableStock/i, { name: "StableStock", iconSrc: "/images/registration/stablestock.jpeg", tone: "green" }],
  [/Predict/i, { name: "Predict", iconSrc: "/images/registration/predict.png", tone: "purple" }],
  [/\bSGB\b|新加坡海湾银行/i, { name: "SGB", iconSrc: "/images/registration/sgb.jpeg", tone: "purple" }],
  [/平安数字|PAOB/i, { name: "平安数字银行", iconSrc: "/images/registration/paob.webp", tone: "orange" }],
  [/汇立|WeLab/i, { name: "汇立银行", iconSrc: "/images/registration/welab.jpeg", tone: "orange" }],
  [/蚂蚁银行澳门|澳门蚂蚁/, { name: "蚂蚁银行澳门", iconSrc: "/images/registration/antbank.jpeg", tone: "blue" }],
  [/GamsGo/i, { name: "GamsGo", iconSrc: "/images/registration/gamsgo.ico", tone: "red" }],
  [/沉浸式翻译|Immersive Translate/i, { name: "沉浸式翻译", iconSrc: "/images/registration/immersive-translate.svg", tone: "purple" }],
  [/XeSIM/i, { name: "XeSIM", iconSrc: "/images/registration/xesim.png", tone: "orange" }],
  [/StarryBlu/i, { name: "StarryBlu", iconSrc: "/images/registration/starryblu.png", tone: "blue" }],
  [/UU\s*Wallet/i, { name: "UU Wallet", iconSrc: "/images/perks/uu-wallet.jpg", tone: "green" }],
  [/BenPay/i, { name: "BenPay", iconSrc: "/images/perks/benpay-card.jpg", tone: "blue" }],
  [/MP\s*Card/i, { name: "MPCard", iconSrc: "/images/registration/mp.png", tone: "green" }],
  [/\bWise\b/i, { name: "Wise", iconSrc: "/images/capital-flow/wise.jpeg", tone: "green" }],
  [/iFAST/i, { name: "iFAST", iconSrc: "/images/capital-flow/ifast.jpeg", tone: "teal" }],
  [/众安|ZA Bank/i, { name: "众安银行", iconSrc: "/images/capital-flow/za-bank.jpeg", tone: "teal" }],
];

const brandsByHost: Record<string, RegistrationBrand> = {
  "invest.matrixport.com": bit,
  "www.bit.com": bit,
  "bit.com": bit,
};

function withArticleBenefits(brand: RegistrationBrand): RegistrationBrand {
  return { ...brand, benefits: brand.benefits ?? articleRegistrationBenefits[brand.name], benefitGap: registrationBenefitGaps[brand.name] };
}

export function getRegistrationBrand(href?: string, title?: string): RegistrationBrand | undefined {
  if (title) {
    const match = brandsByTitle.find(([pattern]) => pattern.test(title));
    if (match) {
      return /Card|Wallet|卡|钱包/i.test(title) && match[1].benefits === exchangeBenefits
        ? { ...match[1], benefits: undefined }
        : withArticleBenefits(match[1]);
    }
    // Do not infer exchange benefits for an unrecognised card/wallet product.
    if (/Card|Wallet|卡|钱包/i.test(title)) return undefined;
  }
  if (!href) return undefined;
  try {
    const host = new URL(href).hostname;
    return Object.hasOwn(brandsByHost, host) ? withArticleBenefits(brandsByHost[host]) : undefined;
  } catch {
    return undefined;
  }
}
