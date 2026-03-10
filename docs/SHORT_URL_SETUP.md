# 短链功能配置指南

## 功能说明

- **管理页面**：`https://www.wise-invest.org/url513`（秘密地址，仅你知道）
- **短链格式**：`https://www.wise-invest.org/s/{短ID}`
- **存储**：Upstash Redis（原 Vercel KV 已迁移至此）

## 配置步骤

### 1. 在 Vercel 添加 Upstash Redis

1. 打开 [Vercel Dashboard](https://vercel.com/dashboard) → 选择你的项目
2. 进入 **Storage** 或 **Integrations**
3. 点击 **Create Database** 或 **Add Integration**
4. 选择 **Upstash** → **Upstash Redis**
5. 创建后，点击 **Connect to Project** 关联到 Wise Invest 项目
6. Vercel 会自动注入环境变量：`KV_REST_API_URL`、`KV_REST_API_TOKEN`

### 2. 本地开发（可选）

如需本地测试短链功能：

1. 在 Vercel 项目设置中复制 Redis 相关环境变量
2. 粘贴到 `.env.local` 中
3. 或使用 `vercel env pull` 拉取环境变量

### 3. 重新部署

配置完成后，在 Vercel 触发一次重新部署，使环境变量生效。

## 使用流程

1. 访问 `https://www.wise-invest.org/url513`
2. 输入完整链接（如小红书、推特等）
3. 点击「生成短链」
4. 复制生成的短链，例如：`https://www.wise-invest.org/s/a1b2c3d4`
5. 任何人访问该短链都会自动跳转到原始链接

## 技术说明

- 短 ID 为 8 位数字+小写字母，碰撞概率极低
- 使用 302 临时重定向，方便以后修改目标
- 管理页面已设置 `noindex`，避免被搜索引擎收录
