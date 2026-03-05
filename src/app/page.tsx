import { prisma } from '@/lib/db';
import { ToolCard } from '@/components/tool-card';
import { CategorySection } from '@/components/category-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowRight, Sparkles, Zap, Bot, Cpu, Grid3X3 } from 'lucide-react';
import Link from 'next/link';

// 获取AI工具分类
async function getCategories() {
  return await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      subCategories: true,
      _count: {
        select: { tools: true },
      },
    },
  });
}

// 获取精选工具
async function getFeaturedTools() {
  return await prisma.tool.findMany({
    where: { status: 1 },
    orderBy: [{ likes: 'desc' }, { views: 'desc' }],
    take: 8,
    include: {
      category: true,
      subCategory: true,
      useCase: true,
    },
  });
}

// 获取最新工具
async function getLatestTools() {
  return await prisma.tool.findMany({
    where: { status: 1 },
    orderBy: { createdAt: 'desc' },
    take: 6,
    include: {
      category: true,
      subCategory: true,
      useCase: true,
    },
  });
}

export default async function HomePage() {
  const [categories, featuredTools, latestTools] = await Promise.all([
    getCategories().catch(() => []),
    getFeaturedTools().catch(() => []),
    getLatestTools().catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Section */}
      <section className="relative gradient-hero pt-20 pb-32 overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass shadow-glow mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">已收录 1000+ AI工具</span>
          </div>

          {/* 主标题 */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="text-foreground">发现最实用的</span>
            <br />
            <span className="text-gradient">AI 工具</span>
          </h1>

          {/* 副标题 */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            聚合全球优质AI工具，按功能分类，配套专业课程，
            <br className="hidden md:block" />
            助力个人与企业AI转型
          </p>

          {/* 搜索框 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="搜索AI工具..."
                className="w-full pl-12 h-14 rounded-xl border-input bg-white/80 backdrop-blur-sm shadow-sm"
              />
            </div>
            <Link href="/tools">
              <Button size="lg" className="h-14 px-8 rounded-xl gradient-primary hover:opacity-90 transition-opacity shadow-glow">
                <Bot className="mr-2 h-5 w-5" />
                浏览全部
              </Button>
            </Link>
          </div>

          {/* 快速标签 */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {['ChatGPT', 'Midjourney', 'Claude', 'Stable Diffusion', 'Copilot'].map((tag) => (
              <span
                key={tag}
                className="px-4 py-1.5 rounded-full bg-white/60 text-sm text-muted-foreground border border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section - AI工具分类 */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Grid3X3 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary uppercase tracking-wider">工具分类</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">
              按功能发现工具
            </h2>
            <p className="text-muted-foreground mt-2 text-lg">
              10大AI工具分类，50+细分功能，快速找到你需要的AI工具
            </p>
          </div>
          <Link href="/categories">
            <Button variant="outline" className="rounded-xl border-primary/20 hover:bg-primary/5">
              查看全部
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {categories.map((category) => (
            <CategorySection
              key={category.slug}
              name={category.name}
              slug={category.slug}
              description={category.description}
              icon={category.icon}
              toolCount={category._count.tools}
              subCategories={category.subCategories}
            />
          ))}
        </div>
      </section>

      {/* Featured Tools Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-accent" />
              <span className="text-sm font-medium text-accent uppercase tracking-wider">热门推荐</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">
              热门工具
            </h2>
            <p className="text-muted-foreground mt-2 text-lg">
              社区最受欢迎的AI工具精选
            </p>
          </div>
          <Link href="/tools">
            <Button variant="outline" className="rounded-xl border-primary/20 hover:bg-primary/5">
              查看全部
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        {featuredTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
            <p className="text-muted-foreground">暂无工具数据</p>
          </div>
        )}
      </section>

      {/* Latest Tools Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-green-500 uppercase tracking-wider">最新收录</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">
              新上架工具
            </h2>
            <p className="text-muted-foreground mt-2 text-lg">
              最近添加的AI工具
            </p>
          </div>
          <Link href="/tools?sort=latest">
            <Button variant="outline" className="rounded-xl border-primary/20 hover:bg-primary/5">
              查看全部
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        {latestTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
            <p className="text-muted-foreground">暂无工具数据</p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative gradient-dark rounded-3xl p-10 md:p-16 text-center text-white overflow-hidden">
          {/* 背景光效 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              有优质的AI工具想要分享？
            </h2>
            <p className="text-white/70 max-w-xl mx-auto mb-10 text-lg">
              提交您的AI工具，让更多人发现并使用。我们会在审核通过后尽快上架。
            </p>
            <Link href="/submit">
              <Button size="lg" className="h-14 px-10 rounded-xl bg-white text-primary hover:bg-white/90 shadow-lg">
                <Sparkles className="mr-2 h-5 w-5" />
                提交工具
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
