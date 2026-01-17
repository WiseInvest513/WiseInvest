# 知识图谱外部链接配置

知识图谱功能已改为使用外部链接。点击"知识图谱"按钮将跳转到外部网址。

## 配置方法

### 方法 1: 环境变量（推荐）

在项目根目录创建 `.env.local` 文件（如果不存在），添加：

```bash
NEXT_PUBLIC_KNOWLEDGE_GRAPH_URL=https://your-knowledge-graph-url.com
```

### 方法 2: 直接修改代码

编辑 `app/tweets/page.tsx` 文件，找到第 22 行：

```typescript
const knowledgeGraphUrl = process.env.NEXT_PUBLIC_KNOWLEDGE_GRAPH_URL || "#";
```

将其改为：

```typescript
const knowledgeGraphUrl = "https://your-knowledge-graph-url.com";
```

## 已删除的文件

以下知识图谱相关文件已被删除：

- `components/tweets/KnowledgeGraphViewer.tsx` - 知识图谱查看器组件
- `lib/knowledge-graph-generator.ts` - 知识图谱生成器
- `lib/knowledge-graph-example.ts` - 示例文件
- `lib/knowledge-graph-output.json` - 输出JSON文件

## 功能说明

- "知识图谱"按钮现在是一个外部链接
- 点击按钮会在新标签页打开外部网址
- 如果未配置链接，按钮将指向 `#`（不会跳转）
