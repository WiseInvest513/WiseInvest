# Next.js 启动问题排查指南

当遇到 "Internal Server Error"、"missing required error components" 或服务器无法启动时，请按照以下步骤排查：

## 🔍 快速排查流程（按顺序执行）

### 步骤 1: 检查端口占用（最常见原因）

```bash
# 检查端口是否被占用
lsof -i :3000,3010

# 如果发现占用，清理端口
lsof -ti:3000,3010 | xargs kill -9 2>/dev/null
```

**或者直接运行脚本：**
```bash
./kill-ports.sh
```

### 步骤 2: 停止所有 Next.js 进程

```bash
# 停止所有 Next.js 相关进程
pkill -f "next dev"
pkill -f "next"
```

### 步骤 3: 清理缓存

```bash
# 清理 Next.js 缓存
npm run clean

# 或者手动清理
rm -rf .next node_modules/.cache
```

### 步骤 4: 重新启动服务器

```bash
# 正常启动
npm run dev

# 或使用快速模式（Turbopack）
npm run dev:fast
```

## 📋 完整排查清单

如果快速流程无法解决问题，请按以下清单逐项检查：

### ✅ 端口和进程检查
- [ ] 端口 3000 未被占用
- [ ] 端口 3010 未被占用（HMR 端口）
- [ ] 没有残留的 Node.js 进程
- [ ] 没有多个开发服务器同时运行

### ✅ 缓存清理
- [ ] 清理了 `.next` 目录
- [ ] 清理了 `node_modules/.cache`
- [ ] 浏览器缓存已清除（硬刷新：Cmd+Shift+R）

### ✅ 依赖检查
- [ ] `node_modules` 完整（如不确定，运行 `npm install`）
- [ ] 没有依赖版本冲突

### ✅ 代码检查
- [ ] 没有语法错误（运行 `npm run build` 检查）
- [ ] 没有类型错误
- [ ] 所有必需的文件都存在（layout.tsx, page.tsx 等）

### ✅ 环境检查
- [ ] Node.js 版本正确
- [ ] 环境变量配置正确（如果有）
- [ ] 网络连接正常（如果需要下载依赖）

## 🚨 常见错误及解决方案

### 错误 1: `EADDRINUSE: address already in use`
**原因：** 端口被占用  
**解决：** 运行 `./kill-ports.sh` 或手动清理端口

### 错误 2: `Internal Server Error`
**原因：** 通常是端口冲突或编译错误  
**解决：** 
1. 先清理端口（步骤 1）
2. 清理缓存（步骤 3）
3. 检查编译错误：`npm run build`

### 错误 3: `missing required error components`
**原因：** 服务器未正常启动，导致错误组件无法加载  
**解决：** 按照快速排查流程执行步骤 1-4

### 错误 4: 页面显示但不完整（Navbar/Footer 消失）
**原因：** 组件被注释或服务器未完全启动  
**解决：** 
1. 检查 `app/layout.tsx` 确保组件未被注释
2. 清理端口并重启服务器

## 🛠️ 自动化脚本

项目根目录提供了以下脚本：

- `kill-ports.sh` - 自动清理端口和进程
- `check-errors.sh` - 完整的错误检查流程

## 📝 记录问题

如果以上方法都无法解决，请记录以下信息：

1. 完整的错误信息（从终端复制）
2. 执行了哪些排查步骤
3. Node.js 版本：`node -v`
4. Next.js 版本：`npm list next`
5. 操作系统信息

然后可以：
- 查看 Next.js 官方文档
- 搜索 GitHub Issues
- 寻求社区帮助

## 💡 预防措施

1. **正确停止服务器**：使用 `Ctrl+C` 后等待进程完全退出
2. **避免多实例**：不要同时运行多个开发服务器
3. **定期清理**：遇到奇怪问题时，先清理缓存
4. **使用脚本**：使用提供的脚本自动化清理流程
