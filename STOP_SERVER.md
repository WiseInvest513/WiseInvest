# 停止开发服务器的方法

## 方法 1: 在运行服务器的终端中按快捷键（最简单）

如果服务器是在终端中运行的，直接按：
```
Ctrl + C
```

这会优雅地停止服务器。

## 方法 2: 使用 kill-ports 脚本

```bash
./kill-ports.sh
```

这会清理所有 Next.js 相关的端口和进程。

## 方法 3: 使用 npm 脚本

```bash
npm run kill-ports
```

## 方法 4: 手动停止（如果上述方法都不行）

### 停止所有 Next.js 进程：
```bash
pkill -f "next dev"
```

### 停止所有 Node.js 进程（谨慎使用）：
```bash
pkill -f "node"
```

### 清理特定端口：
```bash
# 清理端口 3002
lsof -ti:3002 | xargs kill -9

# 清理多个端口
lsof -ti:3000,3001,3002 | xargs kill -9
```

## 方法 5: 使用 fix-startup.sh 脚本

```bash
./fix-startup.sh
```

这个脚本会停止所有进程并清理端口。

## 验证服务器已停止

检查端口是否已释放：
```bash
lsof -i :3002
```

如果没有输出，说明端口已释放，服务器已停止。
