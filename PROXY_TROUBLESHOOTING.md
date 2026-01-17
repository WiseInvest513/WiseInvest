# 代理问题排查指南

## 🔍 问题诊断结果

通过 `/api/debug-proxy` 端点检查，发现：
- ❌ **环境变量为空** - 代理环境变量没有被传递到 Next.js 服务器进程
- ✅ **代理服务运行中** - 端口 7897 有连接
- ✅ **Node.js 版本** - v22.19.0

## 🎯 根本原因

**Node.js 的内置 `fetch` 不支持代理环境变量！**

Next.js 15 使用 undici 作为 fetch 实现，但需要显式配置 ProxyAgent。

## ✅ 解决方案

### 步骤 1：确保使用正确的启动命令

**❌ 错误方式：**
```bash
npm run dev  # 不会设置代理环境变量
```

**✅ 正确方式：**
```bash
npm run dev:proxy
```

或者：
```bash
./start-with-proxy.sh
```

### 步骤 2：验证环境变量

启动服务器后，访问：
```
http://localhost:3000/api/debug-proxy
```

应该看到：
```json
{
  "env": {
    "https_proxy": "http://127.0.0.1:7897",
    "http_proxy": "http://127.0.0.1:7897",
    ...
  }
}
```

### 步骤 3：如果环境变量仍然为空

说明环境变量没有传递到进程。需要：

1. **停止当前服务器**
2. **使用代理模式重新启动**：
   ```bash
   npm run dev:proxy
   ```
3. **检查启动日志**，应该看到代理设置信息

### 步骤 4：如果环境变量已设置但仍失败

这说明 Node.js fetch 不支持代理。代码已经更新为使用 undici ProxyAgent，但需要确保：

1. 环境变量正确传递
2. undici 可用（Next.js 15 自带）

## 📝 当前代码状态

代码已更新为：
- ✅ 尝试使用 undici ProxyAgent
- ✅ 添加详细的日志记录
- ✅ 显示具体的错误信息

## 🚀 立即行动

1. **停止当前服务器**（如果正在运行）
2. **使用代理模式启动**：
   ```bash
   npm run dev:proxy
   ```
3. **访问诊断端点**：
   ```
   http://localhost:3000/api/debug-proxy
   ```
4. **测试 API**：
   ```
   http://localhost:3000/api/roi?id=btc&years=3
   ```
5. **查看服务器日志**，检查是否有代理相关的日志

## 💡 如果仍然失败

请提供：
1. `/api/debug-proxy` 的完整输出
2. 服务器启动时的日志
3. API 调用时的错误信息

这样我可以进一步诊断问题。

