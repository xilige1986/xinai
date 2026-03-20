import { prisma } from '@/lib/db';
import { HotNews24h, HotNews24hSkeleton } from '@/components/hot-news-24h';
import { LazyImage } from '@/components/lazy-image';
import { NewsletterSubscribe } from '@/components/newsletter-subscribe';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Clock,
  Eye,
  Heart,
  TrendingUp,
  ChevronRight,
  Flame,
  Tag,
  Newspaper,
  ExternalLink,
  Globe,
} from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { getSponsors } from '@/lib/sponsors';
import { SponsorsCard } from './SponsorsCard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI资讯 - 最新人工智能行业动态',
  description: '汇集最新AI行业资讯、人工智能技术突破、产品发布和行业分析。每日更新，助您掌握人工智能领域前沿动态。',
  keywords: 'AI资讯,人工智能新闻,AI行业动态,ChatGPT,大模型,机器学习,深度学习,AI技术',
  openGraph: {
    title: 'AI资讯 - 最新人工智能行业动态',
    description: '汇集最新AI行业资讯、人工智能技术突破、产品发布和行业分析。',
    type: 'website',
  },
};

// 每页显示数量
const PAGE_SIZE = 10;

/**
 * 获取资讯列表
 */
async function getNewsList(page: number = 1, category?: string, tag?: string, period?: string) {
  const skip = (page - 1) * PAGE_SIZE;

  const where: any = {
    status: 1, // 已发布
  };

  if (category && category !== 'all') {
    where.category = category;
  }

  // 标签筛选 - 使用 contains 模式匹配 JSON 字符串中的标签
  if (tag) {
    // 标签以 JSON 数组格式存储，如：["AI编程", "ChatGPT"]
    // 搜索包含该标签的 JSON 字符串，需要匹配引号包裹的标签名
    where.tags = {
      contains: `"${tag}"`,
    };
  }

  // 时间范围筛选
  if (period) {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24小时前
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7天前
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30天前
        break;
      default:
        startDate = new Date(0); // 全部
    }

    if (period !== 'all') {
      where.publishedAt = {
        gte: startDate,
      };
    }
  }

  const [news, total] = await Promise.all([
    prisma.news.findMany({
      where,
      orderBy: [
        { isHot: 'desc' },
        { publishedAt: 'desc' },
      ],
      skip,
      take: PAGE_SIZE,
    }),
    prisma.news.count({ where }),
  ]);

  return {
    news,
    total,
    hasMore: skip + news.length < total,
    currentPage: page,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
}

/**
 * 获取热门标签
 */
async function getHotTags() {
  const news = await prisma.news.findMany({
    where: { status: 1 },
    select: { tags: true },
    take: 100,
  });

  const tagCount: Record<string, number> = {};
  news.forEach((item) => {
    if (item.tags) {
      try {
        const tags = JSON.parse(item.tags);
        tags.forEach((tag: string) => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      } catch {
        // 忽略解析错误
      }
    }
  });

  return Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));
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

/**
 * 去除 HTML 标签，返回纯文本
 */
function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
}

/**
 * 构建筛选 URL
 */
function buildFilterUrl({
  category,
  tag,
  period,
}: {
  category?: string;
  tag?: string;
  period?: string;
}) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (tag) params.set('tag', tag);
  if (period && period !== 'all') params.set('period', period);
  const queryString = params.toString();
  return `/news${queryString ? `?${queryString}` : ''}`;
}

/**
 * 格式化日期
 */
function formatDate(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes === 0 ? '刚刚' : `${minutes}分钟前`;
    }
    return `${hours}小时前`;
  } else if (days === 1) {
    return '昨天';
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    return d.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  }
}

/**
 * 资讯卡片组件
 * 有 sourceUrl 的聚合新闻直接跳转源站
 * 没有 sourceUrl 的跳转到详情页
 */
function NewsCard({
  news,
  isFeatured = false,
}: {
  news: any;
  isFeatured?: boolean;
}) {
  const tags = news.tags ? JSON.parse(news.tags) : [];

  // 判断是否为聚合新闻（有 sourceUrl）
  const isAggregated = !!news.sourceUrl;
  const externalUrl = isAggregated ? news.sourceUrl : null;
  const internalUrl = `/news/${news.slug}.html`;
  const targetUrl = externalUrl || internalUrl;
  const isExternal = !!externalUrl;

  if (isFeatured) {
    // 头条/大图模式
    return (
      <article className="group">
        <a
          href={targetUrl}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener nofollow' : undefined}
          className="block"
        >
          <div className="relative overflow-hidden rounded-xl aspect-[21/9] mb-4">
            {news.coverImage ? (
              <LazyImage
                src={news.coverImage}
                alt={news.title}
                aspectRatio="21/9"
                containerClassName="w-full"
                className="group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="w-full aspect-[21/9] bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Newspaper className="h-16 w-16 text-primary/40" />
              </div>
            )}
            {/* 热门标记 */}
            {news.isHot && (
              <div className="absolute top-4 left-4 flex items-center gap-1 px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-full">
                <Flame className="h-4 w-4" />
                热门
              </div>
            )}
            {/* 外部源标记 */}
            {isExternal && (
              <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 bg-background/90 text-foreground text-xs font-medium rounded-full">
                <ExternalLink className="h-3 w-3" />
                {news.source}
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-3">
            {news.title}
          </h2>
          <p className="text-muted-foreground line-clamp-2 mb-4">
            {stripHtml(news.summary || news.content).substring(0, 150) + '...'}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(news.publishedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {news.views.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {news.likes.toLocaleString()}
            </span>
            {news.source && (
              <span className="text-primary flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                {news.source}
              </span>
            )}
            {tags.length > 0 && (
              <div className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                {tags.slice(0, 2).map((tag: string) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs font-normal"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </a>
      </article>
    );
  }

  // 普通列表模式
  return (
    <article className="group py-6 border-b border-border/50 last:border-0">
      <div className="flex gap-5">
        {/* 图片 - 仅在有封面图时显示 */}
        {news.coverImage && (
          <a
            href={targetUrl}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener nofollow' : undefined}
            className="flex-shrink-0 w-[200px] hidden sm:block"
          >
            <div className="relative overflow-hidden rounded-lg aspect-[16/10]">
              <LazyImage
                src={news.coverImage}
                alt={news.title}
                aspectRatio="16/10"
                containerClassName="w-full"
                className="group-hover:scale-105 transition-transform duration-500"
              />
              {isExternal && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-background/90 text-foreground text-xs rounded-full">
                  <ExternalLink className="h-3 w-3" />
                </div>
              )}
            </div>
          </a>
        )}

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <a
            href={targetUrl}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener nofollow' : undefined}
            className="block"
          >
            <div className="flex items-start gap-2 mb-2">
              {news.isHot && (
                <Badge
                  variant="destructive"
                  className="text-xs flex-shrink-0"
                >
                  <Flame className="h-3 w-3 mr-1" />
                  热门
                </Badge>
              )}
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {news.title}
              </h3>
              {isExternal && (
                <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
              )}
            </div>
            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
              {stripHtml(news.summary || news.content).substring(0, 120) + '...'}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDate(news.publishedAt)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {news.views.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                {news.likes}
              </span>
              {news.source && (
                <span className="text-primary flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  {news.source}
                </span>
              )}
            </div>
          </a>
        </div>
      </div>
    </article>
  );
}

/**
 * 分页组件
 */
function Pagination({
  currentPage,
  totalPages,
  hasMore,
  category,
  tag,
  period,
}: {
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  category?: string;
  tag?: string;
  period?: string;
}) {
  // 构建基础 URL，保留筛选参数
  const buildUrl = (pageNum: number) => {
    const params = new URLSearchParams();
    if (pageNum > 1) params.set('page', pageNum.toString());
    if (category) params.set('category', category);
    if (tag) params.set('tag', tag);
    if (period && period !== 'all') params.set('period', period);
    const queryString = params.toString();
    return `/news${queryString ? `?${queryString}` : ''}`;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8 pt-8 border-t border-border/50">
      {currentPage > 1 && (
        <Link href={buildUrl(currentPage - 1)}>
          <Button variant="outline" size="sm">
            上一页
          </Button>
        </Link>
      )}

      <div className="flex items-center gap-1">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const pageNum = i + 1;
          const isActive = pageNum === currentPage;

          return (
            <Link key={pageNum} href={buildUrl(pageNum)}>
              <Button
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className="min-w-[36px]"
              >
                {pageNum}
              </Button>
            </Link>
          );
        })}
        {totalPages > 5 && <span className="px-2">...</span>}
      </div>

      {hasMore && (
        <Link href={buildUrl(currentPage + 1)}>
          <Button variant="outline" size="sm">
            下一页
          </Button>
        </Link>
      )}
    </div>
  );
}

/**
 * 资讯列表页面
 */
export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = parseInt((params.page as string) || '1', 10);
  const category = params.category as string | undefined;
  const tag = params.tag as string | undefined;
  const period = params.period as string | undefined;

  const [{ news, total, hasMore, currentPage, totalPages }, categories, hotTags, sponsors] =
    await Promise.all([
      getNewsList(page, category, tag, period),
      getCategories(),
      getHotTags(),
      getSponsors(),
    ]);

  // 分离头条和普通资讯（仅在第一页且无筛选时显示头条）
  const featuredNews = !category && !tag && !period && page === 1 ? news[0] : null;
  const regularNews = featuredNews ? news.slice(1) : news;

  // 构建筛选标题
  let filterTitle = 'AI资讯';
  let filterDescription = '探索AI世界的最新动态与深度报道';
  if (category) {
    filterTitle = `${category}`;
    filterDescription = `浏览 ${category} 分类下的所有资讯`;
  } else if (tag) {
    filterTitle = `标签：${tag}`;
    filterDescription = `浏览与 "${tag}" 相关的所有资讯`;
  } else if (period && period !== 'all') {
    const periodText = period === 'daily' ? '今日' : period === 'weekly' ? '周报' : '月报';
    filterTitle = `${periodText}`;
    filterDescription = `浏览${periodText}发布的资讯`;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 主内容区 - 三栏布局 */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 左侧：固定栏 - 标题和分类 - 260px */}
          <aside className="w-full lg:w-[260px] flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* 标题区域 */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Newspaper className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{filterTitle}</h1>
                  <p className="text-sm text-muted-foreground">{filterDescription}</p>
                </div>
              </div>

              {/* 当前筛选显示 */}
              {(category || tag || (period && period !== 'all')) && (
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">当前筛选：</span>
                  <div className="flex flex-wrap gap-2">
                    {category && (
                      <Badge variant="secondary" className="gap-1">
                        分类：{category}
                        <Link href={buildFilterUrl({ tag, period })}>
                          <span className="cursor-pointer hover:text-destructive">×</span>
                        </Link>
                      </Badge>
                    )}
                    {tag && (
                      <Badge variant="secondary" className="gap-1">
                        标签：{tag}
                        <Link href={buildFilterUrl({ category, period })}>
                          <span className="cursor-pointer hover:text-destructive">×</span>
                        </Link>
                      </Badge>
                    )}
                    {period && period !== 'all' && (
                      <Badge variant="secondary" className="gap-1">
                        时间：{period === 'daily' ? '今日' : period === 'weekly' ? '周报' : '月报'}
                        <Link href={buildFilterUrl({ category, tag })}>
                          <span className="cursor-pointer hover:text-destructive">×</span>
                        </Link>
                      </Badge>
                    )}
                  </div>
                  <Link href="/news">
                    <Button variant="ghost" size="sm" className="text-muted-foreground px-0">
                      清除筛选
                    </Button>
                  </Link>
                </div>
              )}

              {/* 时间筛选 */}
              <div className="bg-card rounded-xl border border-border/50 p-4">
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: 'all', label: '全部' },
                    { key: 'daily', label: '今日' },
                    { key: 'weekly', label: '周报' },
                    { key: 'monthly', label: '月报' },
                  ].map((item) => (
                    <Link
                      key={item.key}
                      href={buildFilterUrl({ category, tag, period: item.key === 'all' ? undefined : item.key })}
                      className={`px-3 py-2 rounded-lg text-sm text-center transition-colors ${
                        (period === item.key) || (!period && item.key === 'all')
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* 分类导航 */}
              <div className="bg-card rounded-xl border border-border/50 p-4">
                <div className="space-y-1">
                  <Link
                    href={buildFilterUrl({ tag, period })}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      !category ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    }`}
                  >
                    <span>全部资讯</span>
                    
                  </Link>
                  {categories.map((cat) => (
                    <Link
                      key={cat.name}
                      href={buildFilterUrl({ category: cat.name, tag, period })}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                        category === cat.name ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                      }`}
                    >
                      <span>{cat.name}</span>
                      
                    </Link>
                  ))}
                </div>
              </div>

              {/* 订阅提示 */}
              <NewsletterSubscribe />
            </div>
          </aside>

          {/* 中间：资讯列表 - 自适应宽度 */}
          <div className="flex-1 min-w-[500px]">
            {news.length === 0 ? (
              <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
                <Newspaper className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-muted-foreground">暂无资讯</p>
              </div>
            ) : (
              <>
                {/* 头条 */}
                {featuredNews && (
                  <div className="mb-8">
                    <NewsCard news={featuredNews} isFeatured />
                    <Separator className="mt-8" />
                  </div>
                )}

                {/* 资讯列表 */}
                <div>
                  {regularNews.map((item) => (
                    <NewsCard key={item.id} news={item} />
                  ))}
                </div>

                {/* 分页 */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  hasMore={hasMore}
                  category={category}
                  tag={tag}
                  period={period}
                />
              </>
            )}
          </div>

          {/* 右侧：侧边栏 - 固定宽度 280px */}
          <aside className="w-full lg:w-[280px] flex-shrink-0 space-y-6">
            {/* 24h 热议 */}
            <Suspense fallback={<HotNews24hSkeleton />}>
              <HotNews24h />
            </Suspense>

            {/* 赞助商推荐 */}
            <SponsorsCard sponsors={sponsors} />

            {/* 热门标签 */}
            {hotTags.length > 0 && (
              <div className="bg-card rounded-xl border border-border/50 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">热门标签</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {hotTags.map((t) => (
                    <Link
                      key={t.name}
                      href={buildFilterUrl({ category, tag: t.name, period })}
                    >
                      <Badge
                        variant={tag === t.name ? 'default' : 'secondary'}
                        className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        {t.name}
                        <span className="ml-1 text-xs opacity-60">
                          {t.count}
                        </span>
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
