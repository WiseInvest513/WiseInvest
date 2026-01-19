# 推文数据链路整理

## 📊 数据流向图

```
lib/data.ts (数据源)
    ↓
export const tweets: Tweet[]
    ↓
    ├──→ app/tweets/page.tsx (推文列表页面)
    │      ├── 筛选: category, type
    │      ├── 分页: 10/20条每页
    │      └── 显示: 表格形式
    │
    ├──→ app/api/tweets/route.ts (API 接口)
    │      └── GET /api/tweets
    │          └── 返回 JSON: { success, data, count }
    │
    └──→ components/sections/TweetsSection.tsx (首页展示)
            └── 显示: 前9条推文（卡片形式）
```

## 📁 文件结构

### 1. 数据定义 (`lib/data.ts`)
```typescript
export interface Tweet {
  id: number;
  title: string;
  category: string;    // 赛道分类，如 "web3,美股"
  type: string;        // 内容类型，如 "教程,干货"
  date: string;        // 日期: YYYY-MM-DD
  link: string;        // 推文链接
  views: number;       // 浏览量
  author?: string;     // 作者分类（新增，如 "巴菲特", "段永平"）
}

export const tweets: Tweet[] = [...]
```

### 2. 列表页面 (`app/tweets/page.tsx`)
- **功能**: 展示所有推文，支持筛选和分页
- **筛选**: 按分类(category)和类型(type)筛选
- **分页**: 10条/页 或 20条/页
- **数据来源**: `import { tweets } from "@/lib/data"`

### 3. API 接口 (`app/api/tweets/route.ts`)
- **路径**: `GET /api/tweets`
- **用途**: 供外部服务（如知识图谱）获取推文数据
- **返回**: JSON 格式的推文列表

### 4. 首页组件 (`components/sections/TweetsSection.tsx`)
- **功能**: 在首页展示最新9条推文
- **显示**: 卡片形式，包含标题、分类、类型标签

## 🔗 数据访问链路

### 方式 1: 直接导入（客户端组件）
```typescript
import { tweets } from "@/lib/data";
// 使用 tweets 数组
```

### 方式 2: API 调用（服务器端/外部服务）
```typescript
fetch("/api/tweets")
  .then(res => res.json())
  .then(data => {
    const tweets = data.data; // 推文数组
  });
```

### 方式 3: 外部服务访问
```typescript
// 外部服务（如知识图谱）
fetch("http://localhost:3002/api/tweets")
  .then(res => res.json())
  .then(data => {
    // 处理推文数据
  });
```

## 📝 添加新推文

**步骤：**
1. 编辑 `lib/data.ts`
2. 在 `tweets` 数组中添加新对象
3. 确保格式符合 `Tweet` 接口
4. 保存后自动生效（无需重启）

**示例：**
```typescript
{
  id: 38,  // 唯一ID，递增
  title: "推文标题",
  category: "美股,web3",  // 可以多个分类
  type: "干货,教程",      // 可以多个类型
  date: "2025-01-18",     // YYYY-MM-DD
  link: "https://x.com/WiseInvest513/status/...",
  views: 2000,
  author: "巴菲特",  // 可选：作者分类
}
```

## 🔍 筛选机制

### 当前筛选方式
- **分类筛选**: 按 `category` 字段（支持多选）
- **类型筛选**: 按 `type` 字段（支持多选）

### 筛选逻辑
```typescript
// 支持多个分类/类型，用逗号分隔
category: "web3,美股"  // 包含 web3 或 美股 都会匹配
type: "教程,干货"      // 包含 教程 或 干货 都会匹配
```

## 📊 当前数据统计

- **总推文数**: 37 条（持续更新中）
- **分类**: web3, 美股, 定投, 思考, 工具分享, 基金指数, AI
- **类型**: 干货, 教程, 日常, 资讯
- **作者分类**: 巴菲特, 段永平（新增筛选功能）
- **排序**: 按日期倒序（最新的在前）

## ✅ 数据链路已整理

### 数据文件
- **位置**: `lib/data.ts`
- **接口**: `Tweet` 接口（包含 id, title, category, type, date, link, views, author）
- **数据**: `tweets` 数组

### 使用位置

1. **推文列表页面** (`app/tweets/page.tsx`)
   - 显示所有推文
   - 支持分类、类型、作者筛选
   - 支持分页（10/20条每页）

2. **API 接口** (`app/api/tweets/route.ts`)
   - 路径: `GET /api/tweets`
   - 返回: JSON 格式推文数据
   - 用途: 供外部服务调用

3. **首页展示** (`components/sections/TweetsSection.tsx`)
   - 显示最新 9 条推文
   - 卡片形式展示

### 添加新推文流程

1. 编辑 `lib/data.ts`
2. 在 `tweets` 数组中添加新对象
3. 按格式填写字段（id、title、category、type、date、link、views、author）
4. 保存后自动生效（无需重启）

## 🎯 作者分类（新增功能）

为了更好的组织推文，建议添加作者分类：

### 使用场景
- 关于巴菲特的推文 → `author: "巴菲特"`
- 关于段永平的推文 → `author: "段永平"`
- 自己的原创推文 → `author: ""` 或不设置

### 筛选方式
在推文列表页面添加作者筛选按钮，可以：
- 只看"巴菲特"相关的推文
- 只看"段永平"相关的推文
- 查看所有推文（默认）
