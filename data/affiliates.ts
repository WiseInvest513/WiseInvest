export interface AffiliateItem {
  name: string
  description: string
  inviteCode: string
  benefit: string
  url: string
  isRecommended: boolean
}

export const affiliatesData: AffiliateItem[] = [
  {
    name: 'Binance',
    description: '全球最大的加密货币交易所',
    inviteCode: 'BINANCE2024',
    benefit: '最高返佣 20%',
    url: 'https://www.binance.com',
    isRecommended: true,
  },
  {
    name: 'OKX',
    description: '领先的加密货币交易平台',
    inviteCode: 'OKX2024',
    benefit: '开户奖励 $200',
    url: 'https://www.okx.com',
    isRecommended: true,
  },
  {
    name: 'Interactive Brokers',
    description: '全球领先的在线交易平台',
    inviteCode: 'IB2024',
    benefit: '免佣金交易',
    url: 'https://www.interactivebrokers.com',
    isRecommended: true,
  },
  {
    name: 'Wise',
    description: '国际汇款和货币兑换服务',
    inviteCode: 'WISE2024',
    benefit: '首次转账免费',
    url: 'https://wise.com',
    isRecommended: false,
  },
]
