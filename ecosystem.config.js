module.exports = {
  apps: [
    {
      name: 'ai-tools-platform',
      // standalone 模式下，启动文件在 .next/standalone 目录
      script: './.next/standalone/server.js',
      cwd: '/home/www/ai-tools-platform',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // 日志配置
      log_file: '/home/www/ai-tools-platform/logs/combined.log',
      out_file: '/home/www/ai-tools-platform/logs/out.log',
      error_file: '/home/www/ai-tools-platform/logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // 内存限制自动重启
      max_memory_restart: '1G',
      // 异常自动重启
      autorestart: true,
      // 开机自启
      pmx: false,
      // 监听文件变化（生产环境建议关闭）
      watch: false,
      // 最大重启次数
      max_restarts: 10,
      // 最小运行时间
      min_uptime: '10s',
    },
  ],
};
