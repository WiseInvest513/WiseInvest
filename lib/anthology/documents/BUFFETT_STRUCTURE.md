# 巴菲特文集文件夹结构

## 📁 文件夹结构

```
lib/anthology/documents/
└── buffett/
    ├── meetings/          # 1、股东大会
    │   ├── 1957-1967股东大会.docx
    │   ├── 1968-1978 股东大会.docx
    │   ├── 1979-1989 股东大会.docx
    │   ├── 1990-2000 股东大会.docx
    │   ├── 2001-2010 股东大会.docx
    │   ├── 2011-2021 股东大会.docx
    │   └── 2022-2025股东大会.docx
    ├── speeches/          # 2、演讲合集
    │   └── (待添加演讲文档)
    └── quotes/            # 3、名言合集
        └── (待添加名言文档)
```

## 📝 添加新文档

### 添加演讲文档

1. 将文件放到 `buffett/speeches/` 目录
2. 在 `metadata.ts` 中添加：

```typescript
{
  name: "2、演讲合集",
  articles: [
    { id: "buffett-speech-2024", title: "2024年演讲" },
    // 更多演讲...
  ],
}
```

**文件命名规则：**
- ID格式：`buffett-speech-{标识}`
- 文件路径：`buffett/speeches/{标识}.docx`
- 示例：ID `buffett-speech-2024` → 文件 `buffett/speeches/2024.docx`

### 添加名言文档

1. 将文件放到 `buffett/quotes/` 目录
2. 在 `metadata.ts` 中添加：

```typescript
{
  name: "3、名言合集",
  articles: [
    { id: "buffett-quote-wisdom", title: "投资智慧" },
    // 更多名言...
  ],
}
```

**文件命名规则：**
- ID格式：`buffett-quote-{标识}`
- 文件路径：`buffett/quotes/{标识}.docx`
- 示例：ID `buffett-quote-wisdom` → 文件 `buffett/quotes/wisdom.docx`

## ✅ 当前状态

- ✅ 股东大会：7个文档已配置
- ⏳ 演讲合集：待添加文档
- ⏳ 名言合集：待添加文档
