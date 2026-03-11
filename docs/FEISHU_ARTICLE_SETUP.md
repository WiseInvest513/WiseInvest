# 飞书文章功能配置指南

## 功能说明

- **文章地址**：`https://www.wise-invest.org/article/{4位码}`
- **管理页面**：`https://www.wise-invest.org/article513`（秘密地址）
- **布局**：文章占满左侧，右侧为本页目录（无左侧教程目录）

## 配置步骤

### 1. 飞书开放平台

1. 登录 [飞书开放平台](https://open.feishu.cn/)
2. 创建企业自建应用
3. 获取 **App ID** 和 **App Secret**
4. 在「权限管理」中开通：
   - 云文档：查看、评论、编辑和管理云文档
   - 或至少：查看云文档
5. 将应用发布，或把需要解析的文档「分享」给应用

### 2. 环境变量

在 `.env.local` 或 Vercel 环境变量中添加：

```
FEISHU_APP_ID=your_app_id
FEISHU_APP_SECRET=your_app_secret
```

### 3. Redis（与短链共用）

文章映射使用与短链相同的 Upstash Redis，无需额外配置。

## 使用流程

1. 访问 `https://www.wise-invest.org/article513`
2. 粘贴飞书云文档链接，格式：`https://xxx.feishu.cn/docx/xxxxxxxx`
3. 点击「生成文章链接」
4. 复制生成的 `https://www.wise-invest.org/article/1234`
5. 访问该链接即可查看文章（解析后展示，无左侧教程目录，右侧保留本页目录）

## 文档 ID 格式

飞书链接：`https://xxx.feishu.cn/docx/Vm8VdbTMxo78U6xtistc8uUAnTf`  
文档 ID：`Vm8VdbTMxo78U6xtistc8uUAnTf`
