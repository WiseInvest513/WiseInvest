# 价格获取源码位置说明

## 📍 核心文件位置

### 1. **后端 API 路由** - 主要的价格获取入口
**文件**: `app/api/price/route.ts`
- **作用**: Next.js API 路由，处理所有价格请求
- **功能**:
  - 从 CoinPaprika、CoinGecko、Binance、OKX 获取价格
  - 并行请求多个数据源
  - 价格验证和缓存
  - 支持代理（使用原生 Node.js http/https 模块）
- **关键函数**:
  - `fetchFromCoinPaprika()` - 从 CoinPaprika 获取价格
  - `fetchFromCoinGecko()` - 从 CoinGecko 获取价格
  - `fetchFromBinance()` - 从 Binance 获取价格
  - `fetchFromOKX()` - 从 OKX 获取价格
  - `fetchJsonWithTimeout()` - 带超时的网络请求（支持代理）
  - `validatePrices()` - 价格验证逻辑

### 2. **核心价格服务类** - 前端调用的服务
**文件**: `lib/price-service-core.ts`
- **作用**: 封装价格获取逻辑，供前端组件调用
- **功能**:
  - 数字格式化工具
  - 数学表达式解析
  - 缓存机制（30秒短缓存 + 5分钟过期缓存）
  - 价格获取（通过 `/api/price` 路由）
  - 重试机制
- **关键类**: `PriceServiceCore`
  - `getCurrentPrice()` - 获取当前价格
  - `getHistoricalPrice()` - 获取历史价格
  - `getCurrentPriceWithRetry()` - 带重试的获取当前价格
  - `getHistoricalPriceWithRetry()` - 带重试的获取历史价格

### 3. **前端组件使用**

#### 时光财富机组件
**文件**: `components/tools/TimeWealthMachine.tsx`
- **导入**: `import { PriceServiceCore } from "@/lib/price-service-core"`
- **使用位置**: 
  - `handleCalculate()` 函数中调用 `PriceServiceCore.getCurrentPriceWithRetry()`
  - `handleCalculate()` 函数中调用 `PriceServiceCore.getHistoricalPriceWithRetry()`
  - `useEffect` 中调用 `PriceServiceCore.getCurrentPrice()` 用于实时价格更新

#### ROI 计算器组件
**文件**: `components/tools/RoiCalculator.tsx`
- **导入**: `import { PriceServiceCore } from "@/lib/price-service-core"`
- **使用位置**: 
  - 计算函数中调用 `PriceServiceCore.getCurrentPriceWithRetry()`
  - 计算函数中调用 `PriceServiceCore.getHistoricalPriceWithRetry()`

## 🔄 数据流

```
前端组件 (TimeWealthMachine.tsx / RoiCalculator.tsx)
    ↓ 调用
PriceServiceCore (lib/price-service-core.ts)
    ↓ 请求
/api/price (app/api/price/route.ts)
    ↓ 并行请求
CoinPaprika / CoinGecko / Binance / OKX
    ↓ 返回
价格数据 → 缓存 → 前端显示
```

## 📝 关键代码位置

### 获取当前价格
1. **前端调用**: `components/tools/TimeWealthMachine.tsx` 第 431 行
   ```typescript
   currentPriceResult = await PriceServiceCore.getCurrentPriceWithRetry(selectedAsset.symbol);
   ```

2. **服务层**: `lib/price-service-core.ts` 第 449 行
   ```typescript
   static async getCurrentPrice(symbol: string): Promise<PriceResult>
   ```

3. **API 路由**: `app/api/price/route.ts` 第 506 行
   ```typescript
   // 加密货币：CoinPaprika 作为主要数据源，并行获取备用源
   ```

### 获取历史价格
1. **前端调用**: `components/tools/TimeWealthMachine.tsx` 第 460 行
   ```typescript
   historicalPriceData = await PriceServiceCore.getHistoricalPriceWithRetry(selectedAsset.symbol, targetDate);
   ```

2. **服务层**: `lib/price-service-core.ts` 第 568 行
   ```typescript
   static async getHistoricalPrice(symbol: string, date: Date): Promise<HistoricalPriceResult>
   ```

3. **API 路由**: `app/api/price/route.ts` 第 463 行
   ```typescript
   // 获取历史价格
   ```

## 🛠️ 调试工具

### 诊断页面
**文件**: `app/test-data/page.tsx`
- **路由**: `/test-data`
- **作用**: 测试网络连通性和代理配置

### 诊断 API
**文件**: `app/api/debug-price/route.ts`
- **路由**: `/api/debug-price?symbol=BTC`
- **作用**: 测试各数据源的连通性

## 📚 相关文件

- `lib/unified-price-service.ts` - 旧版本的价格服务（已废弃，但可能仍在使用）
- `lib/price-oracle.ts` - 价格预言机（可能已废弃）
- `lib/multi-source-price-oracle.ts` - 多源价格预言机（可能已废弃）

## 🔍 快速查找

要修改价格获取逻辑，主要关注：
1. **数据源配置**: `app/api/price/route.ts` 第 10-60 行（ASSET_CONFIG）
2. **网络请求**: `app/api/price/route.ts` 第 130-200 行（fetchJsonWithTimeout）
3. **价格验证**: `app/api/price/route.ts` 第 350-420 行（validatePrices）
4. **缓存机制**: `app/api/price/route.ts` 第 85-108 行（readCache/writeCache）

