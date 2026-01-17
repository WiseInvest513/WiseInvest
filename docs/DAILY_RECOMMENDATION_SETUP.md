# 每日推荐弹窗配置指南

## 概述

每日推荐弹窗组件 (`DailyRecommendation`) 是一个配置驱动的弹窗组件，用于向用户展示精选内容。内容通过 Vercel 环境变量管理，无需修改代码即可更新。

## 环境变量配置

### 变量名
```
NEXT_PUBLIC_RECOMMENDATIONS_JSON
```

### 数据格式

环境变量应该是一个 JSON 字符串，包含一个对象数组。每个对象代表一个推荐项：

```json
[
  {
    "type": "welfare",
    "title": "长期福利活动",
    "desc": "参与即可获得丰厚奖励，长期有效",
    "link": "https://example.com/welfare",
    "tag": "长期福利"
  },
  {
    "type": "article",
    "title": "深度好文：投资策略解析",
    "desc": "深入分析当前市场趋势，提供专业投资建议",
    "link": "https://example.com/article",
    "tag": "深度好文"
  },
  {
    "type": "wool",
    "title": "限时羊毛活动",
    "desc": "限时24小时，错过不再有",
    "link": "https://example.com/wool",
    "tag": "限时羊毛"
  }
]
```

### 字段说明

- **type** (必需): 推荐类型
  - `"welfare"`: 福利类型（金色主题）
  - `"article"`: 文章类型（蓝色主题）
  - `"wool"`: 羊毛类型（绿色主题）

- **title** (必需): 推荐标题，显示在卡片顶部

- **desc** (必需): 推荐描述，显示在标题下方

- **link** (必需): 点击卡片时打开的链接（新标签页）

- **tag** (必需): 标签文本，显示在卡片右上角

### 限制

- 最多显示 3 个推荐项
- 如果数组中有无效项，会被自动过滤
- 如果环境变量未设置或解析失败，弹窗不会显示（静默失败）

## 显示逻辑

### 默认规则（3小时）

- 用户首次访问或距离上次显示超过 3 小时，弹窗会自动显示
- 显示后，记录当前时间到 localStorage

### 24小时不再提醒

- 如果用户勾选"24小时不再提醒"并关闭弹窗，弹窗将在 24 小时内不再显示
- 24 小时后，恢复默认的 3 小时规则

### LocalStorage 键名

```
wise_invest_recommendation_log
```

存储的数据结构：
```json
{
  "lastShownTime": 1234567890123,
  "suppress24h": false
}
```

## Vercel 配置步骤

1. 登录 Vercel 控制台
2. 选择你的项目
3. 进入 **Settings** > **Environment Variables**
4. 添加新变量：
   - **Name**: `NEXT_PUBLIC_RECOMMENDATIONS_JSON`
   - **Value**: 你的 JSON 字符串（见上方格式）
   - **Environment**: 选择 `Production`, `Preview`, `Development`（根据需要）
5. 保存后，重新部署项目

## 示例配置

### 完整示例（3个推荐项）

```bash
NEXT_PUBLIC_RECOMMENDATIONS_JSON='[{"type":"welfare","title":"欧易交易所长期福利","desc":"注册即送100 USDT，交易手续费返佣20%","link":"https://www.okx.com/join/123456","tag":"长期福利"},{"type":"article","title":"2025年投资策略深度解析","desc":"分析当前市场趋势，提供专业投资建议和风险评估","link":"https://example.com/article/2025-strategy","tag":"深度好文"},{"type":"wool","title":"Bitget限时空投活动","desc":"限时24小时，完成简单任务即可获得50 USDT空投","link":"https://www.bitget.com/promotion/airdrop","tag":"限时羊毛"}]'
```

### 单个推荐项示例

```bash
NEXT_PUBLIC_RECOMMENDATIONS_JSON='[{"type":"welfare","title":"测试标题","desc":"测试描述","link":"https://example.com","tag":"测试标签"}]'
```

## 测试

### 本地测试

1. 在 `.env.local` 文件中添加环境变量：
   ```
   NEXT_PUBLIC_RECOMMENDATIONS_JSON='[...]'
   ```

2. 清除 localStorage（在浏览器控制台）：
   ```javascript
   localStorage.removeItem('wise_invest_recommendation_log');
   ```

3. 刷新页面，弹窗应该会显示

### 测试不同时间间隔

- **立即显示**: 删除 localStorage 中的 `wise_invest_recommendation_log`
- **3小时后显示**: 设置 `lastShownTime` 为 3 小时前的时间戳
- **24小时后显示**: 设置 `suppress24h: true` 且 `lastShownTime` 为 24 小时前

## 故障排除

### 弹窗不显示

1. **检查环境变量**: 确认 `NEXT_PUBLIC_RECOMMENDATIONS_JSON` 已正确设置
2. **检查 JSON 格式**: 确保 JSON 字符串格式正确，可以使用在线 JSON 验证工具
3. **检查数据有效性**: 确保至少有一个有效的推荐项（type、title、desc、link、tag 都存在）
4. **检查时间逻辑**: 确认距离上次显示已超过 3 小时（或 24 小时，如果设置了不再提醒）

### 控制台警告

组件会在控制台输出警告信息，帮助调试：
- `[DailyRecommendation] Failed to parse recommendations`: JSON 解析失败
- `[DailyRecommendation] Failed to read log`: localStorage 读取失败
- `[DailyRecommendation] Failed to save log`: localStorage 保存失败

## UI 主题

- **welfare (福利)**: 金色/琥珀色主题 (`bg-amber-50`, `text-amber-700`)
- **article (好文)**: 靛蓝色主题 (`bg-indigo-50`, `text-indigo-700`)
- **wool (羊毛)**: 翠绿色主题 (`bg-emerald-50`, `text-emerald-700`)

每个卡片都有悬停效果（轻微放大和阴影增强），提升交互体验。
