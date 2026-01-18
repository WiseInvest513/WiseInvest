# Vercel 部署指南

本文档详细介绍如何将项目部署到 Vercel 平台。

## 📋 目录

1. [准备工作](#准备工作)
2. [首次部署](#首次部署)
3. [环境变量配置](#环境变量配置)
4. [自动部署设置](#自动部署设置)
5. [常见问题](#常见问题)
6. [最佳实践](#最佳实践)

---

## 🔧 准备工作

### 1. 确保代码已推送到 GitHub

```bash
# 检查远程仓库
git remote -v

# 确保代码已推送
git push origin main
```

### 2. 检查项目配置

确保以下文件存在且配置正确：

- ✅ `package.json` - 包含正确的构建脚本
- ✅ `next.config.ts` 或 `next.config.js` - Next.js 配置
- ✅ `.gitignore` - 忽略不需要的文件
- ✅ `tsconfig.json` - TypeScript 配置（如果使用 TypeScript）

### 3. 检查构建脚本

打开 `package.json`，确保有以下脚本：

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

---

## 🚀 首次部署

### 方法 1: 通过 Vercel 网站（推荐）

#### 步骤 1: 登录 Vercel

1. 访问 https://vercel.com
2. 点击 **"Sign Up"** 或 **"Log In"**
3. 选择 **"Continue with GitHub"**（推荐，方便管理）

#### 步骤 2: 导入项目

1. 登录后，点击 **"Add New..."** → **"Project"**
2. 在 **"Import Git Repository"** 中，选择你的 GitHub 仓库
3. 如果看不到仓库，点击 **"Adjust GitHub App Permissions"** 授权访问

#### 步骤 3: 配置项目

1. **Project Name**: 自动填充（可以修改）
2. **Framework Preset**: 自动检测为 "Next.js"（无需修改）
3. **Root Directory**: 保持默认 `./`（如果项目在根目录）
4. **Build Command**: 自动填充 `next build`（无需修改）
5. **Output Directory**: 自动填充 `.next`（无需修改）
6. **Install Command**: 自动填充 `npm install`（如果使用 npm）

#### 步骤 4: 环境变量（可选）

如果项目需要环境变量，可以在这里添加：

- 点击 **"Environment Variables"**
- 添加变量（例如：`NEXT_PUBLIC_API_URL`）
- 点击 **"Add"**

#### 步骤 5: 部署

1. 点击 **"Deploy"** 按钮
2. 等待构建完成（通常 1-3 分钟）
3. 构建成功后，会显示部署成功的页面
4. 点击 **"Visit"** 查看你的网站

### 方法 2: 通过 Vercel CLI（命令行）

#### 步骤 1: 安装 Vercel CLI

```bash
npm install -g vercel
```

#### 步骤 2: 登录 Vercel

```bash
vercel login
```

#### 步骤 3: 部署项目

```bash
# 在项目根目录执行
cd /Users/balala/Persona/Blog/MyBlog

# 首次部署
vercel

# 按照提示操作：
# - Set up and deploy? Y
# - Which scope? 选择你的账户
# - Link to existing project? N（首次部署选择 N）
# - Project name? 输入项目名称（或直接回车使用默认）
# - Directory? 直接回车（使用当前目录）
# - Override settings? N
```

#### 步骤 4: 生产环境部署

```bash
# 部署到生产环境
vercel --prod
```

---

## 🔐 环境变量配置

### 在 Vercel 网站配置

1. 进入项目页面
2. 点击 **"Settings"** → **"Environment Variables"**
3. 添加环境变量：
   - **Name**: 变量名（例如：`NEXT_PUBLIC_API_URL`）
   - **Value**: 变量值
   - **Environment**: 选择环境（Production, Preview, Development）
4. 点击 **"Save"**

### 环境变量示例

```bash
# 公共环境变量（客户端可访问）
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_APP_NAME=Wise Invest

# 私有环境变量（仅服务器端）
DATABASE_URL=postgresql://...
API_SECRET_KEY=your-secret-key
```

### 使用环境变量

在代码中使用：

```typescript
// 客户端可访问
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// 仅服务器端
const dbUrl = process.env.DATABASE_URL;
```

---

## 🔄 自动部署设置

### GitHub 集成（默认启用）

Vercel 默认会自动部署：

- ✅ **Push to `main` branch** → 自动部署到生产环境
- ✅ **Pull Request** → 自动创建预览部署
- ✅ **Push to other branches** → 自动创建预览部署

### 部署设置

1. 进入项目 **"Settings"** → **"Git"**
2. 配置部署分支：
   - **Production Branch**: `main`（默认）
   - **Ignored Build Step**: 可以设置忽略某些提交

### 预览部署

每次创建 Pull Request 时，Vercel 会自动：
- 创建预览 URL（例如：`your-project-git-feature-branch.vercel.app`）
- 在 PR 中添加部署预览链接
- 可以评论和测试预览版本

---

## 📊 监控和管理

### 查看部署历史

1. 进入项目页面
2. 点击 **"Deployments"** 标签
3. 查看所有部署记录：
   - ✅ 成功的部署（绿色）
   - ❌ 失败的部署（红色）
   - 🟡 进行中的部署（黄色）

### 查看构建日志

1. 点击任意部署记录
2. 查看 **"Build Logs"**：
   - 构建过程
   - 错误信息
   - 警告信息

### 回滚部署

1. 在 **"Deployments"** 页面
2. 找到要回滚的部署
3. 点击 **"..."** → **"Promote to Production"**

---

## ⚙️ 项目配置

### vercel.json（可选）

在项目根目录创建 `vercel.json` 进行高级配置：

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "nextjs",
  "regions": ["hkg1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

### 重要配置说明

- **installCommand**: 如果使用 `--legacy-peer-deps`，在这里配置
- **regions**: 选择部署区域（`hkg1` = 香港，`iad1` = 美国东部等）
- **headers**: 配置 HTTP 头
- **rewrites**: URL 重写规则

---

## 🐛 常见问题

### 1. 构建失败：找不到模块

**问题**: `Module not found: Can't resolve '@/components/...'`

**解决**:
- 检查 `tsconfig.json` 中的路径别名配置
- 确保 `next.config.ts` 配置正确
- 检查文件路径是否正确

### 2. 构建失败：环境变量未定义

**问题**: `process.env.NEXT_PUBLIC_XXX is undefined`

**解决**:
- 在 Vercel 项目设置中添加环境变量
- 确保变量名以 `NEXT_PUBLIC_` 开头（客户端可访问）
- 重新部署

### 3. API 路由返回 500 错误

**问题**: API 路由在生产环境不工作

**解决**:
- 查看 Vercel 函数日志（项目 → Functions → 查看日志）
- 检查服务器端代码错误
- 确保 API 路由在 `app/api/` 目录下

### 4. 静态资源加载失败

**问题**: 图片、CSS 等资源 404

**解决**:
- 确保资源文件在 `public/` 目录下
- 检查 `next.config.ts` 中的资源路径配置
- 清除浏览器缓存

### 5. 部署速度慢

**问题**: 构建时间过长

**解决**:
- 优化依赖大小（移除未使用的包）
- 使用 Vercel 的缓存功能
- 检查 `package.json` 中的依赖版本

### 6. 域名配置

**问题**: 如何绑定自定义域名？

**解决**:
1. 进入项目 **"Settings"** → **"Domains"**
2. 输入你的域名（例如：`www.yourdomain.com`）
3. 按照提示配置 DNS 记录
4. 等待 DNS 生效（通常几分钟到几小时）

---

## ✅ 最佳实践

### 1. 环境变量管理

- ✅ 使用 `.env.example` 文件记录需要的环境变量
- ✅ 不要在代码中硬编码敏感信息
- ✅ 区分开发和生产环境变量

### 2. 构建优化

- ✅ 使用 `next/image` 优化图片
- ✅ 启用代码分割和懒加载
- ✅ 移除未使用的依赖

### 3. 错误监控

- ✅ 集成错误监控服务（如 Sentry）
- ✅ 查看 Vercel 函数日志
- ✅ 设置告警通知

### 4. 性能优化

- ✅ 使用 Vercel Analytics（可选）
- ✅ 启用 Edge Functions（适合 API 路由）
- ✅ 配置 CDN 缓存策略

### 5. 安全实践

- ✅ 使用环境变量存储敏感信息
- ✅ 启用 HTTPS（Vercel 默认启用）
- ✅ 定期更新依赖包

---

## 📝 部署检查清单

部署前检查：

- [ ] 代码已推送到 GitHub
- [ ] `package.json` 中的构建脚本正确
- [ ] 环境变量已配置（如果需要）
- [ ] `.gitignore` 包含不需要的文件
- [ ] 没有硬编码的 API 密钥或敏感信息
- [ ] 测试本地构建：`npm run build`
- [ ] 测试本地运行：`npm start`

---

## 🚀 快速部署命令

### 使用 Vercel CLI

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署到生产环境
vercel --prod

# 查看部署状态
vercel ls

# 查看项目信息
vercel inspect
```

### 使用 GitHub Actions（高级）

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 📚 参考资源

- [Vercel 官方文档](https://vercel.com/docs)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Vercel CLI 文档](https://vercel.com/docs/cli)
- [环境变量指南](https://vercel.com/docs/environment-variables)

---

## 💡 提示

1. **首次部署**: 建议使用网站界面，更直观
2. **后续部署**: 推送到 GitHub 会自动部署
3. **预览部署**: 每个 PR 都会自动创建预览链接
4. **监控**: 定期查看部署日志和性能指标
5. **回滚**: 如果部署失败，可以快速回滚到之前的版本

---

**最后更新**: 2025-01-XX
**维护者**: Wise Invest Team
