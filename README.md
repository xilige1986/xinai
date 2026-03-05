# AI工具与课程聚合平台

基于 Next.js 15 + TypeScript + MySQL + Prisma 的AI工具导航与课程平台。

## 功能特性

### 前端功能
- 🏠 **首页** - 瀑布流展示AI工具，按业务职能分类
- 🔍 **工具详情** - 完整的工具介绍页面，SEO优化
- 📚 **课程模块** - 关联工具的付费课程展示
- 📝 **用户提交** - 前端工具提交表单（Zod验证）
- 🏢 **职能分类** - 按业务职能（销售、营销、技术等）分类浏览

### 后台功能
- 🔐 **管理员登录** - NextAuth.js credentials模式
- ✅ **工具审核** - 审核用户提交的工具
- 🛠️ **工具管理** - 增删改查AI工具
- 📖 **课程管理** - 管理付费课程
- 👥 **用户管理** - 管理员账号管理

### 技术特点
- ⚡ **Next.js 15** - App Router + SSR优化SEO
- 🎨 **Tailwind CSS + shadcn/ui** - 现代UI组件
- 🗄️ **Prisma ORM** - 类型安全的数据库操作
- 🔒 **NextAuth.js** - 安全的认证系统
- 📤 **本地图片存储** - 无需依赖外部CDN
- 🔍 **SEO优化** - 自动生成Meta标签和JSON-LD

## 技术栈

- **框架**: Next.js 15+
- **语言**: TypeScript
- **数据库**: MySQL 8.0
- **ORM**: Prisma
- **认证**: NextAuth.js
- **UI**: Tailwind CSS + shadcn/ui
- **验证**: Zod

## 目录结构

```
├── prisma/
│   └── schema.prisma       # 数据库模型定义
├── src/
│   ├── app/                # 页面路由 (App Router)
│   │   ├── api/            # API路由
│   │   ├── admin/          # 后台管理
│   │   ├── courses/        # 课程列表
│   │   ├── tool/[slug]/    # 工具详情页
│   │   ├── submit/         # 工具提交页
│   │   ├── layout.tsx      # 根布局
│   │   └── page.tsx        # 首页
│   ├── components/
│   │   ├── ui/             # shadcn组件
│   │   ├── tool-card.tsx   # 工具卡片组件
│   │   ├── course-card.tsx # 课程卡片组件
│   │   ├── business-function-section.tsx # 职能区块
│   │   ├── navbar.tsx      # 导航栏
│   │   └── footer.tsx      # 页脚
│   ├── lib/
│   │   ├── db.ts           # Prisma客户端
│   │   ├── upload.ts       # 文件上传
│   │   └── validations.ts  # Zod验证
│   └── types/
│       └── index.ts        # 类型定义
├── public/
│   └── uploads/            # 本地图片存储
├── .env                    # 环境变量
└── next.config.ts          # Next.js配置
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改：

```env
DATABASE_URL="mysql://username:password@localhost:3306/ai_tools_platform"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

### 3. 初始化数据库

```bash
# 推送数据库模型
npx prisma db push

# 生成Prisma客户端
npx prisma generate

# 可选：启动Prisma Studio查看数据
npx prisma studio
```

### 4. 创建管理员账号

在数据库中插入管理员用户：

```sql
INSERT INTO User (username, password, email, role)
VALUES (
  'admin',
  '$2a$10$YourHashedPasswordHere',  -- 使用bcrypt哈希
  'admin@example.com',
  'ADMIN'
);
```

或使用Node.js脚本生成密码：

```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('your-password', 10);
console.log(hash);
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 生产部署

### 构建

```bash
npm run build
```

### PM2 部署配置

创建 `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'ai-tools-platform',
    script: './node_modules/next/dist/bin/next',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

启动命令：

```bash
pm2 start ecosystem.config.js
```

### Nginx 反向代理配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态文件缓存
    location /_next/static {
        alias /path/to/your/project/.next/static;
        expires 365d;
        access_log off;
    }

    # 上传文件
    location /uploads {
        alias /path/to/your/project/public/uploads;
        expires 30d;
        access_log off;
    }
}
```

## 数据库模型

### BusinessFunction（业务职能）
- 客户服务与支持
- 销售
- 后勤
- 运营
- 增长与市场营销
- 写作与编辑
- 技术
- 设计与创意
- 工作流程自动化

### Tool（AI工具）
- 名称、Slug、描述
- 定价类型（免费/付费/免费增值）
- 状态（待审/发布/拒绝）
- 浏览量、点赞数

### Course（课程）
- 标题、描述、封面图
- 价格、购买链接
- 难度等级（入门/进阶）
- 关联工具（多对多）

## 组件说明

### ToolCard
AI工具卡片组件，展示工具基本信息、定价类型、浏览量和点赞数。

### CourseCard
课程卡片组件，展示课程封面、标题、价格、学习人数等信息。

### BusinessFunctionSection
业务职能区块组件，展示职能分类、采用率进度条和相关工具数量。

## 许可证

MIT License
