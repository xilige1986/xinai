import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { ToolCard } from '@/components/tool-card';
import { CourseCard } from '@/components/course-card';
import { SearchBox } from '@/components/search-box';
import { FeaturedToolsSection } from '@/components/featured-tools-section';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight,
  Sparkles,
  Target,
  Heart,
  BookOpen,
  ChevronRight,
  Star,
  Bookmark,
} from 'lucide-react';
import Link from 'next/link';

// 获取AI工具分类
async function getCategories() {
  return await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      subCategories: true,
    },
  });
}

// 获取使用场景：一次查场景、一次批量查工具图标，避免 N+1
async function getUseCases() {
  const useCases = await prisma.useCase.findMany({
    orderBy: { adoptionRate: 'desc' },
    take: 8,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      adoptionRate: true,
      _count: { select: { tools: true } },
    },
  });
  if (useCases.length === 0) return [];

  const useCaseIds = useCases.map((uc) => uc.id);
  const tools = await prisma.tool.findMany({
    where: {
      useCaseId: { in: useCaseIds },
      status: 1,
      imageUrl: { not: null },
    },
    orderBy: [{ useCaseId: 'asc' }, { likes: 'desc' }],
    select: { imageUrl: true, name: true, useCaseId: true },
  });
  const toolsByUseCaseId = new Map<number, { imageUrl: string | null; name: string }[]>();
  for (const t of tools) {
    let list = toolsByUseCaseId.get(t.useCaseId);
    if (!list) {
      list = [];
      toolsByUseCaseId.set(t.useCaseId, list);
    }
    if (list.length < 4) list.push({ imageUrl: t.imageUrl, name: t.name });
  }

  return useCases.map((uc) => ({
    ...uc,
    tools: toolsByUseCaseId.get(uc.id) ?? [],
  }));
}

// 获取热门工具（按推荐排序）
async function getFeaturedTools() {
  return await prisma.tool.findMany({
    where: { status: 1 },
    orderBy: { sortOrder: 'desc' },
    take: 29,
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

// 获取课程
async function getCourses() {
  return await prisma.course.findMany({
    where: { status: 1 },
    orderBy: { studentCount: 'desc' },
    take: 4,
    include: {
      tools: {
        select: { id: true, name: true },
        take: 3,
      },
    },
  });
}

// 获取快捷入口
async function getQuickLinks() {
  return await prisma.quickLink.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    take: 10,
  });
}
async function getUserFavorites(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      favorites: {
        where: { status: 1 },
        take: 6,
        include: {
          category: true,
          subCategory: true,
          useCase: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  return user?.favorites || [];
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? parseInt(session.user.id) : null;

  const [categories, useCases, featuredTools, latestTools, courses, userFavorites, quickLinks] =
    await Promise.all([
      getCategories().catch(() => []),
      getUseCases().catch(() => []),
      getFeaturedTools().catch(() => []),
      getLatestTools().catch(() => []),
      getCourses().catch(() => []),
      userId ? getUserFavorites(userId).catch(() => []) : Promise.resolve([]),
      getQuickLinks().catch(() => []),
    ]);

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Section */}
      <section className="relative gradient-hero pt-16 pb-20 overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* 主标题 */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            <span className="text-gradient">助推业务增长：你想找的AI工具，都在这里</span>
          </h1>

          {/* 搜索框 */}
          <SearchBox />

          {/* 用户收藏列表 - 仅在登录且有收藏时显示 */}
          {session?.user && userFavorites.length > 0 && (
            <div className="mt-10 max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                  <h3 className="font-semibold text-lg">我的收藏</h3>
                </div>
                <Link href="/dashboard/favorites">
                  <Button variant="ghost" size="sm" className="text-primary">
                    查看全部
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap justify-center gap-x-8 gap-y-6">
                {userFavorites.map((tool) => (
                  <a
                    key={tool.id}
                    href={`${tool.websiteUrl}${tool.websiteUrl.includes('?') ? '&' : '?'}utm_source=okrvv`}
                    target="_blank"
                    rel="noopener nofollow"
                    className="flex flex-col items-center gap-2 w-[70px] group"
                  >
                    <div className="w-[70px] h-[70px] rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                      {tool.imageUrl ? (
                        <img
                          src={tool.imageUrl}
                          alt={tool.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold text-2xl">
                          {tool.name[0]}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-center text-muted-foreground group-hover:text-primary transition-colors line-clamp-1 w-full">
                      {tool.name}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 快捷入口标签 */}
          {quickLinks.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {quickLinks.map((tag) => (
                <a
                  key={tag.id}
                  href={tag.href}
                  target="_blank"
                  rel="nofollow"
                  className="px-4 py-1.5 rounded-full bg-card/60 text-sm text-muted-foreground border border-border/50 hover:border-primary/30 hover:bg-card transition-colors cursor-pointer"
                >
                  {tag.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 热门工具 Section */}
      <FeaturedToolsSection tools={featuredTools} categories={categories} />

      {/* 按场景发现工具 Section */}
      <section className="bg-gradient-to-b from-muted/30 to-background py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary uppercase tracking-wider">
                  场景推荐
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">按场景发现工具</h2>
              <p className="text-muted-foreground mt-2 text-lg">
                根据你的业务需求，快速找到合适的AI解决方案
              </p>
            </div>
            <Link href="/functions">
              <Button
                variant="outline"
                className="rounded-xl border-primary/20 hover:bg-primary/5"
              >
                查看全部
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {useCases.map((useCase) => (
              <Link key={useCase.slug} href={`/functions/${useCase.slug}`}>
                <Card className="group hover:shadow-lg transition-all border-border/50 hover:border-primary/30 h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Target className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        {useCase._count.tools} 个工具
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                      {useCase.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {useCase.description || '探索适合该场景的最佳AI工具'}
                    </p>
                    {/* 工具图标叠加 */}
                    <div className="mt-4 flex items-center">
                      <div className="flex -space-x-2">
                        {useCase.tools && useCase.tools.length > 0 ? (
                          useCase.tools.slice(0, 4).map((tool: any, index: number) => (
                            <div
                              key={index}
                              className="w-8 h-8 rounded-lg border-2 border-background overflow-hidden bg-muted shadow-sm"
                              style={{ zIndex: 4 - index }}
                            >
                              {tool.imageUrl ? (
                                <img
                                  src={tool.imageUrl}
                                  alt={tool.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold text-xs">
                                  {tool.name?.[0] || '?'}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">暂无工具</span>
                        )}
                      </div>
                      {useCase._count.tools > 4 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          +{useCase._count.tools - 4}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 课程 Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-blue-500 uppercase tracking-wider">
                专业课程
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">AI技能课程</h2>
            <p className="text-muted-foreground mt-2 text-lg">
              系统化学习，从入门到精通掌握AI工具
            </p>
          </div>
          <Link href="/courses">
            <Button
              variant="outline"
              className="rounded-xl border-primary/20 hover:bg-primary/5"
            >
              查看全部
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} showTools />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
            <p className="text-muted-foreground">暂无课程数据</p>
          </div>
        )}
      </section>

      {/* 最新上架工具 Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-green-500 uppercase tracking-wider">
                新鲜上架
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">最新上架工具</h2>
            <p className="text-muted-foreground mt-2 text-lg">
              探索最新收录的前沿AI工具
            </p>
          </div>
          <Link href="/tools?sort=latest">
            <Button
              variant="outline"
              className="rounded-xl border-primary/20 hover:bg-primary/5"
            >
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
              发现优秀的AI工具？
            </h2>
            <p className="text-white/70 max-w-xl mx-auto mb-10 text-lg">
              提交你发现的优质AI工具，帮助更多人发现并使用。
              审核通过后将在平台展示。
            </p>
            <Link href="/submit">
              <Button
                size="lg"
                className="h-14 px-10 rounded-xl bg-white text-primary hover:bg-white/90 shadow-lg"
              >
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
