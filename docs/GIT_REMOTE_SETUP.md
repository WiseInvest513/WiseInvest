# Git 远端仓库设置指南

## 🔍 问题诊断

当前错误：`Permission denied (publickey)` 表示 SSH 认证失败。

**发现的问题**：
- Remote URL 末尾有错误的 `~` 符号：`git@github.com:WiseInvest513/WiseInvest.git~`
- 使用 SSH 方式但没有配置 SSH 密钥

## ✅ 解决方案（两种方式）

### 方案 1: 改用 HTTPS 方式（推荐，最简单）

**优点**: 不需要配置 SSH 密钥，使用用户名和密码（或 Personal Access Token）即可。

#### 步骤 1: 修改 remote URL 为 HTTPS

```bash
# 查看当前 remote 配置
git remote -v

# 修改为 HTTPS 方式
git remote set-url origin https://github.com/WiseInvest513/WiseInvest.git

# 验证修改
git remote -v
```

#### 步骤 2: 推送代码

```bash
git push origin main
```

**注意**: 
- 首次推送会要求输入 GitHub 用户名和密码
- 如果启用了 2FA（双因素认证），需要使用 **Personal Access Token** 代替密码
- 生成 Token: GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)

---

### 方案 2: 配置 SSH 密钥（更安全，长期推荐）

**优点**: 配置一次后，后续推送无需输入密码。

#### 步骤 1: 检查是否已有 SSH 密钥

```bash
ls -la ~/.ssh/id_*.pub
```

如果没有输出，说明没有 SSH 密钥，需要生成。

#### 步骤 2: 生成 SSH 密钥

```bash
# 替换为你的 GitHub 邮箱
ssh-keygen -t ed25519 -C "your_email@example.com"

# 按 Enter 使用默认路径 (~/.ssh/id_ed25519)
# 可以设置密码（可选，推荐设置）
```

#### 步骤 3: 启动 SSH 代理并添加密钥

```bash
# 启动 ssh-agent
eval "$(ssh-agent -s)"

# 添加 SSH 密钥到 ssh-agent
ssh-add ~/.ssh/id_ed25519
```

#### 步骤 4: 复制公钥内容

```bash
# 复制公钥内容（会显示在终端）
cat ~/.ssh/id_ed25519.pub

# 或者使用 pbcopy（macOS）
pbcopy < ~/.ssh/id_ed25519.pub
```

#### 步骤 5: 添加到 GitHub

1. 登录 GitHub
2. 点击右上角头像 > **Settings**
3. 左侧菜单选择 **SSH and GPG keys**
4. 点击 **New SSH key**
5. **Title**: 填写描述（如 "MacBook Pro"）
6. **Key**: 粘贴刚才复制的公钥内容
7. 点击 **Add SSH key**

#### 步骤 6: 测试 SSH 连接

```bash
ssh -T git@github.com
```

如果看到 `Hi WiseInvest513! You've successfully authenticated...` 说明配置成功。

#### 步骤 7: 确保 remote URL 使用 SSH

```bash
# 如果之前是 HTTPS，改为 SSH
git remote set-url origin git@github.com:WiseInvest513/WiseInvest.git

# 验证
git remote -v
```

#### 步骤 8: 推送代码

```bash
git push origin main
```

---

## 🚀 快速修复（推荐）

**如果你现在就想推送代码，最快的方法是使用 HTTPS**：

### 方法 1: 使用修复脚本（一键修复）

```bash
# 运行修复脚本
./fix-git-remote.sh

# 然后推送
git push origin main
```

### 方法 2: 手动修复

```bash
# 1. 修复 remote URL（去掉末尾的 ~，改为 HTTPS）
git remote set-url origin https://github.com/WiseInvest513/WiseInvest.git

# 2. 验证修改
git remote -v

# 3. 推送（会提示输入用户名和密码/Token）
git push origin main
```

---

## 📝 当前 Remote 配置

```bash
# 查看当前配置
git remote -v

# 如果显示 SSH 方式（git@github.com），但遇到认证问题：
# → 使用方案 1 改为 HTTPS（最快）
# → 或使用方案 2 配置 SSH 密钥（长期推荐）
```

---

## 🔧 其他常用命令

### 查看 remote 配置
```bash
git remote -v
```

### 修改 remote URL
```bash
# HTTPS 方式
git remote set-url origin https://github.com/WiseInvest513/WiseInvest.git

# SSH 方式
git remote set-url origin git@github.com:WiseInvest513/WiseInvest.git
```

### 添加新的 remote
```bash
git remote add origin https://github.com/WiseInvest513/WiseInvest.git
```

### 删除 remote
```bash
git remote remove origin
```

---

## ⚠️ 常见问题

### Q: HTTPS 推送时提示 "Authentication failed"
**A**: 如果启用了 2FA，需要使用 Personal Access Token：
1. GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Generate new token (classic)
3. 选择权限：至少勾选 `repo`
4. 生成后复制 Token，推送时密码处粘贴 Token

### Q: SSH 测试时提示 "Permission denied"
**A**: 
1. 检查密钥是否添加到 ssh-agent: `ssh-add -l`
2. 检查 GitHub 是否添加了正确的公钥
3. 测试连接: `ssh -T git@github.com -v` (查看详细日志)

### Q: 如何切换回 HTTPS？
**A**: 
```bash
git remote set-url origin https://github.com/WiseInvest513/WiseInvest.git
```

---

## 📚 相关文档

- [Git 快速开始](./GIT_QUICK_START.md)
- [Git 推送问题修复](./GIT_PUSH_FIX.md)
- [Git 提交指南](./GIT_COMMIT_GUIDE.md)
