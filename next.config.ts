import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 增加开发服务器的超时时间
  webpack: (config, { isServer }) => {
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
      };
      
      // 排除 https-proxy-agent（仅在服务器端使用）
      config.externals = config.externals || [];
      config.externals.push({
        'https-proxy-agent': 'commonjs https-proxy-agent',
      });
    }
    return config;
  },
  // 优化开发服务器性能
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  // 优化页面加载性能
  compress: true,
  poweredByHeader: false,
  // 生产环境配置
  ...(process.env.NODE_ENV === 'production' && {
    // 生产环境：严格检查类型和 ESLint
    typescript: {
      ignoreBuildErrors: false,
    },
    eslint: {
      ignoreDuringBuilds: false,
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

