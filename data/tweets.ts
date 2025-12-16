export interface TweetResource {
  title: string
  url: string
  category: '定投' | '美股' | 'Web3' | '宏观' | '策略'
  type: '干货' | '教程' | '资讯' | '观点'
  tags: string[]
}

export const tweetsData: TweetResource[] = [
  {
    title: '长期定投策略:为什么时间比时机更重要',
    url: 'https://twitter.com/example/status/123456',
    category: '定投',
    type: '干货',
    tags: ['定投', '长期主义'],
  },
  {
    title: '纳斯达克100指数成分股深度分析',
    url: 'https://twitter.com/example/status/123457',
    category: '美股',
    type: '教程',
    tags: ['美股', '纳斯达克'],
  },
  {
    title: 'Web3投资框架:如何评估加密项目',
    url: 'https://twitter.com/example/status/123458',
    category: 'Web3',
    type: '干货',
    tags: ['Web3', '加密货币'],
  },
  {
    title: '美联储政策对市场的影响分析',
    url: 'https://twitter.com/example/status/123459',
    category: '宏观',
    type: '资讯',
    tags: ['宏观', '美联储'],
  },
  {
    title: '价值投资 vs 成长投资:如何选择',
    url: 'https://twitter.com/example/status/123460',
    category: '策略',
    type: '观点',
    tags: ['策略', '价值投资', '成长投资'],
  },
]

export const categories = ['定投', '美股', 'Web3', '宏观', '策略'] as const
export const types = ['干货', '教程', '资讯', '观点'] as const
