import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CourseCard } from '@/components/course-card';
import {
  ArrowLeft,
  ExternalLink,
  Eye,
  Heart,
  Share2,
  Calendar,
  Tag,
  Folder,
  Layers,
  Target,
} from 'lucide-react';
import { pricingTypeStyles } from '@/types';
import type { Metadata } from 'next';

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

async function getTool(slug: string) {
  const tool = await prisma.tool.findUnique({
    where: { slug, status: 1 },
    include: {
      category: true,
      subCategory: true,
      useCase: true,
      courses: true,
    },
  });

  if (!tool) return null;

  // 增加浏览量
  await prisma.tool.update({
    where: { id: tool.id },
    data: { views: { increment: 1 } },
  });

  return tool;
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = await prisma.tool.findUnique({
    where: { slug },
    include: { category: true, useCase: true },
  });

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
      ratingValue: '4.5',
      ratingCount: tool.likes.toString(),
    },
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">首页</Link>
        <span>/</span>
        <Link href="/tools" className="hover:text-foreground">AI工具</Link>
        <span>/</span>
        {tool.category && (
          <>
            <Link href={`/category/${tool.category.slug}`} className="hover:text-foreground">
              {tool.category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-foreground">{tool.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-start gap-4">
            {tool.imageUrl ? (
              <img
                src={tool.imageUrl}
                alt={tool.name}
                className="w-20 h-20 rounded-xl object-cover border border-border/50"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-2xl font-bold text-primary border border-primary/20">
                {tool.name[0]}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{tool.name}</h1>
              <p className="text-muted-foreground">{tool.shortDesc}</p>
            </div>
          </div>

          {/* 标签 */}
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className={pricingStyle.className}>
              {pricingStyle.label}
            </Badge>
            {tool.category && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Folder className="h-3 w-3" />
                {tool.category.name}
              </Badge>
            )}
            {tool.subCategory && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Layers className="h-3 w-3" />
                {tool.subCategory.name}
              </Badge>
            )}
            {tool.useCase && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {tool.useCase.name}
              </Badge>
            )}
            <Badge variant="outline" className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {tool.views.toLocaleString()} 浏览
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {tool.likes.toLocaleString()} 点赞
            </Badge>
          </div>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>工具介绍</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                {tool.description.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 text-muted-foreground leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Related Courses */}
          {tool.courses && tool.courses.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">相关课程</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tool.courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-border/50">
            <CardContent className="pt-6 space-y-4">
              <a href={tool.websiteUrl} target="_blank" rel="noopener noreferrer">
                <Button className="w-full gradient-primary hover:opacity-90" size="lg">
                  访问官网
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <Button variant="outline" className="w-full border-border">
                <Heart className="mr-2 h-4 w-4" />
                收藏工具
              </Button>
              <Button variant="outline" className="w-full border-border">
                <Share2 className="mr-2 h-4 w-4" />
                分享
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm">工具信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>收录时间：{new Date(tool.createdAt).toLocaleDateString('zh-CN')}</span>
              </div>
              {tool.category && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Folder className="h-4 w-4" />
                  <span>分类：{tool.category.name}</span>
                </div>
              )}
              {tool.subCategory && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Layers className="h-4 w-4" />
                  <span>子分类：{tool.subCategory.name}</span>
                </div>
              )}
              {tool.useCase && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>使用场景：{tool.useCase.name}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Link href="/tools">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回工具列表
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
