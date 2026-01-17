# Git 快速开始指南

## ⚙️ 首次使用 Git（可选但推荐）

如果看到 Git 提示配置用户信息，可以设置：

```bash
# 设置用户名和邮箱（只需设置一次）
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

**注意**: 即使不设置，Git 也会自动配置，提交仍然可以正常进行。

## 🚀 最常用的 3 个命令

```bash
# 1. 查看更改状态
git status

# 2. 添加所有更改并提交
git add .
git commit -m "feat: 描述你的更改"

# 3. 推送到 GitHub
git push
```

---

## 📝 完整提交流程（首次使用）

### 步骤 1: 检查 Git 状态

```bash
cd /Users/balala/个人资料/Blog/MyBlog
git status
```

### 步骤 2: 添加文件到暂存区

```bash
# 添加所有更改
git add .

# 或者只添加特定文件
git add app/tools/contract-calculator/
git add components/tools/ContractCalculator.tsx
```

### 步骤 3: 提交更改

```bash
git commit -m "feat: 添加合约交易计算器功能"
```

### 步骤 4: 推送到 GitHub

```bash
# 如果还没有设置远程仓库
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 推送到 GitHub
git push -u origin main
```

---

## 🔄 日常使用（3 步）

```bash
git add .
git commit -m "feat: 你的更改描述"
git push
```

---

## 📋 本次会话的提交命令

### 一次性提交所有更改

```bash
git add .
git commit -m "feat: 更新项目功能

- 添加合约交易计算器
- 修复宏观仪表板数据获取
- 优化加密货币收益率对比功能
- 删除彩虹图功能"
git push
```

---

## ⚠️ 常见错误解决

### 错误: "fatal: not a git repository"

```bash
# 初始化 Git 仓库
git init
```

### 错误: "fatal: remote origin already exists"

```bash
# 查看现有远程仓库
git remote -v

# 如果需要更新远程地址
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

### 错误: "Updates were rejected"

```bash
# 先拉取远程更改
git pull origin main --rebase

# 然后再推送
git push
```

---

## 📚 详细文档

查看完整指南: [GIT_COMMIT_GUIDE.md](./GIT_COMMIT_GUIDE.md)
