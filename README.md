# InvestWise - 个人投资工具与内容平台

一个专注于纳斯达克/S&P 投资、美股和加密货币策略的静态网站，采用大气极简设计风格。

## 技术栈

- **框架**: Next.js 14+ (App Router, TypeScript)
- **样式**: Tailwind CSS
- **UI 组件库**: shadcn/ui
- **图标**: Lucide React
- **内容管理**: Contentlayer (MDX)
- **部署**: Vercel (静态站点生成)

## 开始使用

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看网站。

### 构建生产版本

```bash
npm run build
```

## 项目结构

```
MyBlog/
├── app/                    # Next.js App Router 页面
│   ├── page.tsx           # 首页
│   ├── blog/              # 博客相关页面
│   ├── tools/             # 工具导航页
│   ├── collections/       # 合集教程
│   └── about/             # 关于页面
├── components/            # React 组件
│   ├── ui/               # shadcn/ui 组件
│   ├── SiteHeader.tsx    # 顶部导航
│   ├── Sidebar.tsx       # 左侧边栏
│   ├── ToolCard.tsx      # 工具卡片
│   └── PostCard.tsx      # 文章卡片
├── content/              # MDX 博客文章
│   └── posts/
├── config/               # 配置文件
│   └── site.ts          # 站点配置
├── data/                # 静态数据
│   └── tools.ts         # 工具数据
└── lib/                 # 工具函数
    └── utils.ts
```

## 添加博客文章

在 `content/posts/` 目录下创建 `.mdx` 文件，使用以下 frontmatter 格式：

```mdx
---
title: 文章标题
date: 2024-01-15
desc: 文章描述
slug: article-slug
tags: [标签1, 标签2]
---

# 文章内容

使用 Markdown 语法编写内容...
```

## 添加工具

编辑 `data/tools.ts` 文件，添加新的工具分类和项目。

## 设计系统

- **背景色**: 深黑色/深灰色 (`bg-zinc-950`)
- **文字**: 灰白色主文字，浅灰色次要文字
- **强调色**: 单色（白色/灰色）
- **间距**: 宽松的内边距和间距
- **效果**: 玻璃态效果（顶部导航），微交互（卡片悬停效果）

## 部署

项目配置为静态站点生成（SSG），可以直接部署到 Vercel：

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. Vercel 会自动检测 Next.js 并构建

## 许可证

MIT
