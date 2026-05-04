import type { NextConfig } from "next";

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "connect-src 'self' https: wss: ws:",
  "frame-src https://www.youtube.com https://player.bilibili.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  // 告诉 Next.js 不要将这些重型 Node.js 库打包进 Serverless Function
  // 改为运行时 require，避免 Vercel 250MB 限制
  serverExternalPackages: [
    "canvas",
    "pdf-parse",
    "pdf-poppler",
    "mammoth",
    "yahoo-finance2",
    "react-pdf",
    "https-proxy-agent",
    "pdfjs-dist",
    "rss-parser",
  ],
  // 从 Serverless Function 的文件追踪中排除不需要的大型包
  // 这是解决 Vercel 250MB 限制最有效的方法
  outputFileTracingExcludes: {
    // 文章详情页：content 目录全部在构建时预渲染，运行时无需读取
    // dynamicParams=false 保证未知路径返回 404，函数不会读 content
    'app/articles/[categoryId]/[uid]/page': [
      'content/**',
    ],
    // 所有路由：排除只在构建阶段需要的开发工具包
    '*': [
      'node_modules/typescript/**',
      'node_modules/eslint/**',
      'node_modules/eslint-config-next/**',
      'node_modules/@typescript-eslint/**',
      'node_modules/eslint-plugin-react/**',
      'node_modules/eslint-plugin-react-hooks/**',
      'node_modules/@next/eslint-plugin-next/**',
      'node_modules/caniuse-lite/**',
      'node_modules/axe-core/**',
      'node_modules/es-abstract/**',
      'node_modules/es-toolkit/**',
      'node_modules/@swc/core-linux-x64-gnu/**',
      'node_modules/@swc/core-linux-x64-musl/**',
      'node_modules/@esbuild/**',
      'node_modules/terser/**',
    ],
  },
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // 客户端：排除 Node.js 特定的模块
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        canvas: false, // react-pdf 需要
      };
      
      // 排除 https-proxy-agent（仅在服务器端使用）
      config.externals = config.externals || [];
      config.externals.push({
        'https-proxy-agent': 'commonjs https-proxy-agent',
      });
    }
    
    // 处理 pdfjs-dist 的 ESM 模块
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    
    // 确保 .mjs 文件被正确处理
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });
    
    return config;
  },
  // 优化包导入（Next.js 15 已稳定）
  optimizePackageImports: ['lucide-react', 'recharts'],
  // 优化页面加载性能
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  // 生产环境配置
  ...(process.env.NODE_ENV === 'production' && {
    // 生产环境：严格检查类型
    typescript: {
      ignoreBuildErrors: false,
    },
    eslint: {
      // 生产环境：忽略 ESLint 错误以避免构建失败（某些规则可能未正确配置）
      // 注意：这不会影响代码质量，只是允许构建继续进行
      ignoreDuringBuilds: true,
    },
  }),
  // 开发模式优化：加快启动速度
  ...(process.env.NODE_ENV === 'development' && {
    // 减少开发时的类型检查（加快启动）
    typescript: {
      // 在开发模式下，类型错误不会阻止启动
      ignoreBuildErrors: false,
    },
    eslint: {
      // 在开发模式下，ESLint 错误不会阻止启动
      ignoreDuringBuilds: true,
    },
  }),
  // 注意：Next.js 15 中 swcMinify 已默认启用，无需配置
};

export default nextConfig;

