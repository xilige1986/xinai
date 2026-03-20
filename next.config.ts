import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 建议修复完所有 TS/编码问题后改为 false，保证生产构建通过类型检查
  typescript: {
    ignoreBuildErrors: true,
  },

  // React 配置
  reactStrictMode: false, // 禁用严格模式，减少 double-render

  // 输出独立模式，便于PM2部署（仅生产环境使用）
  output: 'standalone',

  // 静态资源前缀（使用相对路径，适配域名）
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,

  // 图片优化配置（使用本地图片）
  images: {
    unoptimized: true,
  },

  // 压缩
  compress: true,

  // 禁用X-Powered-By头
  poweredByHeader: false,

  // Webpack 配置：排除支付相关模块，让它们作为外部依赖
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('wechatpay-node-v3', 'alipay-sdk', 'formidable');
    }
    return config;
  },

  // URL重写：支持 .html 后缀
  async rewrites() {
    return [
      {
        source: '/news/:slug*.html',
        destination: '/news/:slug*',
      },
      {
        source: '/tools/:slug*.html',
        destination: '/tool/:slug*',
      },
      {
        source: '/courses/:slug*.html',
        destination: '/courses/:slug*',
      },
    ];
  },

  // 允许跨域：生产环境使用 ALLOWED_ORIGINS 白名单（单域名或逗号分隔取第一个），未设置时开发用 *，生产建议设置
  async headers() {
    const raw = process.env.ALLOWED_ORIGINS?.trim();
    const firstOrigin = raw?.split(',')[0]?.trim();
    const originValue =
      firstOrigin || (process.env.NODE_ENV === 'production' ? '' : undefined) || '*';
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: originValue },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
