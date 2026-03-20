#!/bin/bash

echo "开始部署更新..."

# 1. 拉取最新代码
git pull

# 2. 安装依赖并生成 Prisma Client
npm install
npx prisma generate

# 3. 数据库迁移
npx prisma migrate deploy

# 4. 编译构建
npm run build

# 5. Standalone 静态资源处理
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/

# 6. 重启服务
pm2 restart ai-nav

echo "部署完成！"