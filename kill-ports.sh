#!/bin/bash

# 清理 Next.js 相关端口的脚本

echo "=== 清理 Next.js 相关端口和进程 ==="

# 清理端口 3000
if lsof -ti:3000 > /dev/null 2>&1; then
  echo "发现端口 3000 被占用，正在清理..."
  lsof -ti:3000 | xargs kill -9 2>/dev/null
  echo "✓ 端口 3000 已清理"
else
  echo "✓ 端口 3000 未被占用"
fi

# 清理端口 3010
if lsof -ti:3010 > /dev/null 2>&1; then
  echo "发现端口 3010 被占用，正在清理..."
  lsof -ti:3010 | xargs kill -9 2>/dev/null
  echo "✓ 端口 3010 已清理"
else
  echo "✓ 端口 3010 未被占用"
fi

# 停止所有 Next.js 进程
if pgrep -f "next" > /dev/null 2>&1; then
  echo "发现 Next.js 进程，正在停止..."
  pkill -f "next" 2>/dev/null
  sleep 2
  echo "✓ Next.js 进程已停止"
else
  echo "✓ 没有运行中的 Next.js 进程"
fi

echo ""
echo "=== 清理完成，现在可以运行 npm run dev ==="
