# Vercel 快速开始

## 🚀 3 步部署到 Vercel

### 步骤 1: 登录 Vercel

1. 访问 https://vercel.com
2. 点击 **"Sign Up"** 或 **"Log In"**
3. 选择 **"Continue with GitHub"**

### 步骤 2: 导入项目

1. 点击 **"Add New..."** → **"Project"**
2. 选择你的 GitHub 仓库
3. 点击 **"Import"**

### 步骤 3: 部署

1. 保持默认设置（Vercel 会自动检测 Next.js）
2. 点击 **"Deploy"**
3. 等待 1-3 分钟
4. 完成！🎉

---

## ⚙️ 重要配置

### 安装命令（如果需要）

如果你的项目使用 `--legacy-peer-deps`：

1. 进入项目 **"Settings"** → **"General"**
2. 找到 **"Install Command"**
3. 设置为：`npm install --legacy-peer-deps`
4. 保存并重新部署

### 环境变量（如果需要）

1. 进入项目 **"Settings"** → **"Environment Variables"**
2. 添加变量：
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://your-api.com`
   - Environment: `Production`
3. 点击 **"Save"**
4. 重新部署

---

## 🔄 自动部署

✅ **已自动启用**

- Push 到 `main` 分支 → 自动部署到生产环境
- 创建 Pull Request → 自动创建预览部署

无需额外配置！

---

## 📊 查看部署

1. 进入项目页面
2. 点击 **"Deployments"** 标签
3. 查看所有部署记录

---

## 🐛 常见问题

### 构建失败？

1. 查看 **"Build Logs"** 找到错误
2. 检查 `package.json` 中的脚本
3. 确保所有依赖都已安装

### API 不工作？

1. 查看 **"Functions"** → **"Logs"**
2. 检查 API 路由代码
3. 确保环境变量已配置

### 需要帮助？

查看完整指南: [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)
