import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Target, ArrowRight, Search, TrendingUp } from 'lucide-react';
import { SearchBox } from '@/components/search-box';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI使用场景 - 按业务场景发现AI工具',
  description: '根据不同的业务场景和需求，快速找到最适合的AI工具。涵盖写作、设计、编程、营销、办公等多个领域的AI应用方案。',
  keywords: 'AI使用场景,AI工具场景,AI应用方案,人工智能应用,AI业务场景,AI解决方案',
  openGraph: {
    title: 'AI使用场景 - 按业务场景发现AI工具',
    description: '根据不同的业务场景和需求，快速找到最适合的AI工具。',
    type: 'website',
  },
};

// 获取所有使用场景
async function getUseCases() {
  const useCases = await prisma.useCase.findMany({
    orderBy: { adoptionRate: 'desc' },
    include: {
      _count: {
        select: { tools: true },
      },
    },
  });

  // 为每个场景获取前几个工具的图标
  const useCasesWithTools = await Promise.all(
    useCases.map(async (useCase) => {
      const tools = await prisma.tool.findMany({
        where: {
          useCaseId: useCase.id,
          status: 1,
          imageUrl: { not: null },
        },
        take: 4,
        select: { imageUrl: true, name: true },
      });
      return { ...useCase, tools };
    })
  );

  return useCasesWithTools;
}

// 获取热门场景
async function getPopularUseCases() {
  const useCases = await prisma.useCase.findMany({
    orderBy: { adoptionRate: 'desc' },
    take: 6,
    include: {
      _count: {
        select: { tools: true },
      },
    },
  });

  // 为每个场景获取前几个工具的图标
  const useCasesWithTools = await Promise.all(
    useCases.map(async (useCase) => {
      const tools = await prisma.tool.findMany({
        where: {
          useCaseId: useCase.id,
          status: 1,
          imageUrl: { not: null },
        },
        take: 4,
        select: { imageUrl: true, name: true },
      });
      return { ...useCase, tools };
    })
  );

  return useCasesWithTools;
}

export default async function UseCasesPage() {
  const [useCases, popularUseCases] = await Promise.all([
    getUseCases().catch(() => []),
    getPopularUseCases().catch(() => []),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="relative gradient-hero pt-16 pb-20 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass shadow-glow mb-6">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              已收录 {useCases.length} 个使用场景
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            <span className="text-gradient">根据你的业务需求，快速找到合适的 AI 解决方案</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            按场景发现 AI 工具
          </p>

          {/* Search */}
          <SearchBox />
        </div>
      </section>

      {/* Popular Use Cases */}
      {popularUseCases.length > 0 && (
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary uppercase tracking-wider">
                  热门场景
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">最受欢迎的使用场景</h2>
              <p className="text-muted-foreground mt-2 text-lg">
                行业采用率最高的 AI 应用场景
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularUseCases.map((useCase) => (
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
        </section>
      )}

      {/* All Use Cases */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Search className="h-5 w-5 text-accent" />
              <span className="text-sm font-medium text-accent uppercase tracking-wider">
                全部场景
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">所有使用场景</h2>
            <p className="text-muted-foreground mt-2 text-lg">
              浏览全部 {useCases.length} 个 AI 应用场景
            </p>
          </div>
        </div>

        {useCases.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {useCases.map((useCase) => (
              <Link key={useCase.slug} href={`/functions/${useCase.slug}`}>
                <Card className="group hover:shadow-md transition-all border-border/50 hover:border-primary/30 h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                          {useCase.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex -space-x-1.5">
                            {useCase.tools && useCase.tools.length > 0 ? (
                              useCase.tools.slice(0, 3).map((tool: any, index: number) => (
                                <div
                                  key={index}
                                  className="w-5 h-5 rounded border border-background overflow-hidden bg-muted"
                                  style={{ zIndex: 3 - index }}
                                >
                                  {tool.imageUrl ? (
                                    <img
                                      src={tool.imageUrl}
                                      alt={tool.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold text-[8px]">
                                      {tool.name?.[0] || '?'}
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : null}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {useCase._count.tools} 个工具
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
            <p className="text-muted-foreground">暂无使用场景数据</p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="relative gradient-dark rounded-3xl p-10 md:p-16 text-center text-white overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              没找到合适的场景？
            </h2>
            <p className="text-white/70 max-w-xl mx-auto mb-10 text-lg">
              浏览全部 AI 工具，发现更多可能
            </p>
            <Link href="/tools">
              <Button
                size="lg"
                className="h-14 px-10 rounded-xl bg-white text-primary hover:bg-white/90 shadow-lg"
              >
                浏览全部工具
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
