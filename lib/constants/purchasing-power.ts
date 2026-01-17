/**
 * Purchasing Power Context - Real World Items Database
 * 购买力上下文：真实世界物品数据库
 * 
 * 将投资收益转换为真实世界物品的购买力，帮助用户更好地理解收益的实际价值
 */

export interface RealWorldItem {
  id: string;
  name: string;
  nameEn: string;
  priceCNY: number;
  icon: string;
  category: 'food' | 'entertainment' | 'luxury' | 'electronics' | 'vehicle' | 'property';
  description?: string;
}

export const REAL_WORLD_ITEMS: RealWorldItem[] = [
  {
    id: 'braised-pork-rice',
    name: '猪脚饭',
    nameEn: 'Braised Pork Rice',
    priceCNY: 20,
    icon: '🍚',
    category: 'food',
    description: '经典广式猪脚饭',
  },
  {
    id: 'movie-ticket',
    name: '看电影',
    nameEn: 'Movie Ticket',
    priceCNY: 70,
    icon: '🎬',
    category: 'entertainment',
    description: '一张电影票',
  },
  {
    id: 'hot-pot',
    name: '火锅',
    nameEn: 'Hot Pot',
    priceCNY: 200,
    icon: '🍲',
    category: 'food',
    description: '一顿火锅',
  },
  {
    id: 'club-vip-model',
    name: '会所嫩模',
    nameEn: 'Club VIP Model',
    priceCNY: 1800,
    icon: '💃',
    category: 'luxury',
    description: '会所VIP服务',
  },
  {
    id: 'iphone-15',
    name: 'iPhone 15',
    nameEn: 'iPhone 15',
    priceCNY: 6000,
    icon: '📱',
    category: 'electronics',
    description: 'iPhone 15 标准版',
  },
  {
    id: 'rolex-submariner',
    name: '劳力士',
    nameEn: 'Rolex Submariner',
    priceCNY: 70000,
    icon: '⌚',
    category: 'luxury',
    description: '劳力士潜航者系列',
  },
  {
    id: 'xiaomi-su7',
    name: '小米 SU7',
    nameEn: 'Xiaomi SU7',
    priceCNY: 220000,
    icon: '🏎️',
    category: 'vehicle',
    description: '小米 SU7 电动汽车',
  },
  {
    id: 'mercedes-e300l',
    name: '奔驰 E300L',
    nameEn: 'Mercedes E300L',
    priceCNY: 450000,
    icon: '🚘',
    category: 'vehicle',
    description: '奔驰 E300L 豪华轿车',
  },
  {
    id: 'shenzhen-bay-no1',
    name: '深圳湾一号',
    nameEn: 'Shenzhen Bay No.1',
    priceCNY: 35000000,
    icon: '🏙️',
    category: 'property',
    description: '深圳湾一号豪宅',
  },
];

/**
 * 根据金额（CNY）找到最合适的物品
 * 返回最接近但不超过该金额的物品
 */
export function findBestMatchingItem(amountCNY: number): RealWorldItem | null {
  if (amountCNY <= 0) return null;

  // 按价格从高到低排序
  const sortedItems = [...REAL_WORLD_ITEMS].sort((a, b) => b.priceCNY - a.priceCNY);

  // 找到第一个价格小于等于金额的物品
  for (const item of sortedItems) {
    if (item.priceCNY <= amountCNY) {
      return item;
    }
  }

  // 如果金额小于最便宜物品，返回最便宜的
  return sortedItems[sortedItems.length - 1];
}

/**
 * 计算可以购买的数量和组合
 * 返回主要物品和次要物品的组合
 */
export function calculatePurchasingPower(amountCNY: number): {
  primary: { item: RealWorldItem; quantity: number };
  secondary?: { item: RealWorldItem; quantity: number };
} | null {
  if (amountCNY <= 0) return null;

  const sortedItems = [...REAL_WORLD_ITEMS].sort((a, b) => b.priceCNY - a.priceCNY);
  
  // 找到主要物品（最接近但不超过）
  let primaryItem: RealWorldItem | null = null;
  for (const item of sortedItems) {
    if (item.priceCNY <= amountCNY) {
      primaryItem = item;
      break;
    }
  }

  if (!primaryItem) {
    primaryItem = sortedItems[sortedItems.length - 1];
  }

  const primaryQuantity = Math.floor(amountCNY / primaryItem.priceCNY);
  const remainder = amountCNY - (primaryQuantity * primaryItem.priceCNY);

  // 如果有余数，找次要物品
  let secondary: { item: RealWorldItem; quantity: number } | undefined;
  if (remainder > 0) {
    const secondaryItem = findBestMatchingItem(remainder);
    if (secondaryItem && secondaryItem.id !== primaryItem.id) {
      const secondaryQuantity = Math.floor(remainder / secondaryItem.priceCNY);
      if (secondaryQuantity > 0) {
        secondary = { item: secondaryItem, quantity: secondaryQuantity };
      }
    }
  }

  return {
    primary: { item: primaryItem, quantity: primaryQuantity },
    secondary,
  };
}

/**
 * 格式化购买力描述
 */
export function formatPurchasingPowerDescription(
  amountCNY: number,
  isProfit: boolean = true
): string {
  const power = calculatePurchasingPower(amountCNY);
  if (!power) return '';

  const { primary, secondary } = power;
  let description = `${primary.quantity} 个 ${primary.item.icon} ${primary.item.name}`;

  if (secondary && secondary.quantity > 0) {
    description += ` + ${secondary.quantity} 个 ${secondary.item.icon} ${secondary.item.name}`;
  }

  return description;
}

