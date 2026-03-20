import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ToolCard } from '@/components/tool-card';
import { Target, ArrowLeft, ArrowRight, TrendingUp, Sparkles } from 'lucide-react';
import type { Metadata } from 'next';

interface UseCasePageProps {
  params: Promise<{ slug: string }>;
}

// 获取使用场景详情
async function getUseCase(slug: string) {
  const useCase = await prisma.useCase.findUnique({
    where: { slug },
    include: {
      _count: {
        select: { tools: true },
      },
    },
  });

  return useCase;
}

// 获取该场景下的工具
async function getToolsByUseCase(useCaseId: number) {
  return await prisma.tool.findMany({
    where: {
      status: 1,
      useCaseId,
    },
    orderBy: [{ sortOrder: 'desc' }, { likes: 'desc' }],
    include: {
      category: true,
      subCategory: true,
      useCase: true,
    },
  });
}

// 获取相关场景
async function getRelatedUseCases(currentUseCaseId: number) {
  return await prisma.useCase.findMany({
    where: {
      id: { not: currentUseCaseId },
    },
    orderBy: { adoptionRate: 'desc' },
    take: 6,
    include: {
      _count: {
        select: { tools: true },
      },
    },
  });
}

export async function generateMetadata({ params }: UseCasePageProps): Promise<Metadata> {
  const { slug } = await params;
  const useCase = await prisma.useCase.findUnique({
    where: { slug },
  });

  if (!useCase) {
    return { title: '场景未找到' };
  }

  return {
    title: `${useCase.name} - AI工具使用场景`,
    description: useCase.description || `探索适合${useCase.name}场景的最佳AI工具`,
    keywords: `${useCase.name}, AI工具, 使用场景, AI应用`,
  };
}

export default async function UseCaseDetailPage({ params }: UseCasePageProps) {
  const { slug } = await params;
  const useCase = await getUseCase(slug);

  if (!useCase) {
    notFound();
  }

  const [tools, relatedUseCases] = await Promise.all([
    getToolsByUseCase(useCase.id).catch(() => []),
    getRelatedUseCases(useCase.id).catch(() => []),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Breadcrumb & Top Bar */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            首页
          </Link>
          <ArrowRight className="h-4 w-4" />
          <Link href="/functions" className="hover:text-foreground transition-colors">
            使用场景
          </Link>
          <ArrowRight className="h-4 w-4" />
          <span className="text-foreground font-medium truncate">{useCase.name}</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative gradient-hero pt-12 pb-16 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass shadow-glow mb-6">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">使用场景</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">{useCase.name}</span>
            </h1>

            {/* Description */}
            <p className="text-lg text-muted-foreground mb-6">
              {useCase.description || '探索适合该场景的最佳AI工具'}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>{tools.length} 个工具</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">推荐工具</h2>
            <p className="text-muted-foreground mt-1">
              适合「{useCase.name}」场景的 {tools.length} 个 AI 工具
            </p>
          </div>
        </div>

        {tools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
            <p className="text-muted-foreground mb-4">该场景暂无工具</p>
            <Link href="/tools">
              <Button variant="outline">
                浏览全部工具
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* Related Use Cases */}
      {relatedUseCases.length > 0 && (
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">相关场景</h2>
              <p className="text-muted-foreground mt-1">
                探索更多 AI 使用场景
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedUseCases.map((relatedCase) => (
              <Link key={relatedCase.slug} href={`/functions/${relatedCase.slug}`}>
                <Card className="group hover:shadow-md transition-all border-border/50 hover:border-primary/30 h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                          {relatedCase.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {relatedCase._count.tools} 个工具 · {Math.round(relatedCase.adoptionRate * 100)}% 采用率
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Back Button */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <Link href="/functions">
          <Button variant="outline" className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回场景列表
          </Button>
        </Link>
      </section>
    </div>
  );
}
