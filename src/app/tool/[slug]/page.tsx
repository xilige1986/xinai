import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { cache } from 'react';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CourseCard } from '@/components/course-card';
import { FavoriteButton } from '@/components/favorite-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MarkdownContent from '@/components/markdown-content';
import { ShareButton } from '@/components/share-button';
import {
  ArrowLeft,
  ExternalLink,
  Eye,
  Heart,
  Calendar,
  Folder,
  Layers,
  Target,
  ChevronRight,
  Globe,
  Bookmark,
  Link2,
  CheckCircle2,
  Sparkles,
  Users,
  Star,
  Clock,
  BookOpen,
} from 'lucide-react';
import { pricingTypeStyles } from '@/types';
import type { Metadata } from 'next';

import { LazyReviewsSection } from './lazy-reviews';

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

// 使用 React.cache 缓存数据请求，避免重复查询
const getTool = cache(async (slug: string) => {
  const tool = await prisma.tool.findUnique({
    where: { slug, status: 1 },
    include: {
      category: true,
      subCategory: true,
      useCase: true,
      courses: true,
      favoritedBy: {
        select: { id: true },
      },
      aiContent: true,
    },
  });

  if (!tool) return null;

  // 异步更新浏览量，不阻塞响应
  prisma.tool.update({
    where: { id: tool.id },
    data: { views: { increment: 1 } },
  }).catch(err => console.error('Failed to update views:', err));

  return tool;
});

// 缓存相关工具查询
const getRelatedTools = cache(async (currentToolId: number, categoryId: number) => {
  return await prisma.tool.findMany({
    where: {
      status: 1,
      id: { not: currentToolId },
      categoryId,
    },
    take: 6,
    orderBy: [{ likes: 'desc' }, { views: 'desc' }],
    include: {
      category: true,
    },
  });
});

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getTool(slug);

  if (!tool) {
    return { title: '工具未找到' };
  }

  return {
    title: `${tool.name} - ${tool.shortDesc}`,
    description: tool.description.slice(0, 160),
    keywords: `${tool.name}, AI工具, ${tool.category?.name}, ${tool.useCase?.name}, ${tool.pricingType}`,
    openGraph: {
      title: tool.name,
      description: tool.shortDesc,
      type: 'article',
      images: tool.imageUrl ? [tool.imageUrl] : undefined,
    },
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = await getTool(slug);

  if (!tool) {
    notFound();
  }

  const pricingStyle = pricingTypeStyles[tool.pricingType] || pricingTypeStyles.Free;
  const relatedTools = await getRelatedTools(tool.id, tool.categoryId);

  // JSON-LD 结构化数据
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.description,
    applicationCategory: 'AIApplication',
    offers: {
      '@type': 'Offer',
      price: tool.pricingType === 'Free' ? '0' : undefined,
      priceCurrency: 'CNY',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: tool.ratingCount > 0 ? (tool.ratingSum / tool.ratingCount).toFixed(1) : '0',
      ratingCount: tool.ratingCount.toString(),
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb & Top Bar */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            首页
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/tools" className="hover:text-foreground transition-colors">
            AI工具
          </Link>
          {tool.category && (
            <>
              <ChevronRight className="h-4 w-4" />
              <Link
                href={`/tools/category/${tool.category.slug}`}
                className="hover:text-foreground transition-colors"
              >
                {tool.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium truncate">{tool.name}</span>
        </div>
      </div>

      {/* Hero Section - Tool Header */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Tool Image */}
            <div className="shrink-0">
              <div className="relative">
                {tool.imageUrl ? (
                  <Image
                    src={tool.imageUrl}
                    alt={tool.name}
                    width={160}
                    height={160}
                    className="w-32 h-32 lg:w-40 lg:h-40 rounded-2xl object-cover border-2 border-border/50 shadow-lg"
                    priority={false}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl font-bold text-white shadow-lg">
                    {tool.name[0]}
                  </div>
                )}
                {/* Verification Badge */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>

            {/* Right: Tool Info */}
            <div className="flex-1 min-w-0">
              {/* Tags Row */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge className={`${pricingStyle.className} text-sm font-medium px-3 py-1`}>
                  {pricingStyle.label}
                </Badge>
                {tool.subCategory && (
                  <Badge variant="secondary" className="text-sm">
                    {tool.subCategory.name}
                  </Badge>
                )}
                {tool.useCase && (
                  <Badge variant="outline" className="text-sm">
                    <Target className="h-3 w-3 mr-1" />
                    {tool.useCase.name}
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl lg:text-4xl font-bold mb-3">{tool.name}</h1>

              {/* Short Description */}
              <p className="text-lg text-muted-foreground leading-relaxed mb-4 max-w-3xl">
                {tool.shortDesc}
              </p>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>{tool.views.toLocaleString()} 浏览</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4" />
                  <span>{tool.favoritedBy.length} 收藏</span>
                </div>
                {tool.ratingCount > 0 && (
                  <a href="#reviews" className="flex items-center gap-2 hover:text-primary transition-colors">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span>
                      {(tool.ratingSum / tool.ratingCount).toFixed(1)} 分
                      ({tool.ratingCount} 点评)
                    </span>
                  </a>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(tool.createdAt).toLocaleDateString('zh-CN')} 收录</span>
                </div>
                {tool.category && (
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    <Link href={`/tools/category/${tool.category.slug}`} className="hover:text-primary transition-colors">
                      {tool.category.name}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* CTA Buttons - Desktop */}
            <div className="hidden lg:flex flex-col gap-3 shrink-0 w-48">
              <a href={tool.websiteUrl} target="_blank" rel="noopener nofollow">
                <Button className="w-full h-12 text-base gradient-primary hover:opacity-90 shadow-glow" size="lg">
                  <Globe className="mr-2 h-5 w-5" />
                  访问官网
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <FavoriteButton toolId={tool.id} />
              <ShareButton title={tool.name} variant="outline" className="w-full border-border hover:bg-muted" />
            </div>
          </div>

          {/* CTA Buttons - Mobile */}
          <div className="flex lg:hidden flex-col gap-3 mt-6">
            <a href={tool.websiteUrl} target="_blank" rel="noopener nofollow">
              <Button className="w-full h-12 text-base gradient-primary hover:opacity-90" size="lg">
                <Globe className="mr-2 h-5 w-5" />
                访问官网
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <div className="flex gap-3">
              <FavoriteButton toolId={tool.id} />
              <ShareButton
                title={tool.name}
                variant="outline"
                className="flex-1 border-border"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-border/50 hover:border-primary/20 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Layers className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">子分类</p>
                      <p className="font-medium">{tool.subCategory?.name || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 hover:border-primary/20 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <Target className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">使用场景</p>
                      <p className="font-medium">{tool.useCase?.name || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 hover:border-primary/20 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">定价模式</p>
                      <p className="font-medium">{pricingStyle.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Content Tabs - 只保留工具介绍和相关课程 */}
            <Tabs defaultValue="intro" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                <TabsTrigger
                  value="intro"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
                >
                  工具介绍
                </TabsTrigger>
                {tool.courses && tool.courses.length > 0 && (
                  <TabsTrigger
                    value="courses"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
                  >
                    相关课程
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="intro" className="mt-6">
                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    {/* 优先显示AI生成的内容 */}
                    {tool.aiContent?.content ? (
                      <>
                        <MarkdownContent content={tool.aiContent.content} />
                        {/* AI生成标记 */}
                        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground border-t pt-4">
                          <Sparkles className="h-3 w-3 text-primary" />
                          <span>内容由 AI 辅助生成</span>
                          {tool.aiContent.updatedAt && (
                            <span className="text-muted-foreground/60">
                              · 更新于{' '}
                              {new Date(tool.aiContent.updatedAt).toLocaleDateString('zh-CN')}
                            </span>
                          )}
                          {tool.aiContent.modelName && (
                            <span className="text-muted-foreground/60">
                              · {tool.aiContent.modelName}
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      /* 没有AI内容时显示原描述 */
                      <MarkdownContent content={tool.description} />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {tool.courses && tool.courses.length > 0 && (
                <TabsContent value="courses" className="mt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {tool.courses.map((course) => (
                      <CourseCard key={course.id} course={course} />
                    ))}
                  </div>
                </TabsContent>
              )}
            </Tabs>

            {/* 用户点评 - 延迟加载避免阻塞主线程 */}
            <div id="reviews" className="mt-8 scroll-mt-24">
              <LazyReviewsSection toolId={tool.id} />
            </div>

            {/* Related Tools */}
            {relatedTools.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-primary" />
                  相似工具推荐
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {relatedTools.map((relatedTool) => (
                    <Link
                      key={relatedTool.id}
                      href={`/tool/${relatedTool.slug}`}
                      className="group"
                    >
                      <Card className="border-border/50 hover:border-primary/30 transition-all hover:shadow-md h-full">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted shrink-0">
                              {relatedTool.imageUrl ? (
                                <img
                                  src={relatedTool.imageUrl}
                                  alt={relatedTool.name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold text-lg">
                                  {relatedTool.name[0]}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1">
                                {relatedTool.name}
                              </h4>
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                {relatedTool.shortDesc}
                              </p>
                              <Badge variant="outline" className="text-xs mt-2 px-1.5 py-0">
                                {pricingTypeStyles[relatedTool.pricingType]?.label || relatedTool.pricingType}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">数据概览</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm">总浏览</span>
                  </div>
                  <span className="font-semibold">{tool.views.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Bookmark className="h-4 w-4" />
                    <span className="text-sm">收藏数</span>
                  </div>
                  <span className="font-semibold">{tool.favoritedBy.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm">评分</span>
                  </div>
                  <span className="font-semibold">
                    {tool.ratingCount > 0 ? `${(tool.ratingSum / tool.ratingCount).toFixed(1)} (${tool.ratingCount})` : '暂无'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">收录时间</span>
                  </div>
                  <span className="font-semibold">{new Date(tool.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">分类信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tool.category && (
                  <Link
                    href={`/tools/category/${tool.category.slug}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                  >
                    <Folder className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">主分类</p>
                      <p className="font-medium group-hover:text-primary transition-colors">{tool.category.name}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                )}
                {tool.subCategory && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Layers className="h-5 w-5 text-accent" />
                    <div>
                      <p className="text-xs text-muted-foreground">子分类</p>
                      <p className="font-medium">{tool.subCategory.name}</p>
                    </div>
                  </div>
                )}
                {tool.useCase && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Target className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">使用场景</p>
                      <p className="font-medium">{tool.useCase.name}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Courses */}
            {tool.courses && tool.courses.length > 0 && (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    相关课程
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tool.courses.slice(0, 3).map((course) => (
                      <Link
                        key={course.id}
                        href={`/courses/${course.slug}`}
                        className="flex gap-3 group"
                      >
                        <div className="w-20 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                          {course.coverImage ? (
                            <img
                              src={course.coverImage}
                              alt={course.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                            {course.title}
                          </h4>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-muted-foreground">
                              {course.studentCount} 人学习
                            </span>
                            <span className="text-sm font-semibold text-primary">
                              ¥{course.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {tool.courses.length > 3 && (
                    <Link href={`/tools/${tool.slug}?tab=courses`}>
                      <Button variant="ghost" size="sm" className="w-full mt-4">
                        查看全部 {tool.courses.length} 个课程
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Back Button */}
            <Link href="/tools">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回工具列表
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
