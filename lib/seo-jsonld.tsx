import { siteConfig } from "@/lib/config";

export type SeoFaqItem = {
  question: string;
  answer: string;
};

export type SeoPageConfig = {
  name: string;
  path: string;
  description: string;
  keywords: string[];
  type: "tool" | "practice" | "ipo";
  faqs: SeoFaqItem[];
};

export const seoPageConfigs: Record<string, SeoPageConfig> = {
  "/practice/dca-investment": {
    name: "BTC / ETH 定投实盘",
    path: "/practice/dca-investment",
    description: "持续记录 Wise Invest 的 BTC / ETH 定投执行价格、收益曲线、累计成本和明细。",
    keywords: ["BTC 定投记录", "ETH 定投收益", "比特币定投", "以太坊定投", "DCA 定投", "定投收益曲线"],
    type: "practice",
    faqs: [
      {
        question: "BTC / ETH 定投实盘记录看什么？",
        answer: "重点看每期执行价格、累计投入、持仓数量、组合市值和收益曲线，而不是只看单期涨跌。",
      },
      {
        question: "定投收益曲线有什么用？",
        answer: "收益曲线可以帮助判断长期成本区间、回撤承受度和执行纪律，适合复盘长期配置节奏。",
      },
      {
        question: "这个页面是投资建议吗？",
        answer: "不是。页面展示 Wise Invest 的真实记录和工具化计算，仅供学习和复盘，不构成买卖建议。",
      },
    ],
  },
  "/practice/binance-dca": {
    name: "BNB / QQQ 定投记录",
    path: "/practice/binance-dca",
    description: "记录 BNB 和 QQQ 定投的执行日期、第一期价格和后续长期跟踪计划。",
    keywords: ["BNB 定投", "QQQ 定投", "币安定投", "纳斯达克100 ETF 定投", "DCA 记录"],
    type: "practice",
    faqs: [
      {
        question: "BNB / QQQ 为什么单独记录？",
        answer: "BNB 属于币安生态资产，QQQ 属于纳斯达克 100 ETF，逻辑和 BTC / ETH 不同，所以单独记录更清晰。",
      },
      {
        question: "为什么现在没有收益曲线？",
        answer: "当前只有第一期记录，样本不足以形成有意义的收益曲线，后续期数增加后再接入曲线。",
      },
      {
        question: "这个页面适合谁看？",
        answer: "适合想跟踪 BNB、QQQ 长期买入价格，并对比加密资产和美股 ETF 定投节奏的人。",
      },
    ],
  },
  "/tools/average-down": {
    name: "补仓计算器",
    path: "/tools/average-down",
    description: "计算股票、ETF、BTC 等资产补仓后的平均成本、回本涨幅和仓位变化。",
    keywords: ["补仓计算器", "平均成本计算", "回本涨幅", "股票补仓", "BTC 补仓"],
    type: "tool",
    faqs: [
      {
        question: "补仓计算器能算什么？",
        answer: "可以根据原持仓、原成本、补仓价格和补仓金额，计算补仓后的平均成本和回本所需涨幅。",
      },
      {
        question: "补仓后成本降低就一定好吗？",
        answer: "不一定。成本降低不代表风险降低，仍要看仓位占比、资产质量和继续下跌时的承受能力。",
      },
      {
        question: "这个工具适合哪些资产？",
        answer: "适合股票、ETF、BTC、ETH 等可用单价和数量表达的资产，不适合复杂期权或杠杆组合。",
      },
    ],
  },
  "/tools/contract-calculator": {
    name: "合约交易计算器",
    path: "/tools/contract-calculator",
    description: "计算合约保证金、杠杆、盈亏、收益率和强平价格，辅助交易前风险评估。",
    keywords: ["合约计算器", "强平价格计算", "保证金计算", "杠杆交易", "币圈合约"],
    type: "tool",
    faqs: [
      {
        question: "合约计算器主要解决什么问题？",
        answer: "用于在开仓前估算保证金占用、收益率、盈亏金额和强平风险，避免只凭感觉下单。",
      },
      {
        question: "强平价格为什么只是估算？",
        answer: "不同交易所的维持保证金率、手续费和资金费率不同，页面结果适合作为交易前风险参考。",
      },
      {
        question: "新手应该怎么用这个工具？",
        answer: "先用低杠杆和小仓位测试，重点看亏损金额是否能承受，而不是只看理论收益率。",
      },
    ],
  },
  "/tools/asset-growth": {
    name: "资产增长对比工具",
    path: "/tools/asset-growth",
    description: "对比美股、黄金、指数等资产在长期周期中的增长曲线和关键回撤阶段。",
    keywords: ["资产增长", "长期回报", "资产配置", "美股回报", "黄金回报"],
    type: "tool",
    faqs: [
      {
        question: "资产增长对比工具适合看什么？",
        answer: "适合比较不同资产在长期周期里的增长路径、波动差异和重大回撤阶段。",
      },
      {
        question: "为什么要看对数刻度？",
        answer: "长期资产涨幅跨度很大，对数刻度更容易比较不同阶段的相对增长速度。",
      },
      {
        question: "历史回报能代表未来吗？",
        answer: "不能。历史数据只用于理解周期和波动，不能保证未来收益会重复。",
      },
    ],
  },
  "/tools/gas-tracker": {
    name: "多链 Gas 查询工具",
    path: "/tools/gas-tracker",
    description: "查询 ETH、Solana、Arbitrum、BSC、Base、BTC、Tron 等网络的手续费和转账成本。",
    keywords: ["Gas 查询", "ETH Gas", "Solana Gas", "BSC Gas", "链上手续费"],
    type: "tool",
    faqs: [
      {
        question: "Gas 查询工具看哪些链？",
        answer: "页面覆盖 Ethereum、Solana、Arbitrum、BSC、Base、Bitcoin、Sui、Aptos、Tron、Optimism 等网络。",
      },
      {
        question: "Gas 高低对用户有什么影响？",
        answer: "Gas 会直接影响转账、Swap、NFT 操作和跨链成本，手续费高时可以考虑等待或换用 L2。",
      },
      {
        question: "页面上的手续费是最终金额吗？",
        answer: "不是。链上手续费会实时变化，实际金额以钱包或交易所提交交易时显示为准。",
      },
    ],
  },
  "/tools/portfolio-tracker": {
    name: "投资组合追踪工具",
    path: "/tools/portfolio-tracker",
    description: "记录资产持仓、组合市值、资产配置比例和收益变化，辅助长期投资复盘。",
    keywords: ["投资组合追踪", "持仓记录", "资产配置", "组合收益", "美股组合", "加密资产组合"],
    type: "tool",
    faqs: [
      {
        question: "投资组合追踪工具能做什么？",
        answer: "可以记录不同资产持仓，查看组合市值、配置比例和收益变化，帮助长期复盘。",
      },
      {
        question: "为什么要看资产配置比例？",
        answer: "配置比例能反映组合风险来源，避免单一资产涨跌对整体结果影响过大。",
      },
      {
        question: "这个工具会替我自动做投资决策吗？",
        answer: "不会。它只帮助记录和计算，具体买卖和调仓仍需要用户自己判断。",
      },
    ],
  },
  "/ipo": {
    name: "A 股集合打新与港股打新入口",
    path: "/ipo",
    description: "整理 A 股集合打新、港股打新、参与流程、持仓资格、收益记录和风险说明。",
    keywords: ["港股打新", "A 股打新", "集合打新", "新股申购", "打新流程"],
    type: "ipo",
    faqs: [
      {
        question: "打新页面主要适合谁？",
        answer: "适合想了解 A 股集合打新、港股打新流程、参与资格和历史收益记录的用户。",
      },
      {
        question: "打新一定赚钱吗？",
        answer: "不一定。新股申购存在破发、资金占用、手续费和市场波动风险，不能只看历史收益。",
      },
      {
        question: "参与前应该先确认什么？",
        answer: "先确认账户资格、资金安排、申购规则、费用和自己能否接受中签后波动。",
      },
    ],
  },
};

export function createFaqJsonLd(config: Pick<SeoPageConfig, "faqs">) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: config.faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function createPageJsonLd(config: SeoPageConfig) {
  if (config.type === "tool") {
    return {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: config.name,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      url: siteConfig.url(config.path),
      description: config.description,
      keywords: config.keywords.join(", "),
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      publisher: {
        "@type": "Organization",
        name: siteConfig.name,
        url: siteConfig.baseUrl,
      },
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: config.name,
    url: siteConfig.url(config.path),
    description: config.description,
    keywords: config.keywords.join(", "),
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.baseUrl,
    },
  };
}

export function SeoJsonLd({ data }: { data: unknown | unknown[] }) {
  const items = Array.isArray(data) ? data : [data];

  return (
    <>
      {items.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}

export function SeoFaqBlock({
  items,
  title = "常见问题",
}: {
  items: SeoFaqItem[];
  title?: string;
}) {
  return (
    <section className="bg-slate-50 px-4 pb-10 dark:bg-slate-950 md:px-6">
      <div className="mx-auto max-w-5xl rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.055)] dark:border-slate-800 dark:bg-slate-900 md:p-6">
        <h2 className="text-xl font-black text-slate-950 dark:text-white">{title}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {items.map((item) => (
            <article key={item.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <h3 className="text-sm font-black leading-6 text-slate-950 dark:text-white">{item.question}</h3>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{item.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
