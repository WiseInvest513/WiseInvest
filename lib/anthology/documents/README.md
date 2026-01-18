# 文集 Word 文档目录

## 使用说明

将 Word 文档（.docx 格式）放置在此目录中，系统会自动读取并展示。

## 命名规则

文档文件名必须与文章 ID 一致，格式：`{文章ID}.docx`

### 示例

- 文章 ID：`buffett-letter-1980`
- 文件名：`buffett-letter-1980.docx`

## 如何添加新文章

### 步骤 1：准备 Word 文档

1. 创建或编辑 Word 文档（.docx 格式）
2. 将文档保存到本目录
3. 文件名使用文章 ID（例如：`my-article.docx`）

### 步骤 2：在 metadata.ts 中添加元数据

```typescript
export const knowledgeBaseMetadata: Author[] = [
  {
    name: "作者名称",
    categories: [
      {
        name: "分类名称",
        articles: [
          { id: "my-article", title: "文章标题" }, // ID 必须与文件名一致
        ],
      },
    ],
  },
];
```

### 步骤 3：安装依赖（如果还没有）

```bash
npm install mammoth
```

### 步骤 4：重启开发服务器

```bash
npm run dev
```

## 注意事项

1. **文件名必须与文章 ID 完全一致**（不含扩展名）
2. 文档格式为 `.docx`（Word 2007+ 格式）
3. 文档内容会自动转换为 Markdown 格式显示
4. 如果同一文章 ID 在 `data.ts` 中已存在，优先使用 `data.ts` 中的内容

## 格式转换说明

Word 文档中的格式会自动转换：
- **标题** → Markdown 标题（`#`, `##`, `###`）
- **粗体** → `**粗体**`
- **斜体** → `*斜体*`
- **列表** → Markdown 列表

复杂的格式可能会丢失，建议使用简单的文本格式。
