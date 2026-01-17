#!/bin/bash

# Git Push 代理配置脚本
# 使用方法: ./git-push-with-proxy.sh

echo "🚀 配置 Git 使用代理并推送..."

# 设置代理（端口 7897，根据你的实际情况修改）
export http_proxy=http://127.0.0.1:7897
export https_proxy=http://127.0.0.1:7897

echo "✅ 代理已设置: http://127.0.0.1:7897"
echo "📤 开始推送..."

# 执行推送
git push origin main

# 检查结果
if [ $? -eq 0 ]; then
    echo "✅ 推送成功！"
else
    echo "❌ 推送失败，请尝试以下方案："
    echo ""
    echo "方案 1: 检查代理是否运行"
    echo "   curl -I http://127.0.0.1:7897"
    echo ""
    echo "方案 2: 改用 SSH 方式"
    echo "   git remote set-url origin git@github.com:WiseInvest513/WiseInvest.git"
    echo "   git push origin main"
    echo ""
    echo "方案 3: 查看详细文档"
    echo "   cat docs/GIT_PUSH_FIX.md"
fi
