# Favicon 下载脚本使用说明

## 功能说明

这个脚本用于批量下载所有资源的 favicon 图标，并保存到本地缓存，以提高网站响应速度。

## 使用方法

### 1. 运行下载脚本

```bash
npm run download-favicons
```

### 2. 脚本功能

- 自动读取 `lib/resources-data.ts` 中的所有资源
- 从 Google Favicon API 下载每个资源的 favicon
- 保存到 `public/icons/favicons/` 目录
- 生成映射文件 `lib/favicon-mapping.json`

### 3. 图标显示优先级

网站会按以下优先级显示图标：

1. **本地缓存的 favicon** (`public/icons/favicons/`) - 最快，最可靠
2. **Google Favicon API** - 在线获取（如果缓存不存在）
3. **Lucide 图标** - 最终回退方案

### 4. 更新图标

当添加新资源时，运行脚本会自动：
- 跳过已存在的图标
- 只下载新的图标
- 更新映射文件

### 5. 注意事项

- 脚本会在每个请求之间添加 200ms 延迟，避免触发 API 限流
- 如果某个图标下载失败，会记录错误但继续处理其他资源
- 已存在的图标不会重新下载，节省时间

## 文件结构

```
public/
  icons/
    favicons/          # 下载的 favicon 图标存储目录
      binance.png
      okx.png
      ...

lib/
  favicon-mapping.json # URL 到本地文件路径的映射
  favicon-utils.ts     # 图标工具函数
```

## 技术细节

- 使用 Google Favicon API: `https://www.google.com/s2/favicons?domain={domain}&sz=128`
- 图标大小: 128x128 像素
- 文件格式: PNG
- 命名规则: 资源名称转小写，特殊字符替换为连字符

