import { prisma } from '@/lib/db';
import { LazyImage } from '@/components/lazy-image';
import { HotNews24h, HotNews24hSkeleton } from '@/components/hot-news-24h';
import { Badge } from '@/components/ui/badge';
import { getSponsors } from '@/lib/sponsors';
import { SponsorsCard } from '../SponsorsCard';
import { NewsComments } from './Comments';
import { NewsActions } from './NewsActions';
import {
  Calendar,
  Clock,
  Eye,
  Heart,
  Bookmark,
  User,
  Link as LinkIcon,
  ChevronLeft,
  Flame,
  Tag,
  TrendingUp,
  Newspaper,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

/**
 * 去除 HTML 标签，返回纯文本
 */
function stripHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, '') || '';
}

/**
 * 获取资讯详情
 */
async function getNewsBySlug(slug: string) {
  // 处理带 .html 后缀的 slug
  const cleanSlug = slug.replace(/\.html$/, '');

  const news = await prisma.news.findUnique({
    where: { slug: cleanSlug },
  });

  if (!news || news.status !== 1) {
    return null;
  }

  return news;
}

/**
 * 增加浏览量
 */
async function incrementViews(id: number) {
  await prisma.news.update({
    where: { id },
    data: { views: { increment: 1 } },
  });
}

/**
 * 获取相关资讯
 */
async function getRelatedNews(category: string, currentId: number) {
  return await prisma.news.findMany({
    where: {
      status: 1,
      category,
      id: { not: currentId },
    },
    orderBy: { publishedAt: 'desc' },
    take: 4,
    select: {
      id: true,
      title: true,
      slug: true,
      coverImage: true,
      publishedAt: true,
      views: true,
    },
  });
}

/**
 * 获取上一篇/下一篇
 */
async function getAdjacentNews(
  publishedAt: Date,
  currentId: number
) {
  const [prev, next] = await Promise.all([
    prisma.news.findFirst({
      where: {
        status: 1,
        publishedAt: { lt: publishedAt },
      },
      orderBy: { publishedAt: 'desc' },
      select: { title: true, slug: true },
    }),
    prisma.news.findFirst({
      where: {
        status: 1,
        publishedAt: { gt: publishedAt },
      },
      orderBy: { publishedAt: 'asc' },
      select: { title: true, slug: true },
    }),
  ]);

  return { prev, next };
}

/**
 * 获取分类列表
 */
async function getCategories() {
  const categories = await prisma.news.groupBy({
    by: ['category'],
    where: { status: 1 },
    _count: { id: true },
  });

  return categories.map((c) => ({
    name: c.category,
    count: c._count.id,
  }));
}
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 生成页面元数据
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cleanSlug = slug.replace(/\.html$/, '');
  const news = await getNewsBySlug(cleanSlug);

  if (!news) {
    return {
      title: '资讯未找到',
    };
  }

  return {
    title: `${news.title} - AI资讯`,
    description: stripHtml(news.summary || news.content).substring(0, 150),
    openGraph: {
      title: news.title,
      description: stripHtml(news.summary || news.content).substring(0, 150),
      images: news.coverImage ? [news.coverImage] : undefined,
      type: 'article',
      publishedTime: news.publishedAt?.toISOString(),
    },
  };
}

/**
 * 资讯详情页面
 */
export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cleanSlug = slug.replace(/\.html$/, '');
  const news = await getNewsBySlug(cleanSlug);

  if (!news) {
    notFound();
  }

  // 异步增加浏览量
  incrementViews(news.id).catch(() => {});

  // 获取相关资讯、相邻文章、分类和赞助商
  const [relatedNews, { prev, next }, categories, sponsors] = await Promise.all([
    getRelatedNews(news.category, news.id),
    getAdjacentNews(news.publishedAt!, news.id),
    getCategories(),
    getSponsors(),
  ]);

  const tags = news.tags ? JSON.parse(news.tags) : [];

  return (
    <div className="min-h-screen bg-background">
      {/* 主内容区 - 三栏布局 */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 左侧：固定栏 - 260px */}
          <aside className="w-full lg:w-[260px] flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* 返回导航 */}
              <Link
                href="/news"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                返回资讯列表
              </Link>

              {/* 文章信息 */}
              <div className="bg-card rounded-xl border border-border/50 p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Newspaper className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{news.category}</p>
                    <p className="text-xs text-muted-foreground">资讯详情</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{news.author}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(news.publishedAt!)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span>{(news.views + 1).toLocaleString()} 阅读</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Heart className="h-4 w-4" />
                    <span>{news.likes} 点赞</span>
                  </div>
                </div>
              </div>

              {/* 分类导航 */}
              <div className="bg-card rounded-xl border border-border/50 p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  资讯分类
                </h3>
                <div className="space-y-1">
                  <Link
                    href="/news"
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors hover:bg-muted`}
                  >
                    <span>全部资讯</span>
                    <span className="text-xs text-muted-foreground">
                      {categories.reduce((sum, c) => sum + c.count, 0)}
                    </span>
                  </Link>
                  {categories.map((cat) => (
                    <Link
                      key={cat.name}
                      href={`/news?category=${encodeURIComponent(cat.name)}`}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                        news.category === cat.name
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span
                        className={`text-xs ${
                          news.category === cat.name
                            ? 'opacity-70'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {cat.count}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* 操作按钮 */}
              <NewsActions
                newsId={news.id}
                initialLikes={news.likes}
                commentsCount={news.comments}
              />
            </div>
          </aside>

          {/* 中间：文章内容 - 自适应宽度 */}
          <article className="flex-1 min-w-[500px]">
            {/* 文章头部 */}
            <header className="mb-8">
              {/* 分类标签 */}
              <div className="flex items-center gap-2 mb-4">
                <Link href={`/news?category=${news.category}`}>
                  <Badge variant="secondary" className="hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors">
                    {news.category}
                  </Badge>
                </Link>
                {news.isHot && (
                  <Badge variant="destructive">
                    <Flame className="h-3 w-3 mr-1" />
                    热门
                  </Badge>
                )}
              </div>

              {/* 标题 */}
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6 leading-tight">
                {news.title}
              </h1>

              {/* 摘要 */}
              {news.summary && (
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed border-l-4 border-primary/30 pl-4">
                  {stripHtml(news.summary)}
                </p>
              )}

              {/* 来源 */}
              {news.source && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                  <LinkIcon className="h-4 w-4" />
                  来源: {news.source}
                </div>
              )}
            </header>

            {/* 封面图 */}
            {news.coverImage && (
              <div className="mb-8">
                <LazyImage
                  src={news.coverImage}
                  alt={news.title}
                  aspectRatio="21/9"
                  containerClassName="w-full rounded-xl"
                />
              </div>
            )}

            {/* 正文内容 */}
            {news.content ? (
              <div
                className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-primary hover:prose-a:underline prose-img:rounded-xl prose-img:my-6"
                dangerouslySetInnerHTML={{ __html: news.content }}
              />
            ) : news.sourceUrl ? (
              <div className="bg-muted/30 rounded-xl border border-dashed border-border p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <ExternalLink className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">聚合资讯</h3>
                <p className="text-muted-foreground mb-4">此资讯为聚合内容，请访问原始来源阅读完整内容</p>
                <a
                  href={news.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <span>阅读原始内容</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
                {news.source && (
                  <p className="text-sm text-muted-foreground mt-4">
                    来源：{news.source}
                  </p>
                )}
              </div>
            ) : null}

            {/* 标签 */}
            {tags.length > 0 && (
              <div className="mt-8 pt-8 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">标签:</span>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag: string) => (
                      <Link key={tag} href={`/news?tag=${encodeURIComponent(tag)}`}>
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                        >
                          {tag}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 上一篇/下一篇导航 */}
            <div className="mt-8 pt-8 border-t border-border/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prev && (
                  <Link href={`/news/${prev.slug}.html`}>
                    <div className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
                      <span className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                        <ChevronLeft className="h-3 w-3" />
                        上一篇
                      </span>
                      <p className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {prev.title}
                      </p>
                    </div>
                  </Link>
                )}
                {next && (
                  <Link href={`/news/${next.slug}.html`}>
                    <div className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group md:text-right">
                      <span className="text-xs text-muted-foreground flex items-center gap-1 mb-2 md:justify-end">
                        下一篇
                        <ChevronLeft className="h-3 w-3 rotate-180" />
                      </span>
                      <p className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {next.title}
                      </p>
                    </div>
                  </Link>
                )}
              </div>
            </div>

            {/* 相关资讯 */}
            {relatedNews.length > 0 && (
              <div className="mt-12">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold">相关资讯</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedNews.map((item) => (
                    <Link key={item.id} href={`/news/${item.slug}.html`}>
                      <div className="group flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex-shrink-0 w-20 aspect-square rounded-lg overflow-hidden bg-muted">
                          {item.coverImage ? (
                            <img
                              src={item.coverImage}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Newspaper className="h-6 w-6 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors mb-1">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(item.publishedAt!).toLocaleDateString('zh-CN')}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 评论区域 */}
            <NewsComments newsId={news.id} initialComments={news.comments} />
          </article>

          {/* 右侧：侧边栏 - 固定宽度 280px */}
          <aside className="w-full lg:w-[280px] flex-shrink-0 space-y-6">
            {/* 24h 热议 */}
            <Suspense fallback={<HotNews24hSkeleton />}>
              <HotNews24h />
            </Suspense>

            {/* 赞助商推荐 */}
            <SponsorsCard sponsors={sponsors} />

            {/* 快速导航 */}
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <h3 className="font-semibold mb-4">快速导航</h3>
              <div className="space-y-2">
                <Link
                  href="/news"
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm"
                >
                  <span className="flex items-center gap-2">
                    <Newspaper className="h-4 w-4 text-primary" />
                    全部资讯
                  </span>
                  <ChevronLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
                </Link>
                <Link
                  href="/tools"
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm"
                >
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    AI工具
                  </span>
                  <ChevronLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
                </Link>
                <Link
                  href="/courses"
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm"
                >
                  <span className="flex items-center gap-2">
                    <Bookmark className="h-4 w-4 text-primary" />
                    课程学习
                  </span>
                  <ChevronLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
