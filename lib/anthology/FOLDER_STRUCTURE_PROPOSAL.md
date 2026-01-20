# 文集文件夹结构方案

## 📁 建议的文件夹结构

### 方案一：按作者和分类组织（推荐）

```
lib/anthology/documents/
├── buffett/
│   ├── letters/              # 致股东信
│   │   ├── 1980.docx
│   │   └── 2024.docx
│   └── meetings/             # 股东大会
│       ├── 1957-1967股东大会.docx
│       ├── 1968-1978 股东大会.docx
│       ├── 1979-1989 股东大会.docx
│       ├── 1990-2000 股东大会.docx
│       ├── 2001-2010 股东大会.docx
│       ├── 2011-2021 股东大会.docx
│       └── 2022-2025股东大会.docx
└── duan/
    ├── business/              # 商业逻辑
    │   ├── duan-business-1.docx
    │   └── duan-business-2.docx
    └── investment/            # 投资语录
        ├── duan-invest-1.docx
        └── duan-invest-2.docx
```

### 方案二：扁平化结构（当前方案，简单但不够清晰）

```
lib/anthology/documents/
├── 1957-1967股东大会.docx
├── buffett-letter-1980.docx
├── duan-business-1.docx
└── ...
```

## 🎯 推荐使用方案一的原因

1. **清晰的组织结构**：按作者和分类组织，易于管理
2. **易于扩展**：添加新作者或新分类时，只需创建新文件夹
3. **避免文件名冲突**：不同作者可以有相同的文件名
4. **便于维护**：相关文档集中在一起

## 📝 实现方案

### 方式1：在元数据中指定路径（推荐）

在 `metadata.ts` 中添加 `path` 字段：

```typescript
{
  id: "buffett-letter-1980",
  title: "1980年致股东信",
  path: "buffett/letters/1980.docx"  // 相对路径
}
```

### 方式2：根据ID自动推断路径（更智能）

根据ID格式自动推断：
- `buffett-letter-1980` → `buffett/letters/1980.docx`
- `1957-1967股东大会` → `buffett/meetings/1957-1967股东大会.docx`

## 🔄 迁移计划

1. 创建新的文件夹结构
2. 移动现有文件到对应文件夹
3. 更新 `word-loader.ts` 支持子文件夹
4. 更新 `metadata.ts` 添加路径信息（或使用自动推断）
5. 测试所有文档都能正常加载
