#!/bin/bash
# 文集文档迁移脚本
# 将现有文档移动到新的文件夹结构中

cd "$(dirname "$0")"

echo "📁 创建文件夹结构..."
mkdir -p buffett/letters
mkdir -p buffett/meetings
mkdir -p duan/business
mkdir -p duan/investment

echo "📦 移动股东大会文档..."
mv "1957-1967股东大会.docx" buffett/meetings/ 2>/dev/null && echo "  ✓ 1957-1967股东大会.docx"
mv "1968-1978 股东大会.docx" buffett/meetings/ 2>/dev/null && echo "  ✓ 1968-1978 股东大会.docx"
mv "1979-1989 股东大会.docx" buffett/meetings/ 2>/dev/null && echo "  ✓ 1979-1989 股东大会.docx"
mv "1990-2000 股东大会.docx" buffett/meetings/ 2>/dev/null && echo "  ✓ 1990-2000 股东大会.docx"
mv "2001-2010 股东大会.docx" buffett/meetings/ 2>/dev/null && echo "  ✓ 2001-2010 股东大会.docx"
mv "2011-2021 股东大会.docx" buffett/meetings/ 2>/dev/null && echo "  ✓ 2011-2021 股东大会.docx"
mv "2022-2025股东大会.docx" buffett/meetings/ 2>/dev/null && echo "  ✓ 2022-2025股东大会.docx"

echo ""
echo "✅ 迁移完成！"
echo ""
echo "📋 新的文件夹结构："
tree -L 3 -I '*.md' 2>/dev/null || find . -type d -maxdepth 2 | sort
