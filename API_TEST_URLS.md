# 价格 API 测试 URL

以下是可以直接在浏览器中访问的公开 API 接口，用于测试获取 BTC 价格：

## 1. CoinGecko（最推荐 - 最简单、最稳定）

**BTC 价格：**
```
https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd
```

**ETH 价格：**
```
https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd
```

**BNB 价格：**
```
https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd
```

**SOL 价格：**
```
https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd
```

**OKB 价格：**
```
https://api.coingecko.com/api/v3/simple/price?ids=okb&vs_currencies=usd
```

**响应格式：**
```json
{
  "bitcoin": {
    "usd": 95000
  }
}
```

---

## 2. Binance（币安 - 公开接口）

**BTC 价格：**
```
https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT
```

**ETH 价格：**
```
https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT
```

**响应格式：**
```json
{
  "symbol": "BTCUSDT",
  "price": "95000.00"
}
```

---

## 3. OKX（欧易 - 公开接口）

**BTC 价格：**
```
https://www.okx.com/api/v5/market/ticker?instId=BTC-USDT
```

**ETH 价格：**
```
https://www.okx.com/api/v5/market/ticker?instId=ETH-USDT
```

**响应格式：**
```json
{
  "code": "0",
  "data": [
    {
      "instId": "BTC-USDT",
      "last": "95000.00"
    }
  ]
}
```

---

## 4. Bitget（公开接口）

**BTC 价格（v1 版本 - 更简单）：**
```
https://api.bitget.com/api/v1/market/ticker?symbol=BTCUSDT
```

**BTC 价格（v2 版本）：**
```
https://api.bitget.com/api/v2/market/ticker?symbol=BTCUSDT
```

**响应格式（v1）：**
```json
{
  "code": "00000",
  "data": {
    "last": "95000.00"
  }
}
```

---

## 测试建议

1. **优先测试 CoinGecko**：最简单、最稳定，无需认证
2. 如果 CoinGecko 可以访问，说明网络没问题，代码应该也能工作
3. 如果 CoinGecko 无法访问，可能是网络限制，需要检查网络设置

直接在浏览器地址栏输入这些 URL，应该能看到 JSON 格式的价格数据。

