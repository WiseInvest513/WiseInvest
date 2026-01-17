# 加密货币收益率计算脚本使用说明

## 方法一：通过 API Route（推荐）

1. 确保开发服务器正在运行：
   ```bash
   npm run dev
   ```

2. 在浏览器中访问或使用 curl：
   ```
   http://localhost:3002/api/crypto-yields/calculate
   ```

3. API 会返回计算结果，包括：
   - `data`: 计算结果数组
   - `codeOutput`: 可以直接复制到 `lib/mock/god-mode-data.ts` 的代码

4. 将返回的 `codeOutput` 内容复制并替换 `lib/mock/god-mode-data.ts` 中的 `CRYPTO_YIELDS` 数组

## 方法二：使用 TypeScript 脚本（需要 tsx）

如果安装了 `tsx`：
```bash
npm install -D tsx
npx tsx scripts/calculate-crypto-yields.ts
```

## 定期更新

建议每周运行一次，更新数据：
- 可以通过 cron job 调用 API
- 或者手动访问 API 并更新数据文件

## 注意事项

- 脚本会使用 `CachedPriceService`，自动利用缓存层
- 每个资产之间有延迟，避免 API 限流
- 如果某个时间框架的数据无法获取，会设置为 0
