# 日志查看指南

## 📍 日志位置

### 1. 浏览器控制台（前端日志）

**打开方式：**
- **Chrome/Edge**: 按 `F12` 或 `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
- **Firefox**: 按 `F12` 或 `Cmd+Option+K` (Mac) / `Ctrl+Shift+K` (Windows)
- **Safari**: 按 `Cmd+Option+C` (Mac，需先在偏好设置中启用开发者菜单)

**查看步骤：**
1. 打开浏览器开发者工具
2. 点击 **"Console"** 标签
3. 查看以 `[PriceServiceCore]` 或 `[时光财富机]` 开头的日志

**日志示例：**
```
[PriceServiceCore] 开始获取 BTC 价格（最多重试 3 次）
[PriceServiceCore] 尝试 1/3 获取 BTC 价格...
[PriceServiceCore] 请求API: /api/price?symbol=BTC&type=current
[PriceServiceCore] API响应状态: 200 OK (耗时: 1234ms)
[PriceServiceCore] ✅ 成功获取 BTC 价格: $45000
```

### 2. 终端/服务器控制台（后端日志）

**查看位置：**
- 运行 `npm run dev` 的终端窗口

**日志示例：**
```
[API] ========== 开始获取 BTC 价格 ==========
[API] 主要数据源: CoinPaprika (btc-bitcoin)
[API] 备用数据源: CoinGecko, Binance, OKX
[API] 发起并行请求（超时: 8秒）...
[API] CoinPaprika: 开始获取 BTC from https://api.coinpaprika.com/v1/tickers/btc-bitcoin
[API] CoinPaprika: ✅ Success BTC = $45000 (耗时 1234ms)
[API] ✅ BTC 价格验证成功: $45000 (Verified: true)
```

## 🔍 常见日志类型

### 成功日志
- ✅ 标记：表示操作成功
- 包含价格、数据源、耗时等信息

### 警告日志
- ⚠️ 标记：表示降级或使用缓存
- 例如：使用过期缓存数据

### 错误日志
- ❌ 标记：表示操作失败
- 包含错误原因、耗时等信息

## 🐛 调试技巧

### 1. 过滤日志
在浏览器控制台中使用过滤器：
- 输入 `[PriceServiceCore]` 只显示价格服务日志
- 输入 `[API]` 只显示 API 相关日志
- 输入 `error` 只显示错误日志

### 2. 清除日志
- 浏览器控制台：点击清除按钮 🚫 或按 `Cmd+K` (Mac) / `Ctrl+L` (Windows)
- 终端：按 `Cmd+K` (Mac) / `Ctrl+L` (Windows) 或输入 `clear`

### 3. 保存日志
- 浏览器：右键点击日志 → "Save as..."
- 终端：使用 `npm run dev > logs.txt 2>&1` 保存到文件

## 📊 日志级别

- **INFO**: 正常操作信息（白色）
- **WARN**: 警告信息（黄色）
- **ERROR**: 错误信息（红色）

## 🔧 启用详细日志

如果需要更详细的日志，可以在代码中设置：

```typescript
// 在浏览器控制台
localStorage.setItem('debug', 'true');

// 在服务器端
// 日志已默认启用，无需额外配置
```

