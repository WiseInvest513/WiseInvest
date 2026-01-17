#!/bin/bash

# 检查 Next.js 开发服务器错误的脚本

echo "=== 1. 检查是否有 Next.js 进程在运行 ==="
ps aux | grep "next dev" | grep -v grep

echo ""
echo "=== 2. 检查端口占用情况 ==="
lsof -i :3000 2>/dev/null || echo "端口 3000 未被占用"

echo ""
echo "=== 3. 停止所有 Next.js 进程 ==="
pkill -f "next dev" 2>/dev/null && echo "已停止 Next.js 进程" || echo "没有运行中的 Next.js 进程"

echo ""
echo "=== 4. 清理缓存 ==="
rm -rf .next node_modules/.cache
echo "缓存已清理"

echo ""
echo "=== 5. 启动开发服务器（查看完整输出）==="
echo "正在启动开发服务器，请查看下面的错误信息..."
echo "按 Ctrl+C 停止服务器"
echo ""

# 启动服务器并显示所有输出
npm run dev
