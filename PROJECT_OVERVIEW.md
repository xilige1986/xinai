# AI工具与课程聚合平台 - 项目概况

> **演示地址**: https://www.okrvv.cn
> **项目定位**: AI工具集与课程，资讯聚合平台加会员积分推广体系

---

## 一、项目概述

基于 **Next.js 16 + TypeScript + MySQL + Prisma** 构建的AI工具导航与课程聚合平台，提供AI工具的分类浏览、搜索、点评，以及付费课程的购买和学习功能。

### 核心功能
- 🏠 **首页** - 首页: 收藏自定义区、工具推荐区，按场景发现、快捷入口、推荐课程
- 🔍 **工具详情** - SEO优化的完整工具介绍页面，支持AI生成内容
- 📚 **课程模块** - 关联工具的付费课程展示与购买
- 📝 **用户提交** - 前端工具提交表单（Zod验证）
- 🏢 **职能分类** - 按业务场景分类浏览
- 💰 **支付系统** - 支持支付宝和微信支付
- 📧 **邮件订阅** - 定时自动推送AI资讯

---

## 二、技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| **框架** | Next.js | 16.1.6 |
| **语言** | TypeScript | 5.9.3 |
| **React** | React / React DOM | 19.2.3 |
| **样式** | Tailwind CSS | v4 |
| **UI组件** | shadcn/ui + Radix UI | - |
| **数据库** | MySQL | 8.0 |
| **ORM** | Prisma | 5.22.0 |
| **认证** | NextAuth.js | 4.24.13 |
| **支付** | 支付宝 SDK + 微信支付 | - |
| **邮件** | Resend | 6.9.3 |
| **图标** | Lucide React | - |
| **部署** | PM2 + Nginx | - |

---

## 三、项目结构

```
├── prisma/
│   ├── schema.prisma          # 数据库模型定义（26个表）
│   └── seed.ts                # 数据库种子数据
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/              # API路由（按模块组织）
│   │   │   ├── admin/        # 后台管理API
│   │   │   ├── auth/         # 认证相关API
│   │   │   ├── courses/      # 课程相关API
│   │   │   ├── news/         # 资讯相关API
│   │   │   ├── pay/          # 支付相关API
│   │   │   ├── tools/        # 工具相关API
│   │   │   └── user/         # 用户相关API
│   │   ├── admin/            # 后台管理页面
│   │   ├── courses/          # 课程列表/详情/购买
│   │   ├── dashboard/        # 用户中心（收藏、点评、积分等）
│   │   ├── learn/            # 课程学习页面
│   │   ├── news/             # 资讯页面
│   │   ├── tool/[slug]/      # 工具详情页
│   │   ├── tools/            # 工具列表页
│   │   ├── functions/        # 使用场景页
│   │   ├── login/            # 登录页
│   │   ├── register/         # 注册页
│   │   ├── submit/           # 工具提交页
│   │   ├── page.tsx          # 首页
│   │   ├── layout.tsx        # 根布局
│   │   └── globals.css       # 全局样式
│   ├── components/           # React组件
│   │   ├── ui/              # shadcn/ui组件
│   │   ├── tool-card.tsx    # 工具卡片
│   │   ├── course-card.tsx  # 课程卡片
│   │   ├── navbar.tsx       # 导航栏
│   │   ├── footer.tsx       # 页脚
│   │   └── ...
│   ├── lib/                  # 工具库
│   │   ├── db.ts            # Prisma客户端
│   │   ├── auth.ts          # NextAuth配置
│   │   ├── site-settings.ts # 网站设置
│   │   ├── upload.ts        # 文件上传
│   │   ├── validations.ts   # Zod验证
│   │   ├── payment/         # 支付相关
│   │   └── ...
│   └── types/               # TypeScript类型定义
├── public/
│   └── uploads/             # 本地图片存储
├── docs/                    # 项目文档
├── scripts/                 # 脚本文件
├── .env                     # 环境变量
├── next.config.ts           # Next.js配置
└── package.json
```

---

## 四、数据库模型

共 **26个数据表**，核心模型关系如下：

### 核心实体

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Category     │────▶│  SubCategory    │────▶│      Tool       │
│   (一级分类)     │     │   (二级分类)     │     │    (AI工具)     │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                              ┌─────────────────────────┼─────────────────────────┐
                              │                         │                         │
                              ▼                         ▼                         ▼
                    ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
                    │     Course      │      │     Review      │      │  ToolAIContent  │
                    │    (课程)       │      │    (点评)       │      │ (AI生成内容)    │
                    └─────────────────┘      └─────────────────┘      └─────────────────┘
                           │
                           ▼
                    ┌─────────────────┐      ┌─────────────────┐
                    │     Chapter     │────▶│     Lesson      │
                    │    (课程章节)    │     │    (课时)       │
                    └─────────────────┘      └─────────────────┘
```

### 用户相关

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      User       │────▶│     Order       │     │  LessonProgress │
│    (用户)       │     │    (订单)       │     │  (学习进度)     │
└────────┬────────┘     └─────────────────┘     └─────────────────┘
         │
         ├────────────────────────────────────────────────────────┐
         │                         │                             │
         ▼                         ▼                             ▼
┌─────────────────┐     ┌─────────────────┐      ┌─────────────────┐
│  PointsLog      │     │ ReferralRecord  │      │ FounderEarning  │
│  (积分记录)     │     │  (推广记录)     │      │  (创始股东收益) │
└─────────────────┘     └─────────────────┘      └─────────────────┘
```

### 内容相关

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      News       │────▶│    Comment      │     │NewsletterSubscriber│
│    (资讯)       │     │    (评论)       │     │  (邮件订阅)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 完整模型列表

| # | 模型名 | 说明 |
|---|--------|------|
| 1 | Category | AI工具一级分类 |
| 2 | SubCategory | AI工具二级分类 |
| 3 | UseCase | 使用场景/业务职能 |
| 4 | Tool | AI工具 |
| 5 | Course | 付费课程 |
| 6 | CoursePointsAccess | 课程积分解锁记录 |
| 7 | User | 用户 |
| 8 | FounderEarning | 创始股东收益 |
| 9 | FounderContribution | 创始股东贡献记录 |
| 10 | QuickLink | 首页快捷入口 |
| 11 | Review | 工具评分和点评 |
| 12 | SiteSetting | 网站设置 |
| 13 | News | 资讯文章 |
| 14 | Comment | 资讯评论 |
| 15 | NewsletterSubscriber | 邮件订阅 |
| 16 | NewsletterSchedule | 自动推送配置 |
| 17 | NewsletterHistory | 推送历史记录 |
| 18 | Chapter | 课程章节 |
| 19 | Lesson | 课时 |
| 20 | LessonProgress | 学习进度 |
| 21 | Order | 订单 |
| 22 | ReferralRecord | 推广记录 |
| 23 | MultiLevelReferralRecord | 多级推广记录 |
| 24 | PointsLog | 积分记录 |
| 25 | VerificationCode | 验证码 |
| 26 | ToolAIContent | AI生成的工具介绍 |

---

## 五、功能模块详解

### 1. 前台功能

#### 首页 (`/`)
- Hero区域：搜索框 + 快捷入口
- 我的收藏（登录用户）
- 热门工具瀑布流展示
- 按场景发现工具
- AI技能课程推荐
- 最新上架工具

#### 工具详情 (`/tool/[slug]`)
- 工具信息展示（名称、描述、定价）
- 浏览量、收藏数、评分统计
- AI生成的内容介绍（优先显示）
- 相关课程推荐
- 相似工具推荐
- 用户点评（懒加载）
- JSON-LD结构化数据（SEO）

#### 课程模块 (`/courses`)
- 课程列表展示
- 课程详情页
- 购买页面（支持现金/积分）
- 课程学习页面（章节/课时）
- 学习进度跟踪

#### 用户中心 (`/dashboard`)
- 我的收藏
- 我的点评
- 我的贡献
- 推广中心（推荐码、收益统计）
- 积分记录
- 收益中心（创始股东）

### 2. 后台功能 (`/admin`)

#### 仪表盘
- 数据统计卡片（工具数、用户数、订单数等）
- 待审核工具列表
- 待审核资讯/评论/点评

#### 工具管理
- 工具列表/新增/编辑
- 工具审核（通过/拒绝）
- AI内容生成

#### 课程管理
- 课程列表/新增/编辑
- 章节管理
- 课时管理

#### 分类管理
- 一级分类管理
- 二级分类管理
- 使用场景管理
- 快捷入口管理

#### 用户管理
- 用户列表
- 会员等级管理
- 积分管理
- 推广关系查看

#### 内容管理
- 资讯管理
- 评论审核
- 点评审核
- 赞助商管理

#### 邮件系统
- 手动发送邮件
- 定时自动推送配置
- 推送历史查看

#### 系统设置
- 网站基础设置
- 支付配置
- 管理员密码修改

---

## 六、会员体系

| 等级 | 标识 | 权限 |
|------|------|------|
| **普通会员** | MEMBER | 基础功能、收藏工具、提交工具 |
| **VIP会员** | VIP | 免费学习付费课程 |
| **创始股东** | FOUNDER | 平台收益分成、专属权益 |

### 推广机制
- 三级推荐制度
- 推荐注册获得积分
- 下级消费获得分成（创始股东）

---

## 七、SEO优化

1. **SSR服务端渲染** - Next.js App Router
2. **动态Meta标签** - 每个页面独立设置
3. **结构化数据** - JSON-LD (SoftwareApplication)
4. **URL优化** - 支持 `.html` 后缀
5. **全文搜索** - MySQL全文索引
6. **站点地图** - 自动生成

---

## 八、部署配置

### Next.js 配置 (`next.config.ts`)

```typescript
const nextConfig = {
  // 独立输出模式（PM2部署）
  output: 'standalone',

  // 图片使用本地存储
  images: {
    unoptimized: true,
  },

  // URL重写
  rewrites: [
    { source: '/news/:slug*.html', destination: '/news/:slug*' },
    { source: '/tools/:slug*.html', destination: '/tool/:slug*' },
  ],

  // CORS配置
  headers: [...],
}
```

### PM2 配置 (`ecosystem.config.js`)

```javascript
module.exports = {
  apps: [{
    name: 'ai-tools-platform',
    script: './node_modules/next/dist/bin/next',
    args: 'start',
    instances: 1,
    autorestart: true,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

### Nginx 配置

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
        proxy_cache_bypass $http_upgrade;
    }

    # 静态文件缓存
    location /_next/static {
        alias /path/to/project/.next/static;
        expires 365d;
    }

    # 上传文件
    location /uploads {
        alias /path/to/project/public/uploads;
        expires 30d;
    }
}
```

---

## 九、环境变量

```env
# 数据库
DATABASE_URL="mysql://user:password@localhost:3306/ai_tools_platform"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# 支付配置
ALIPAY_APP_ID=""
ALIPAY_PRIVATE_KEY=""
ALIPAY_PUBLIC_KEY=""
WECHAT_PAY_MCH_ID=""
WECHAT_PAY_API_V3_KEY=""

# 邮件
RESEND_API_KEY=""
NEWSLETTER_FROM_EMAIL=""

# 其他
ALLOWED_ORIGINS="https://www.okrvv.cn"
```

---

## 十、开发命令

```bash
# 开发
npm run dev              # 启动开发服务器

# 数据库
npm run db:generate      # 生成Prisma客户端
npm run db:push          # 推送数据库模型
npm run db:studio        # 启动Prisma Studio
npm run db:seed          # 导入种子数据

# 构建
npm run build            # 生产构建
npm run start            # 启动生产服务器

# 代码检查
npm run lint             # ESLint检查
```

---

## 十一、特色功能

### 1. AI内容生成
- 自动为工具生成详细介绍
- 使用 DeepSeek API
- 支持手动重新生成
- 成本追踪

### 2. 智能推荐
- 相似工具推荐（基于分类）
- 相关课程推荐
- 使用场景匹配

### 3. 学习系统
- 视频/文字课时
- 学习进度跟踪
- 免费试学章节
- 积分解锁课程

### 4. 推广系统
- 多级推荐机制
- 自动计算推广收益
- 推广数据统计

### 5. 邮件营销
- 定时自动推送
- 邮件模板定制
- 订阅管理
- 发送统计

---

## 十二、开源许可

**MIT License**

---

*文档生成时间: 2026-03-17*
*项目版本: 0.1.0*
