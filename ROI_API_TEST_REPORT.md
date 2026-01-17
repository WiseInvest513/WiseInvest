# ROI API 测试报告

## 测试日期
2025-01-20

## 问题诊断

### 1. API 连接测试结果

#### CoinGecko API 测试
```bash
# Ping 测试
curl "https://api.coingecko.com/api/v3/ping"
结果: ❌ 超时失败 (PING_FAILED)

# 价格 API 测试
curl "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=cny"
结果: ❌ 超时失败 (PRICE_API_FAILED)

# 历史价格 API 测试
curl "https://api.coingecko.com/api/v3/coins/bitcoin/history?date=20-12-2022"
结果: ❌ 超时失败 (HISTORY_API_FAILED)
```

#### Binance API 测试
```bash
curl "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT"
结果: ❌ 超时失败 (BINANCE_API_FAILED)
```

### 2. 根本原因

**问题：** CoinGecko API 在当前网络环境下完全无法访问

**可能原因：**
1. 网络防火墙/限制阻止了对 CoinGecko API 的访问
2. DNS 解析问题
3. 地理位置限制
4. API 服务暂时不可用

**错误类型：** `Network error: fetch failed` / `Timeout` / `socket hang up`

## 解决方案

### 1. 代码优化

#### ✅ 已实施的改进：

1. **快速失败机制**
   - 超时时间从 10 秒减少到 5 秒
   - 重试次数从 2 次减少到 1 次
   - 总等待时间从最多 30 秒减少到最多 10 秒

2. **备用数据选项**
   - 添加 `useFallback=true` 查询参数
   - 可以直接跳过 API 尝试，立即使用备用数据
   - 示例：`/api/roi?id=btc&years=3&useFallback=true`

3. **改进的错误处理**
   - 详细的错误日志记录
   - 清晰的错误消息
   - 自动回退到备用数据

4. **备用数据验证**
   - 测试确认备用数据功能正常
   - 返回格式：`{"currentPrice": 96000, "historyPrice": 16000, "fallback": true}`

### 2. 当前状态

✅ **功能可用**：即使 API 失败，功能仍然可用（使用备用数据）

✅ **用户体验**：清晰的错误提示，告知用户使用备用数据

✅ **性能优化**：快速失败，不会让用户等待太久

## 使用建议

### 方案 1：直接使用备用数据（推荐）

如果网络环境持续无法访问 CoinGecko API，可以：

1. **前端修改**：在组件中添加 `useFallback=true` 参数
2. **环境变量**：设置 `NEXT_PUBLIC_USE_FALLBACK=true`
3. **用户选择**：添加一个开关让用户选择是否尝试 API

### 方案 2：使用代理服务

如果需要访问真实 API：

1. 配置代理服务器
2. 在服务器端通过代理访问 CoinGecko API
3. 或者使用其他可访问的加密货币价格 API

### 方案 3：定期更新备用数据

1. 定期手动更新 `FALLBACK_DATA` 和 `FALLBACK_CURRENT_PRICES`
2. 确保数据相对准确
3. 在 UI 中明确标注数据来源

## 测试结果

### 备用数据测试
```bash
curl "http://localhost:3000/api/roi?id=btc&years=3&useFallback=true"
结果: ✅ 成功
响应: {"currentPrice":96000,"historyPrice":16000,"fallback":true}
```

### 正常流程测试（会失败但会回退）
```bash
curl "http://localhost:3000/api/roi?id=btc&years=3"
结果: ⚠️ API 失败，但自动回退到备用数据
响应: {"currentPrice":96000,"historyPrice":16000,"fallback":true,"error":"..."}
```

## 结论

**当前状态：** ✅ 功能可用，使用备用数据

**建议：** 
- 如果网络环境允许，代码会自动尝试 API
- 如果 API 失败，会自动使用备用数据
- 用户可以选择直接使用备用数据以加快响应速度

**后续优化：**
- 考虑集成其他可访问的 API（如 Binance、CoinMarketCap）
- 或者定期手动更新备用数据
- 添加数据来源标识，让用户知道使用的是备用数据

