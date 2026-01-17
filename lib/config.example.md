# 站点配置使用指南

## 📝 配置文件位置

配置文件位于：`lib/config.ts`

## 🔧 如何修改域名

### 方法 1：直接修改配置文件（推荐用于开发）

编辑 `lib/config.ts` 文件，修改 `baseUrl`：

```typescript
export const siteConfig = {
  baseUrl: "http://localhost:3000",  // 开发环境
  // baseUrl: "https://yourdomain.com",  // 生产环境
  // ...
}
```

### 方法 2：使用环境变量（推荐用于生产）

1. 创建 `.env.local` 文件（如果还没有）：
```bash
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

2. 配置文件会自动读取环境变量：
```typescript
baseUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
```

## 💡 使用示例

### 1. 生成完整 URL

```typescript
import { siteConfig } from "@/lib/config";

// 生成完整 URL
const toolsUrl = siteConfig.url("/tools");
// 结果: "http://localhost:3000/tools"

const aboutUrl = siteConfig.url("/aboutme");
// 结果: "http://localhost:3000/aboutme"
```

### 2. 在组件中使用

```typescript
"use client";

import { siteConfig } from "@/lib/config";

export function ShareButton() {
  const shareUrl = siteConfig.url("/tools/price-tracker");
  
  const handleShare = () => {
    // 分享链接
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`);
  };
  
  return (
    <button onClick={handleShare}>
      分享工具链接
    </button>
  );
}
```

### 3. 在 API 路由中使用

```typescript
import { siteConfig } from "@/lib/config";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    shareUrl: siteConfig.url("/tools"),
    canonicalUrl: siteConfig.baseUrl,
  });
}
```

### 4. 在 SEO Meta Tags 中使用

```typescript
import { siteConfig } from "@/lib/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.baseUrl),
  openGraph: {
    url: siteConfig.url("/tools"),
  },
};
```

## 📌 注意事项

1. **相对路径 vs 完整 URL**
   - Next.js 内部导航使用相对路径即可（如 `<Link href="/tools">`）
   - 只有在需要完整 URL 的场景才使用 `siteConfig.url()`（如分享、SEO、外部引用）

2. **环境变量**
   - 环境变量名必须是 `NEXT_PUBLIC_` 开头才能在客户端使用
   - 修改环境变量后需要重启开发服务器

3. **生产环境部署**
   - 建议使用环境变量方式配置生产域名
   - 避免在代码中硬编码生产域名

## 🔄 迁移步骤

当需要切换到生产域名时：

1. 设置环境变量 `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`
2. 或者直接修改 `lib/config.ts` 中的 `baseUrl`
3. 重新构建和部署应用

所有使用 `siteConfig.url()` 的地方都会自动更新！

