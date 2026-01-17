# Portfolio Tracker Architecture

## 架构原则
- SOLID 原则：单一职责、开闭原则
- 分层架构：Data Layer → Logic Layer → View Layer
- 策略模式：统一资产接口，支持多种资产类型
- 可扩展性：支持未来付费功能和多钱包同步

## 数据层 (Data Layer)

### Interfaces
```typescript
interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'index';
  amount: number;
  avgPrice: number;
  practiceLink?: string;
  addedAt: number;
}

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  change24hPercent: number;
  timestamp: number;
}

interface PortfolioStats {
  totalValue: number;
  totalCost: number;
  profit: number;
  profitPercent: number;
  change24h: number;
  change24hPercent: number;
}
```

## 逻辑层 (Logic Layer)

### Hooks
- `usePortfolio()` - 投资组合状态管理
- `useAssetPrices()` - 价格数据获取
- `usePortfolioStats()` - 统计数据计算

## 视图层 (View Layer)

### Components
- `PortfolioDashboard` - 主仪表板
- `AssetCommandCenter` - 顶部命令中心
- `AddAssetModal` - 添加资产模态框
- `HoldingsList` - 持仓列表
- `AllocationChart` - 资产分配图表

