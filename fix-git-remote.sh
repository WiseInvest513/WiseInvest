#!/bin/bash

# Git Remote 快速修复脚本
# 解决 SSH 认证失败和 URL 错误问题

echo "🔧 修复 Git Remote 配置..."

# 1. 查看当前配置
echo ""
echo "当前 remote 配置:"
git remote -v

# 2. 修复 remote URL（去掉末尾的 ~，改为 HTTPS）
echo ""
echo "✅ 修复 remote URL..."
git remote set-url origin https://github.com/WiseInvest513/WiseInvest.git

# 3. 验证修改
echo ""
echo "修复后的 remote 配置:"
git remote -v

echo ""
echo "✅ Remote URL 已修复！"
echo ""
echo "📤 现在可以推送代码了："
echo "   git push origin main"
echo ""
echo "💡 提示：首次推送会要求输入 GitHub 用户名和密码"
echo "   如果启用了 2FA，需要使用 Personal Access Token 代替密码"
echo "   生成 Token: https://github.com/settings/tokens"
