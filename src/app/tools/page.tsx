import { prisma } from '@/lib/db';
import { ToolCard } from '@/components/tool-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  Grid3X3,
  Layers,
  Briefcase,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Clock,
  Heart,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { pricingTypeStyles } from '@/types';

// 精简查询字段，减少数据传输
const getUseCases = async () => {
  return await prisma.useCase.findMany({
    orderBy: { adoptionRate: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      adoptionRate: true,
      _count: { select: { tools: true } },
    },
  });
};

const getCategories = async () => {
  return await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      subCategories: {
        select: { id: true, name: true, slug: true },
      },
      _count: { select: { tools: true } },
    },
  });
};

const getStats = async () => {
  const [total, free, paid, freemium] = await Promise.all([
    prisma.tool.count({ where: { status: 1 } }),
    prisma.tool.count({ where: { status: 1, pricingType: 'Free' } }),
    prisma.tool.count({ where: { status: 1, pricingType: 'Paid' } }),
    prisma.tool.count({ where: { status: 1, pricingType: 'Freemium' } }),
  ]);
  return { total, free, paid, freemium };
};

// 分页获取工具，限制返回字段
const getTools = async ({
  categoryId,
  subCategoryId,
  useCaseId,
  pricingType,
  sortBy = 'popular',
  search,
  page = 1,
  pageSize = 24,
}: {
  categoryId?: number;
  subCategoryId?: number;
  useCaseId?: number;
  pricingType?: string;
  sortBy?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) => {
  const where: any = { status: 1 };

  if (categoryId) where.categoryId = categoryId;
  if (subCategoryId) where.subCategoryId = subCategoryId;
  if (useCaseId) where.useCaseId = useCaseId;
  if (pricingType) where.pricingType = pricingType;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { shortDesc: { contains: search, mode: 'insensitive' } },
    ];
  }

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
        sortOrder: true,
        category: { select: { id: true, name: true, slug: true } },
        subCategory: { select: { id: true, name: true, slug: true } },
        useCase: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.tool.count({ where }),
  ]);

  return { tools, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
};

const getFeaturedByUseCase = async () => {
  const useCases = await prisma.useCase.findMany({
    take: 6,
    orderBy: { adoptionRate: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      adoptionRate: true,
      _count: { select: { tools: true } },
    },
  });

  const featuredTools = await Promise.all(
    useCases.map(async (useCase) => {
      const tool = await prisma.tool.findFirst({
        where: { status: 1, useCaseId: useCase.id },
        orderBy: [{ likes: 'desc' }, { views: 'desc' }],
        select: {
          id: true,
          name: true,
          slug: true,
          shortDesc: true,
          imageUrl: true,
        },
      });
      return { useCase, tool };
    })
  );

  return featuredTools.filter((item) => item.tool !== null);
};

const buildFilterUrl = (params: {
  categoryId?: number;
  subCategoryId?: number;
  useCaseId?: number;
  pricingType?: string;
  sortBy?: string;
  search?: string;
  page?: number;
}) => {
  const searchParams = new URLSearchParams();
  if (params.categoryId) searchParams.set('category', String(params.categoryId));
  if (params.subCategoryId) searchParams.set('subcategory', String(params.subCategoryId));
  if (params.useCaseId) searchParams.set('usecase', String(params.useCaseId));
  if (params.pricingType) searchParams.set('pricing', params.pricingType);
  if (params.sortBy && params.sortBy !== 'popular') searchParams.set('sort', params.sortBy);
  if (params.search) searchParams.set('search', params.search);
  if (params.page && params.page > 1) searchParams.set('page', String(params.page));

  const query = searchParams.toString();
  return query ? `/tools?${query}` : '/tools';
};

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // 等待 searchParams
  const params = await searchParams;

  const categoryId = params.category ? parseInt(params.category as string) : undefined;
  const subCategoryId = params.subcategory ? parseInt(params.subcategory as string) : undefined;
  const useCaseId = params.usecase ? parseInt(params.usecase as string) : undefined;
  const pricingType = params.pricing as string | undefined;
  const sortBy = (params.sort as string) || 'popular';
  const searchQuery = params.search as string | undefined;
  const page = params.page ? parseInt(params.page as string) : 1;

  // 并行获取所有数据
  const [useCases, categories, { tools, total, totalPages }, stats, featuredByUseCase] = await Promise.all([
    getUseCases(),
    getCategories(),
    getTools({ categoryId, subCategoryId, useCaseId, pricingType, sortBy, search: searchQuery, page }),
    getStats(),
    (!categoryId && !subCategoryId && !useCaseId && !pricingType && !searchQuery && page === 1)
      ? getFeaturedByUseCase()
      : Promise.resolve([]),
  ]);

  const hasFilters = categoryId || subCategoryId || useCaseId || pricingType || searchQuery;
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedSubCategory = selectedCategory?.subCategories?.find((s) => s.id === subCategoryId);
  const selectedUseCase = useCases.find((u) => u.id === useCaseId);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Grid3X3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">AI 工具库</h1>
                <p className="text-xs text-muted-foreground">
                  共 {stats.total} 个工具 · {stats.free} 免费 · {stats.freemium} 增值 · {stats.paid} 付费
                </p>
              </div>
            </div>
            <Link href="/">
              <Button variant="ghost" size="sm">返回首页</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-56 flex-shrink-0">
            <div className="sticky top-20 space-y-3">
              {/* 使用场景 */}
              <div className="bg-white rounded-xl border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">使用场景</h3>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  <Link
                    href={buildFilterUrl({ categoryId, subCategoryId, pricingType, sortBy, search: searchQuery })}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                      !useCaseId ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <span>全部场景</span>
                    <span className="text-xs">{stats.total}</span>
                  </Link>
                  {useCases.map((useCase) => (
                    <Link
                      key={useCase.id}
                      href={buildFilterUrl({ categoryId, subCategoryId, useCaseId: useCase.id, pricingType, sortBy, search: searchQuery })}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                        useCaseId === useCase.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      <span className="truncate">{useCase.name}</span>
                      <span className="text-xs ml-1">{useCase._count.tools}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* 工具分类 */}
              <div className="bg-white rounded-xl border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">工具分类</h3>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  <Link
                    href={buildFilterUrl({ subCategoryId, useCaseId, pricingType, sortBy, search: searchQuery })}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                      !categoryId ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <span>全部分类</span>
                    <span className="text-xs">{stats.total}</span>
                  </Link>
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={buildFilterUrl({ categoryId: category.id, useCaseId, pricingType, sortBy, search: searchQuery })}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                        categoryId === category.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      <span className="truncate">{category.name}</span>
                      <span className="text-xs ml-1">{category._count.tools}</span>
                    </Link>
                  ))}
                </div>

                {/* 子分类 */}
                {selectedCategory?.subCategories && selectedCategory.subCategories.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-2">{selectedCategory.name} - 子分类</p>
                    <div className="space-y-1">
                      <Link
                        href={buildFilterUrl({ categoryId, useCaseId, pricingType, sortBy, search: searchQuery })}
                        className={`flex items-center justify-between px-2.5 py-1 rounded-md text-xs transition-colors ${
                          !subCategoryId ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        <span>全部</span>
                      </Link>
                      {selectedCategory.subCategories.map((sub) => (
                        <Link
                          key={sub.id}
                          href={buildFilterUrl({ categoryId, subCategoryId: sub.id, useCaseId, pricingType, sortBy, search: searchQuery })}
                          className={`flex items-center justify-between px-2.5 py-1 rounded-md text-xs transition-colors ${
                            subCategoryId === sub.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50 text-muted-foreground'
                          }`}
                        >
                          <span className="truncate">{sub.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 定价类型 */}
              <div className="bg-white rounded-xl border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">定价类型</h3>
                </div>
                <div className="space-y-1">
                  <Link
                    href={buildFilterUrl({ categoryId, subCategoryId, useCaseId, sortBy, search: searchQuery })}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                      !pricingType ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <span>全部定价</span>
                    <span className="text-xs">{stats.total}</span>
                  </Link>
                  {Object.entries(pricingTypeStyles).map(([type, style]) => (
                    <Link
                      key={type}
                      href={buildFilterUrl({ categoryId, subCategoryId, useCaseId, pricingType: type, sortBy, search: searchQuery })}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                        pricingType === type ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50 text-muted-foreground'
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
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search and Sort */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <form className="relative flex-1" action="/tools" method="GET">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="search"
                  type="search"
                  defaultValue={searchQuery || ''}
                  placeholder="搜索 AI 工具..."
                  className="w-full pl-10 h-10 bg-white"
                />
                {(categoryId || subCategoryId || useCaseId || pricingType || sortBy !== 'popular') && (
                  <>
                    {categoryId && <input type="hidden" name="category" value={categoryId} />}
                    {subCategoryId && <input type="hidden" name="subcategory" value={subCategoryId} />}
                    {useCaseId && <input type="hidden" name="usecase" value={useCaseId} />}
                    {pricingType && <input type="hidden" name="pricing" value={pricingType} />}
                    {sortBy !== 'popular' && <input type="hidden" name="sort" value={sortBy} />}
                  </>
                )}
              </form>

              <div className="flex items-center gap-2">
                <div className="flex bg-white border rounded-lg p-1">
                  {[
                    { key: 'recommended', label: '推荐', icon: Sparkles },
                    { key: 'popular', label: '热门', icon: TrendingUp },
                    { key: 'latest', label: '最新', icon: Clock },
                    { key: 'likes', label: '最多赞', icon: Heart },
                  ].map(({ key, label, icon: Icon }) => (
                    <Link
                      key={key}
                      href={buildFilterUrl({ categoryId, subCategoryId, useCaseId, pricingType, sortBy: key, search: searchQuery })}
                      className={`flex items-center px-3 py-1.5 text-xs rounded-md transition-colors ${
                        sortBy === key ? 'bg-secondary text-secondary-foreground font-medium' : 'hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Filters */}
            {hasFilters && (
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <span className="text-sm text-muted-foreground">已选筛选：</span>
                {selectedCategory && (
                  <Badge variant="secondary" className="gap-1 px-2 py-1">
                    {selectedCategory.name}
                    <Link href={buildFilterUrl({ subCategoryId, useCaseId, pricingType, sortBy, search: searchQuery })}>
                      <X className="h-3 w-3 ml-1 hover:text-destructive cursor-pointer" />
                    </Link>
                  </Badge>
                )}
                {selectedSubCategory && (
                  <Badge variant="secondary" className="gap-1 px-2 py-1">
                    {selectedSubCategory.name}
                    <Link href={buildFilterUrl({ categoryId, useCaseId, pricingType, sortBy, search: searchQuery })}>
                      <X className="h-3 w-3 ml-1 hover:text-destructive cursor-pointer" />
                    </Link>
                  </Badge>
                )}
                {selectedUseCase && (
                  <Badge variant="secondary" className="gap-1 px-2 py-1">
                    {selectedUseCase.name}
                    <Link href={buildFilterUrl({ categoryId, subCategoryId, pricingType, sortBy, search: searchQuery })}>
                      <X className="h-3 w-3 ml-1 hover:text-destructive cursor-pointer" />
                    </Link>
                  </Badge>
                )}
                {pricingType && (
                  <Badge variant="secondary" className="gap-1 px-2 py-1">
                    {pricingTypeStyles[pricingType]?.label}
                    <Link href={buildFilterUrl({ categoryId, subCategoryId, useCaseId, sortBy, search: searchQuery })}>
                      <X className="h-3 w-3 ml-1 hover:text-destructive cursor-pointer" />
                    </Link>
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1 px-2 py-1">
                    搜索: {searchQuery}
                    <Link href={buildFilterUrl({ categoryId, subCategoryId, useCaseId, pricingType, sortBy })}>
                      <X className="h-3 w-3 ml-1 hover:text-destructive cursor-pointer" />
                    </Link>
                  </Badge>
                )}
                <Link href="/tools">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">清除全部</Button>
                </Link>
              </div>
            )}

            {/* Results Count */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  找到 <span className="font-medium text-foreground">{total}</span> 个工具
                  {totalPages > 1 && <span className="ml-1">· 第 {page}/{totalPages} 页</span>}
                </span>
              </div>
            </div>

            {/* Tools Grid */}
            {tools.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {tools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool as any} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    {page > 1 && (
                      <Link href={buildFilterUrl({ categoryId, subCategoryId, useCaseId, pricingType, sortBy, search: searchQuery, page: page - 1 })}>
                        <Button variant="outline" size="sm">上一页</Button>
                      </Link>
                    )}
                    <span className="text-sm text-muted-foreground px-4">
                      第 {page} / {totalPages} 页
                    </span>
                    {page < totalPages && (
                      <Link href={buildFilterUrl({ categoryId, subCategoryId, useCaseId, pricingType, sortBy, search: searchQuery, page: page + 1 })}>
                        <Button variant="outline" size="sm">下一页</Button>
                      </Link>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1">未找到相关工具</h3>
                <p className="text-sm text-muted-foreground mb-4">尝试调整筛选条件或搜索其他关键词</p>
                <Link href="/tools">
                  <Button variant="outline" size="sm">清除筛选</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Featured Section */}
      {!hasFilters && featuredByUseCase.length > 0 && (
        <section className="border-t bg-muted/30 py-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-5">
              <h2 className="text-lg font-bold">按场景发现工具</h2>
              <p className="text-sm text-muted-foreground">针对不同业务场景精选的 AI 工具</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredByUseCase.map(({ useCase, tool }) => (
                <Link
                  key={useCase.id}
                  href={buildFilterUrl({ useCaseId: useCase.id })}
                  className="group block bg-white rounded-xl border p-4 hover:shadow-md hover:border-primary/20 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">{useCase.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {useCase._count.tools} 个工具 · {Math.round(useCase.adoptionRate)}% 采用率
                      </p>
                    </div>
                    <ChevronDown className="h-4 w-4 -rotate-90 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>

                  {tool && (
                    <div className="flex items-center gap-2 pt-3 border-t">
                      {tool.imageUrl ? (
                        <img src={tool.imageUrl} alt={tool.name} className="w-8 h-8 rounded-lg object-cover" loading="lazy" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {tool.name[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{tool.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{tool.shortDesc}</p>
                      </div>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
