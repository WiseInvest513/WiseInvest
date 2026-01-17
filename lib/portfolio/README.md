# Portfolio Tracker Architecture

## 架构概览

投资组合追踪器采用**分层架构**和**策略模式**，遵循 SOLID 原则，确保代码的可维护性和可扩展性。

## 目录结构

```
lib/portfolio/
├── types.ts              # 类型定义
├── store.ts              # 状态管理（React Context + localStorage）
├── hooks.ts              # 业务逻辑层（Custom Hooks）
├── components/           # UI 组件层
│   ├── AssetCommandCenter.tsx
│   ├── AddAssetModal.tsx
│   ├── AllocationChart.tsx
│   ├── HoldingsList.tsx
│   └── AssetGrowthChart.tsx
└── README.md             # 本文档
```

## 架构层次

### 1. 数据层 (Data Layer)

**位置**: `lib/asset-service.ts` + `app/api/price/route.ts`

- **GlobalAssetService**: 统一资产服务门面
- **AssetProvider**: 策略模式抽象基类
- **CryptoProvider / StockProvider / IndexProvider**: 具体实现
- **后端 API**: 混合 Mock/Real 数据策略

**特性**:
- 网络失败时自动降级到 Mock 数据
- 30秒缓存机制
- 8秒超时保护

### 2. 逻辑层 (Logic Layer)

**位置**: `lib/portfolio/hooks.ts`

- `useAssetPrices()`: 并行获取所有资产价格
- `usePortfolioStats()`: 计算投资组合统计数据
- `useChartData()`: 生成图表数据

**特性**:
- 自动每30秒更新价格
- 使用 `useMemo` 优化计算性能
- 错误处理和加载状态管理

### 3. 状态层 (State Layer)

**位置**: `lib/portfolio/store.tsx`

- **PortfolioProvider**: React Context Provider
- **usePortfolioStore**: 状态管理 Hook
- **localStorage**: 自动持久化

**API**:
```typescript
{
  assets: Asset[];
  addAsset: (asset: Asset) => void;
  removeAsset: (id: string) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  clearPortfolio: () => void;
}
```

### 4. 视图层 (View Layer)

**位置**: `lib/portfolio/components/` + `app/tools/portfolio-tracker/page.tsx`

#### 组件列表

1. **AssetCommandCenter**: 顶部命令中心
   - 资产总额显示
   - 24h 盈亏统计
   - 添加资产按钮

2. **AddAssetModal**: 添加资产模态框
   - 资产类型选择（Crypto/Stock/Index）
   - 防抖搜索（300ms）
   - 表单验证和自动填充

3. **AssetGrowthChart**: 资产增长图表
   - Recharts AreaChart
   - 30天历史数据模拟
   - 渐变填充效果

4. **AllocationChart**: 资产分配环形图
   - Recharts PieChart
   - 动态颜色分配
   - 百分比显示

5. **HoldingsList**: 持仓详情列表
   - 实时价格更新
   - 浮动盈亏计算
   - 实践链接支持

## 设计模式

### 1. 策略模式 (Strategy Pattern)

**AssetProvider** 抽象基类定义了统一的接口：
```typescript
abstract class AssetProvider {
  abstract getPrice(symbol: string): Promise<PriceResult | null>;
  abstract search(query: string): Promise<SearchResult[]>;
  abstract getHistorical(symbol: string, date: Date): Promise<HistoricalPriceResult | null>;
}
```

### 2. 门面模式 (Facade Pattern)

**GlobalAssetService** 提供统一的接口，隐藏底层复杂性：
```typescript
class GlobalAssetService {
  getPrice(symbol: string, type: AssetType): Promise<PriceResult | null>
  searchAssets(query: string, type: AssetType): Promise<SearchResult[]>
  getBatchPrices(symbols: string[], type: AssetType): Promise<Map<string, PriceResult>>
}
```

### 3. 观察者模式 (Observer Pattern)

React Context + Hooks 实现响应式状态管理。

## 数据流

```
用户操作
  ↓
UI 组件 (View Layer)
  ↓
Custom Hooks (Logic Layer)
  ↓
Context Store (State Layer)
  ↓
GlobalAssetService (Data Layer)
  ↓
Backend API (app/api/price/route.ts)
  ↓
External APIs (CoinPaprika, Yahoo Finance, etc.)
```

## 错误处理策略

### 网络失败降级

1. **实时价格获取失败** → 返回 Mock 数据
2. **搜索失败** → 返回 Mock 搜索结果
3. **超时（8秒）** → 自动切换到 Mock 数据

### Mock 数据特性

- 基于真实市场价格的 ±2% 随机波动
- 24h 变化模拟
- 标记 `_isMock: true` 用于调试

## 性能优化

1. **并行获取**: 使用 `Promise.all` 同时获取所有资产价格
2. **缓存机制**: 30秒内存缓存，减少 API 调用
3. **Memoization**: 使用 `useMemo` 优化计算密集型操作
4. **防抖搜索**: 300ms 防抖，减少搜索请求

## 可扩展性

### 未来功能支持

1. **多钱包同步**: 扩展 `Asset` 类型添加 `walletId`
2. **付费 Pro 图表**: 在 `AssetGrowthChart` 中添加高级功能开关
3. **交易历史**: 扩展 `Asset` 类型添加 `transactions[]`
4. **资产分组**: 添加 `category` 字段支持分类管理

## 使用示例

```typescript
// 在组件中使用
function MyComponent() {
  const { assets, addAsset } = usePortfolioStore();
  const { prices, isLoading } = useAssetPrices();
  const stats = usePortfolioStats();
  
  // 添加资产
  const handleAdd = () => {
    addAsset({
      id: 'btc-123',
      symbol: 'BTC',
      name: 'Bitcoin',
      type: 'crypto',
      amount: 0.5,
      avgPrice: 45000,
    });
  };
  
  return <div>...</div>;
}
```

## 测试建议

1. **单元测试**: 测试 Hooks 的计算逻辑
2. **集成测试**: 测试组件间的数据流
3. **E2E 测试**: 测试完整的用户流程
4. **Mock 测试**: 验证降级策略的正确性

