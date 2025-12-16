export interface ToolItem {
  name: string
  desc: string
  url: string
  isAffiliate: boolean
}

export interface ToolCategory {
  category: string
  items: ToolItem[]
}

export const toolsData: ToolCategory[] = [
  {
    category: '美股交易平台',
    items: [
      {
        name: 'Interactive Brokers',
        desc: '全球领先的在线交易平台，支持美股、期权、期货等多种产品',
        url: 'https://www.interactivebrokers.com',
        isAffiliate: true,
      },
      {
        name: 'TD Ameritrade',
        desc: '美国知名券商，提供丰富的交易工具和教育资源',
        url: 'https://www.tdameritrade.com',
        isAffiliate: false,
      },
    ],
  },
  {
    category: '加密货币',
    items: [
      {
        name: 'Coinbase',
        desc: '美国最大的加密货币交易所，安全可靠',
        url: 'https://www.coinbase.com',
        isAffiliate: true,
      },
      {
        name: 'Binance',
        desc: '全球最大的加密货币交易平台',
        url: 'https://www.binance.com',
        isAffiliate: false,
      },
    ],
  },
  {
    category: '数据分析',
    items: [
      {
        name: 'TradingView',
        desc: '专业的图表分析平台，支持多种技术指标',
        url: 'https://www.tradingview.com',
        isAffiliate: false,
      },
      {
        name: 'Yahoo Finance',
        desc: '免费的金融数据和分析工具',
        url: 'https://finance.yahoo.com',
        isAffiliate: false,
      },
    ],
  },
]
