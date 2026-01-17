#!/bin/bash

# 代码提交前全局检查脚本
# 检查 TypeScript 类型、ESLint、构建等

echo "🔍 开始全局代码检查..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# 1. TypeScript 类型检查
echo "1️⃣ 检查 TypeScript 类型..."
if npx tsc --noEmit 2>&1; then
    echo -e "${GREEN}✅ TypeScript 类型检查通过${NC}"
else
    echo -e "${RED}❌ TypeScript 类型检查失败${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 2. ESLint 检查
echo "2️⃣ 检查 ESLint..."
if npm run lint 2>&1 | grep -q "No ESLint warnings or errors"; then
    echo -e "${GREEN}✅ ESLint 检查通过${NC}"
else
    echo -e "${YELLOW}⚠️ ESLint 有警告（不影响构建）${NC}"
fi
echo ""

# 3. 检查重复的类型导出
echo "3️⃣ 检查重复的类型导出..."
DUPLICATE_EXPORTS=$(grep -r "export.*type.*HistoricalPriceResult" lib/services/*.ts 2>/dev/null | wc -l | tr -d ' ')
if [ "$DUPLICATE_EXPORTS" -gt 1 ]; then
    echo -e "${RED}❌ 发现重复的 HistoricalPriceResult 导出${NC}"
    grep -n "export.*type.*HistoricalPriceResult" lib/services/*.ts
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ 没有重复的类型导出${NC}"
fi
echo ""

# 4. 检查私有方法访问
echo "4️⃣ 检查私有方法访问..."
if grep -r "private static.*fetchWithProxy" lib/services/*.ts > /dev/null 2>&1; then
    echo -e "${RED}❌ 发现私有方法 fetchWithProxy（应该是 public）${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ 方法访问权限正确${NC}"
fi
echo ""

# 5. 检查 Git 状态
echo "5️⃣ 检查 Git 状态..."
if git diff --quiet && git diff --cached --quiet; then
    echo -e "${GREEN}✅ 工作目录干净${NC}"
else
    echo -e "${YELLOW}⚠️ 有未提交的更改${NC}"
    git status --short
fi
echo ""

# 总结
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ 所有检查通过！可以安全提交代码${NC}"
    exit 0
else
    echo -e "${RED}❌ 发现 $ERRORS 个错误，请修复后再提交${NC}"
    exit 1
fi
