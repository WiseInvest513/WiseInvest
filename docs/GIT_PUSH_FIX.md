# Git Push 卡住/超时问题解决方案

## 问题描述

### 问题 1: 命令卡住不动
`git push` 命令一直卡住不动，通常是网络连接 GitHub 超时导致的。

### 问题 2: 网络超时错误
```
fatal: unable to access 'https://github.com/...': Recv failure: Operation timed out
```

**原因**: 网络无法直接访问 GitHub，需要使用代理。

## 解决方案

### 方案 1: 配置 Git 使用代理（推荐）

如果你的系统有代理（例如端口 7897），可以配置 Git 使用代理：

```bash
# 配置 HTTP/HTTPS 代理（临时，仅当前会话）
export http_proxy=http://127.0.0.1:7897
export https_proxy=http://127.0.0.1:7897

# 然后执行推送
git push origin main
```

或者永久配置（仅针对 GitHub）：

```bash
# 仅对 GitHub 使用代理
git config --global http.https://github.com.proxy http://127.0.0.1:7897
git config --global https.https://github.com.proxy http://127.0.0.1:7897

# 推送
git push origin main
```

### 方案 2: 改用 SSH 方式（最稳定）

SSH 方式通常比 HTTPS 更稳定，不受代理限制：

```bash
# 1. 检查是否已有 SSH 密钥
ls -la ~/.ssh/id_rsa.pub

# 2. 如果没有，生成 SSH 密钥
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 3. 复制公钥内容
cat ~/.ssh/id_rsa.pub

# 4. 在 GitHub 上添加 SSH 密钥：
#    Settings > SSH and GPG keys > New SSH key

# 5. 测试连接
ssh -T git@github.com

# 6. 修改 remote URL 为 SSH
git remote set-url origin git@github.com:WiseInvest513/WiseInvest.git

# 7. 推送
git push origin main
```

### 方案 3: 增加超时和缓冲区设置

```bash
# 增加超时时间（秒）
git config --global http.postBuffer 524288000
git config --global http.lowSpeedLimit 0
git config --global http.lowSpeedTime 999999

# 推送
git push origin main
```

### 方案 4: 使用 GitHub CLI（如果已安装）

```bash
# 安装 GitHub CLI（如果未安装）
# brew install gh

# 登录
gh auth login

# 推送
git push origin main
```

## 快速诊断命令

```bash
# 检查网络连接
curl -I https://github.com

# 检查 Git 配置
git config --list | grep proxy

# 检查 remote URL
git remote -v

# 测试 SSH 连接（如果使用 SSH）
ssh -T git@github.com
```

## 🚀 快速修复（一键解决）

**如果遇到网络超时，使用一键修复脚本**：

```bash
# 进入项目目录
cd "/Users/balala/Persona/Blog/MyBlog"

# 运行一键修复脚本（自动配置代理并推送）
./fix-git-remote-and-push.sh
```

这个脚本会：
1. ✅ 修复 remote URL
2. ✅ 自动配置代理（端口 7897）
3. ✅ 推送代码

---

## 推荐操作步骤

1. **首先尝试一键修复脚本**（`./fix-git-remote-and-push.sh`）- 最简单
2. **如果脚本失败，尝试方案 1**（手动配置代理）- 最快
3. **如果方案 1 不行，使用方案 2**（SSH）- 最稳定
4. **如果都失败，检查网络连接**，可能需要更换网络环境

## 取消代理配置（如果需要）

```bash
# 取消全局代理
git config --global --unset http.https://github.com.proxy
git config --global --unset https.https://github.com.proxy

# 取消环境变量（当前会话）
unset http_proxy
unset https_proxy
```
