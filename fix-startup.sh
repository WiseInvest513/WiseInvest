#!/bin/bash

# Next.js 启动问题自动修复脚本
# 使用方法: ./fix-startup.sh

set -e  # 遇到错误立即退出

echo "=========================================="
echo "  Next.js 启动问题自动修复脚本"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 步骤 1: 检查并清理端口
echo -e "${YELLOW}[步骤 1/4] 检查端口占用...${NC}"
PORTS_OCCUPIED=false

if lsof -ti:3000 > /dev/null 2>&1; then
  echo -e "${RED}  发现端口 3000 被占用${NC}"
  lsof -ti:3000 | xargs kill -9 2>/dev/null
  echo -e "${GREEN}  ✓ 已清理端口 3000${NC}"
  PORTS_OCCUPIED=true
else
  echo -e "${GREEN}  ✓ 端口 3000 未被占用${NC}"
fi

if lsof -ti:3010 > /dev/null 2>&1; then
  echo -e "${RED}  发现端口 3010 被占用${NC}"
  lsof -ti:3010 | xargs kill -9 2>/dev/null
  echo -e "${GREEN}  ✓ 已清理端口 3010${NC}"
  PORTS_OCCUPIED=true
else
  echo -e "${GREEN}  ✓ 端口 3010 未被占用${NC}"
fi

if [ "$PORTS_OCCUPIED" = true ]; then
  sleep 2  # 等待端口释放
fi

echo ""

# 步骤 2: 停止所有 Next.js 进程
echo -e "${YELLOW}[步骤 2/4] 停止 Next.js 进程...${NC}"
if pgrep -f "next" > /dev/null 2>&1; then
  echo -e "${RED}  发现 Next.js 进程，正在停止...${NC}"
  pkill -f "next dev" 2>/dev/null || true
  pkill -f "next" 2>/dev/null || true
  sleep 2
  echo -e "${GREEN}  ✓ Next.js 进程已停止${NC}"
else
  echo -e "${GREEN}  ✓ 没有运行中的 Next.js 进程${NC}"
fi

echo ""

# 步骤 3: 清理缓存
echo -e "${YELLOW}[步骤 3/4] 清理缓存...${NC}"
if [ -d ".next" ]; then
  rm -rf .next
  echo -e "${GREEN}  ✓ 已清理 .next 目录${NC}"
else
  echo -e "${GREEN}  ✓ .next 目录不存在${NC}"
fi

if [ -d "node_modules/.cache" ]; then
  rm -rf node_modules/.cache
  echo -e "${GREEN}  ✓ 已清理 node_modules/.cache${NC}"
else
  echo -e "${GREEN}  ✓ node_modules/.cache 不存在${NC}"
fi

echo ""

# 步骤 4: 检查关键文件
echo -e "${YELLOW}[步骤 4/4] 检查关键文件...${NC}"
MISSING_FILES=false

if [ ! -f "app/layout.tsx" ]; then
  echo -e "${RED}  ✗ 缺少 app/layout.tsx${NC}"
  MISSING_FILES=true
else
  echo -e "${GREEN}  ✓ app/layout.tsx 存在${NC}"
fi

if [ ! -f "app/page.tsx" ]; then
  echo -e "${RED}  ✗ 缺少 app/page.tsx${NC}"
  MISSING_FILES=true
else
  echo -e "${GREEN}  ✓ app/page.tsx 存在${NC}"
fi

if [ ! -f "package.json" ]; then
  echo -e "${RED}  ✗ 缺少 package.json${NC}"
  MISSING_FILES=true
else
  echo -e "${GREEN}  ✓ package.json 存在${NC}"
fi

echo ""

# 总结
echo "=========================================="
if [ "$PORTS_OCCUPIED" = true ] || [ "$MISSING_FILES" = false ]; then
  echo -e "${GREEN}✓ 修复完成！现在可以运行: npm run dev${NC}"
else
  echo -e "${YELLOW}⚠ 请检查上述问题后重试${NC}"
fi
echo "=========================================="
echo ""
echo "下一步："
echo "  运行: npm run dev"
echo "  或:   npm run dev:fast  (使用 Turbopack)"
echo ""
