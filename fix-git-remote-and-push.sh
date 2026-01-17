#!/bin/bash

# Git Remote 修复 + 代理推送脚本
# 解决 SSH 认证失败、URL 错误和网络超时问题

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

# 4. 配置代理（端口 7897，根据实际情况修改）
echo ""
echo "🌐 配置 Git 使用代理..."
export http_proxy=http://127.0.0.1:7897
export https_proxy=http://127.0.0.1:7897

echo "✅ 代理已设置: http://127.0.0.1:7897"

# 5. 推送代码
echo ""
echo "📤 开始推送代码..."
git push origin main

# 检查结果
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 推送成功！"
else
    echo ""
    echo "❌ 推送失败，可能的原因："
    echo "   1. 代理未运行（检查端口 7897）"
    echo "   2. 网络连接问题"
    echo ""
    echo "💡 尝试以下方案："
    echo ""
    echo "方案 1: 检查代理是否运行"
    echo "   curl -I http://127.0.0.1:7897"
    echo ""
    echo "方案 2: 手动设置代理后推送"
    echo "   export http_proxy=http://127.0.0.1:7897"
    echo "   export https_proxy=http://127.0.0.1:7897"
    echo "   git push origin main"
    echo ""
    echo "方案 3: 永久配置 Git 代理"
    echo "   git config --global http.https://github.com.proxy http://127.0.0.1:7897"
    echo "   git config --global https.https://github.com.proxy http://127.0.0.1:7897"
    echo "   git push origin main"
    echo ""
    echo "方案 4: 查看详细文档"
    echo "   cat docs/GIT_PUSH_FIX.md"
fi
