# 定时数据获取服务使用说明

## 概述

`ScheduledDataService` 是一个定时数据获取服务，用于在服务器端定时获取股票、指数、加密和国内指数的历史价格数据，并缓存到客户端 localStorage。

## 功能特性

1. **定时任务**：
   - 股票数据：每天凌晨 3:00 执行
   - 指数数据：每天凌晨 3:30 执行
   - 加密数据：每天凌晨 4:00 执行
   - 国内指数数据：每天凌晨 4:30 执行

2. **数据获取**：
   - 获取过去 3 个月、6 个月、1 年、3 年、5 年的历史价格
   - 自动处理周末，调整到周五
   - 每个请求间隔 5 秒，数据返回后才继续下一个

3. **缓存管理**：
   - 数据保存到客户端 localStorage
   - 缓存键名：
     - `stock_yields_cached_data` - 股票数据
     - `index_yields_cached_data` - 指数数据
     - `crypto_yields_cached_data` - 加密数据
     - `domestic_yields_cached_data` - 国内指数数据

## 使用方法

### 1. 启动定时器

在服务器启动时（如 `app/layout.tsx` 或单独的初始化脚本），调用：

```typescript
import { ScheduledDataService } from '@/lib/services/ScheduledDataService';

// 启动所有定时器
ScheduledDataService.startAllTimers();
```

### 2. 通过 API 管理定时器

#### 启动所有定时器
```bash
POST /api/scheduled-data
{
  "action": "start"
}
```

#### 停止所有定时器
```bash
POST /api/scheduled-data
{
  "action": "stop"
}
```

#### 手动触发任务
```bash
POST /api/scheduled-data
{
  "action": "trigger",
  "task": "stock"  // 可选: "stock" | "index" | "crypto" | "domestic"
}
```

#### 获取定时器状态
```bash
GET /api/scheduled-data
```

### 3. 在客户端页面使用缓存数据

定时器获取的数据会自动保存到 localStorage，前端页面可以直接读取：

```typescript
// 读取股票数据
const stockData = localStorage.getItem('stock_yields_cached_data');
if (stockData) {
  const data = JSON.parse(stockData);
  // 使用数据
}

// 读取指数数据
const indexData = localStorage.getItem('index_yields_cached_data');
// ...
```

## 数据格式

缓存的数据格式为 `AssetYieldData[]`：

```typescript
interface AssetYieldData {
  symbol: string;      // 资产代码，如 'AAPL', 'BTC'
  name: string;        // 资产名称
  price: number;       // 当前价格
  changes: {
    m3: number;        // 3个月收益率
    m6: number;        // 6个月收益率
    y1: number;        // 1年收益率
    y3: number;        // 3年收益率
    y5: number;        // 5年收益率
  };
}
```

## 注意事项

1. **服务器端运行**：定时器只在服务器端运行，不会在客户端执行
2. **数据缓存**：数据保存到客户端 localStorage，需要客户端页面访问才能写入
3. **周末处理**：自动将周末日期调整到周五，确保获取到交易日数据
4. **请求间隔**：每个请求间隔 5 秒，数据返回后才继续下一个，避免 API 限流
5. **错误处理**：如果某个资产获取失败，会跳过继续下一个，不会中断整个任务

## 部署建议

1. **生产环境**：在服务器启动时自动启动定时器
2. **开发环境**：可以通过 API 手动触发任务进行测试
3. **监控**：建议添加日志监控，确保定时任务正常执行

## 未来改进

1. **服务器端持久化**：可以将数据保存到文件系统或数据库
2. **数据同步**：通过 API 将服务器端数据同步到客户端
3. **错误重试**：添加失败重试机制
4. **数据验证**：添加数据完整性验证
