import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 输出独立模式，便于PM2部署
  output: 'standalone',

  // 图片优化配置（使用本地图片）
  images: {
    unoptimized: true,
  },

  // 压缩
  compress: true,

  // 禁用X-Powered-By头
  poweredByHeader: false,

  // 允许跨域
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
