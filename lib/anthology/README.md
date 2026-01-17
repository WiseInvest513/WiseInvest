# 文集数据管理

## 目录结构

```
lib/anthology/
├── types.ts          # TypeScript 类型定义
├── metadata.ts        # 文章元数据（轻量级，包含 id 和 title）
├── data.ts           # 文章完整内容（重量级，包含 content）
├── index.ts           # 懒加载 API 入口
└── README.md          # 本文档
```

## 设计理念

### 性能优化

为了支持上百篇文章而不影响首屏加载速度，我们采用了**数据分离 + 懒加载**的策略：

1. **元数据（metadata.ts）**：只包含文章的 `id` 和 `title`，用于：
   - 显示文章列表
   - 搜索功能（只搜索标题）
   - 导航功能
   - **特点**：轻量级，立即加载

2. **完整内容（data.ts）**：包含文章的完整 `content`，用于：
   - 显示文章详情
   - **特点**：重量级，按需懒加载（代码分割）

### 工作流程

1. 用户访问文集页面 → 立即加载 `metadata.ts`（轻量）
2. 用户点击文章 → 动态导入 `data.ts`（懒加载）
3. 文章内容被缓存 → 再次访问同一文章时无需重新加载

## 如何添加新文章

### 步骤 1：在 `metadata.ts` 中添加元数据

```typescript
export const knowledgeBaseMetadata: Author[] = [
  {
    name: "作者名称",
    categories: [
      {
        name: "分类名称",
        articles: [
          { id: "article-id", title: "文章标题" },
          // 添加新文章元数据
        ],
      },
    ],
  },
];
```

### 步骤 2：在 `data.ts` 中添加完整内容

```typescript
export const articleContentMap: Map<string, Article> = new Map([
  [
    "article-id",  // 必须与 metadata.ts 中的 id 一致
    {
      id: "article-id",
      title: "文章标题",
      content: `文章内容（支持 Markdown）...`,
    },
  ],
  // 添加新文章内容
]);
```

### 注意事项

- **ID 必须一致**：`metadata.ts` 中的 `id` 必须与 `data.ts` 中的 `id` 完全一致
- **标题必须一致**：建议保持一致，但技术上可以不同（不推荐）
- **内容格式**：支持 Markdown 语法（`**粗体**`、`## 标题`、`> 引用` 等）

## API 使用

### 获取文集元数据（同步）

```typescript
import { getKnowledgeBaseMetadata } from "@/lib/anthology";

const metadata = getKnowledgeBaseMetadata(); // 立即返回，轻量级
```

### 获取文章完整内容（异步，懒加载）

```typescript
import { getArticleById } from "@/lib/anthology";

const article = await getArticleById("article-id"); // 异步加载，代码分割
```

### 获取所有文章元数据（用于导航）

```typescript
import { getAllArticleMetadata } from "@/lib/anthology";

const allArticles = getAllArticleMetadata(); // 立即返回，轻量级
```

## 性能优势

### 优化前（所有数据一起加载）
- Bundle 大小：~500KB（假设 100 篇文章）
- 首屏加载：慢
- 内存占用：高

### 优化后（懒加载）
- 初始 Bundle：~10KB（只有元数据）
- 首屏加载：快 ⚡
- 按需加载：用户点击时才加载文章内容
- 内存占用：低（只加载当前文章）

## 未来扩展

如果文章数量继续增长（> 200 篇），可以考虑：

1. **按作者/分类拆分**：将 `data.ts` 拆分为多个文件（`duan-yongping.ts`、`buffett.ts` 等）
2. **服务端渲染（SSR）**：将文集页面改为 SSR，进一步优化首屏性能
3. **数据库存储**：如果文章数量非常大，可以考虑使用数据库 + API

## 示例

完整示例请参考 `metadata.ts` 和 `data.ts` 中的现有文章。

