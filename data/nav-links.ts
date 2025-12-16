export interface NavLink {
  name: string
  description: string
  url: string
  category: '行情工具' | '链上数据' | '宏观数据' | '分析工具'
}

export const navLinksData: NavLink[] = [
  {
    name: 'TradingView',
    description: '专业的图表分析平台, 支持多种技术指标',
    url: 'https://www.tradingview.com',
    category: '行情工具',
  },
  {
    name: 'Yahoo Finance',
    description: '免费的金融数据和分析工具',
    url: 'https://finance.yahoo.com',
    category: '行情工具',
  },
  {
    name: 'Investing.com',
    description: '全球金融市场数据和新闻',
    url: 'https://www.investing.com',
    category: '行情工具',
  },
  {
    name: 'Etherscan',
    description: '以太坊区块链浏览器和数据分析',
    url: 'https://etherscan.io',
    category: '链上数据',
  },
  {
    name: 'Dune Analytics',
    description: '链上数据分析和可视化平台',
    url: 'https://dune.com',
    category: '链上数据',
  },
]

export const categories = ['行情工具', '链上数据', '宏观数据', '分析工具'] as const
