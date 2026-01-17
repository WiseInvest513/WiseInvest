#!/bin/bash

# 设置代理环境变量
export https_proxy=http://127.0.0.1:7897
export http_proxy=http://127.0.0.1:7897
export all_proxy=socks5://127.0.0.1:7897

# 启动 Next.js 开发服务器
echo "🚀 Starting Next.js dev server with proxy..."
echo "📡 Proxy settings:"
echo "   HTTPS_PROXY: $https_proxy"
echo "   HTTP_PROXY: $http_proxy"
echo "   ALL_PROXY: $all_proxy"
echo ""

npm run dev

