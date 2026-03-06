import { prisma } from '@/lib/db';
import { ToolCard } from '@/components/tool-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Grid3X3,
  Layers,
  Sparkles,
  TrendingUp,
  Clock,
  Heart,
  ChevronRight,
  ArrowLeft,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { pricingTypeStyles } from '@/types';

// 强制动态渲染
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: { [key: string]: string | string[] | undefined };
}

async function getCategoryBySlug(slug: string) {
  return await prisma.category.findUnique({
    where: { slug },
    include: {
      subCategories: true,
      _count: { select: { tools: true } },
    },
  });
}

async function getToolsByCategory({
  categoryId,
  subCategoryId,
  pricingType,
  sortBy = 'popular',
  page = 1,
  pageSize = 24,
}: {
  categoryId: number;
  subCategoryId?: number;
  pricingType?: string;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}) {
  const where: any = { status: 1, categoryId };

  if (subCategoryId) where.subCategoryId = subCategoryId;
  if (pricingType) where.pricingType = pricingType;

  let orderBy: any = {};
  switch (sortBy) {
    case 'latest':
      orderBy = { createdAt: 'desc' };
      break;
    case 'likes':
      orderBy = { likes: 'desc' };
      break;
    case 'views':
      orderBy = { views: 'desc' };
      break;
    case 'recommended':
      orderBy = [{ sortOrder: 'desc' }, { likes: 'desc' }];
      break;
    case 'popular':
    default:
      orderBy = [{ likes: 'desc' }, { views: 'desc' }];
      break;
  }

  const skip = (page - 1) * pageSize;

  const [tools, total] = await Promise.all([
    prisma.tool.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      select: {
        id: true,
        name: true,
        slug: true,
        shortDesc: true,
        imageUrl: true,
        pricingType: true,
        views: true,
        likes: true,
        category: { select: { id: true, name: true, slug: true } },
        subCategory: { select: { id: true, name: true, slug: true } },
        useCase: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.tool.count({ where }),
  ]);

  return { tools, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

async function getRelatedCategories(excludeId: number) {
  return await prisma.category.findMany({
    where: { id: { not: excludeId } },
    orderBy: { sortOrder: 'asc' },
    take: 8,
    include: {
      _count: { select: { tools: true } },
    },
  });
}

async function getCategoryStats(categoryId: number) {
  const [total, free, paid, freemium] = await Promise.all([
    prisma.tool.count({ where: { status: 1, categoryId } }),
    prisma.tool.count({ where: { status: 1, categoryId, pricingType: 'Free' } }),
    prisma.tool.count({ where: { status: 1, categoryId, pricingType: 'Paid' } }),
    prisma.tool.count({ where: { status: 1, categoryId, pricingType: 'Freemium' } }),
  ]);
  return { total, free, paid, freemium };
}

const buildFilterUrl = (slug: string, params: {
  subCategoryId?: number;
  pricingType?: string;
  sortBy?: string;
  page?: number;
}) => {
  const searchParams = new URLSearchParams();
  if (params.subCategoryId) searchParams.set('subcategory', String(params.subCategoryId));
  if (params.pricingType) searchParams.set('pricing', params.pricingType);
  if (params.sortBy && params.sortBy !== 'popular') searchParams.set('sort', params.sortBy);
  if (params.page && params.page > 1) searchParams.set('page', String(params.page));

  const query = searchParams.toString();
  return query ? `/tools/category/${slug}?${query}` : `/tools/category/${slug}`;
};

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const subCategoryId = searchParams.subcategory ? parseInt(searchParams.subcategory as string) : undefined;
  const pricingType = searchParams.pricing as string | undefined;
  const sortBy = (searchParams.sort as string) || 'popular';
  const page = searchParams.page ? parseInt(searchParams.page as string) : 1;

  const [{ tools, total, totalPages }, stats, relatedCategories] = await Promise.all([
    getToolsByCategory({
      categoryId: category.id,
      subCategoryId,
      pricingType,
      sortBy,
      page,
    }),
    getCategoryStats(category.id),
    getRelatedCategories(category.id),
  ]);

  const selectedSubCategory = category.subCategories.find((s) => s.id === subCategoryId);
  const hasFilters = subCategoryId || pricingType;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/5 to-background border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/" className="hover:text-primary transition-colors">首页</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/tools" className="hover:text-primary transition-colors">工具库</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">{category.name}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Grid3X3 className="h-6 w-6 text-primary" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  {stats.total} 个工具
                </Badge>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-3">{category.name}</h1>
              {category.description && (
                <p className="text-muted-foreground text-lg max-w-2xl">
                  {category.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  {stats.free} 免费
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  {stats.freemium} 增值
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  {stats.paid} 付费
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-3">
              <Link href="/tools">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  返回全部
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0 space-y-6">
            {/* SubCategories */}
            {category.subCategories.length > 0 && (
              <div className="bg-white rounded-xl border p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">子分类</h3>
                </div>
                <div className="space-y-1">
                  <Link
                    href={buildFilterUrl(slug, { pricingType, sortBy })}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      !subCategoryId
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <span>全部</span>
                    <span className="text-xs">{stats.total}</span>
                  </Link>
                  {category.subCategories.map((sub) => (
                    <Link
                      key={sub.id}
                      href={buildFilterUrl(slug, { subCategoryId: sub.id, pricingType, sortBy })}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                        subCategoryId === sub.id
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      <span className="truncate">{sub.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing Filter */}
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">定价类型</h3>
              </div>
              <div className="space-y-1">
                <Link
                  href={buildFilterUrl(slug, { subCategoryId, sortBy })}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    !pricingType
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  <span>全部</span>
                  <span className="text-xs">{stats.total}</span>
                </Link>
                {Object.entries(pricingTypeStyles).map(([type, style]) => (
                  <Link
                    key={type}
                    href={buildFilterUrl(slug, { subCategoryId, pricingType: type, sortBy })}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      pricingType === type
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <span>{style.label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${style.className}`}>
                      {type === 'Free' ? stats.free : type === 'Paid' ? stats.paid : stats.freemium}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Related Categories */}
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-2 mb-4">
                <Grid3X3 className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">相关分类</h3>
              </div>
              <div className="space-y-2">
                {relatedCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/tools/category/${cat.slug}`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-muted/50 text-muted-foreground transition-colors"
                  >
                    <span className="truncate">{cat.name}</span>
                    <span className="text-xs">{cat._count.tools}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* Tools Grid */}
          <div className="flex-1">
            {/* Sort and Filter Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">
                  找到 <span className="font-medium text-foreground">{total}</span> 个工具
                </span>
                {selectedSubCategory && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedSubCategory.name}
                    <Link href={buildFilterUrl(slug, { pricingType, sortBy })} className="ml-1 hover:text-destructive">
                      ×
                    </Link>
                  </Badge>
                )}
                {pricingType && (
                  <Badge variant="secondary" className="ml-2">
                    {pricingTypeStyles[pricingType]?.label}
                    <Link href={buildFilterUrl(slug, { subCategoryId, sortBy })} className="ml-1 hover:text-destructive">
                      ×
                    </Link>
                  </Badge>
                )}
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-1 bg-white border rounded-lg p-1">
                {[
                  { key: 'popular', label: '热门', icon: TrendingUp },
                  { key: 'latest', label: '最新', icon: Clock },
                  { key: 'likes', label: '最多赞', icon: Heart },
                ].map(({ key, label, icon: Icon }) => (
                  <Link
                    key={key}
                    href={buildFilterUrl(slug, { subCategoryId, pricingType, sortBy: key })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors ${
                      sortBy === key
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Tools Grid */}
            {tools.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {tools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool as any} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    {page > 1 && (
                      <Link href={buildFilterUrl(slug, { subCategoryId, pricingType, sortBy, page: page - 1 })}>
                        <Button variant="outline" size="sm">上一页</Button>
                      </Link>
                    )}
                    <span className="text-sm text-muted-foreground px-4">
                      第 {page} / {totalPages} 页
                    </span>
                    {page < totalPages && (
                      <Link href={buildFilterUrl(slug, { subCategoryId, pricingType, sortBy, page: page + 1 })}>
                        <Button variant="outline" size="sm">下一页</Button>
                      </Link>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <Grid3X3 className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1">暂无工具</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {hasFilters ? '尝试调整筛选条件' : '该分类下暂无工具'}
                </p>
                {hasFilters && (
                  <Link href={`/tools/category/${slug}`}>
                    <Button variant="outline" size="sm">清除筛选</Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
