'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
  ChevronRight,
  Sparkles,
  TrendingUp,
  Clock,
  Heart,
  X,
  Loader2,
  Star
} from 'lucide-react';
import { pricingTypeStyles } from '@/types';
import type { Tool, Category, UseCase } from '@/types';

interface SubCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  categoryId: number;
  category?: Category;
  _count: { tools: number };
}

interface ToolsData {
  tools: Tool[];
  categories: (Category & { _count: { tools: number }; subCategories: SubCategory[] })[];
  subCategories: (SubCategory & { category: Category })[];
  useCases: (UseCase & { _count: { tools: number } })[];
  stats: {
    total: number;
    free: number;
    paid: number;
    freemium: number;
  };
  featuredByUseCase: { useCase: UseCase & { _count: { tools: number } }; tool: Tool | null }[];
}

export function ToolsPageClient({
  initialData,
}: {
  initialData: ToolsData;
}) {
  const searchParams = useSearchParams();
  const [data, setData] = useState<ToolsData>(initialData);
  const [loading, setLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);

  const categoryId = searchParams.get('category') ? parseInt(searchParams.get('category')!) : undefined;
  const subCategoryId = searchParams.get('subcategory') ? parseInt(searchParams.get('subcategory')!) : undefined;
  const useCaseId = searchParams.get('usecase') ? parseInt(searchParams.get('usecase')!) : undefined;
  const pricingType = searchParams.get('pricing') || undefined;
  const sortBy = searchParams.get('sort') || 'popular';
  const searchQuery = searchParams.get('search') || '';

  const hasFilters = categoryId || subCategoryId || useCaseId || pricingType || searchQuery;

  const selectedCategory = data.categories.find((c) => c.id === categoryId);
  const selectedSubCategory = data.subCategories.find((s) => s.id === subCategoryId);
  const selectedUseCase = data.useCases.find((u) => u.id === useCaseId);

  // 自动展开选中的分类
  useEffect(() => {
    if (categoryId && !expandedCategories.includes(categoryId)) {
      setExpandedCategories((prev) => [...prev, categoryId]);
    }
  }, [categoryId, expandedCategories]);

  // 切换分类展开状态
  const toggleCategory = (catId: number) => {
    setExpandedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  // 当 searchParams 变化时，重新获取数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (categoryId) params.set('category', String(categoryId));
        if (subCategoryId) params.set('subcategory', String(subCategoryId));
        if (useCaseId) params.set('usecase', String(useCaseId));
        if (pricingType) params.set('pricing', pricingType);
        if (sortBy !== 'popular') params.set('sort', sortBy);
        if (searchQuery) params.set('search', searchQuery);

        const response = await fetch(`/api/tools?${params.toString()}`);
        const result = await response.json();

        if (result.tools) {
          setData((prev) => ({
            ...prev,
            tools: result.tools,
          }));
        }
      } catch (error) {
        console.error('Failed to fetch tools:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryId, subCategoryId, useCaseId, pricingType, sortBy, searchQuery]);

  // 构建筛选URL
  const buildFilterUrl = useCallback((params: {
    categoryId?: number;
    subCategoryId?: number;
    useCaseId?: number;
    pricingType?: string;
    sortBy?: string;
    search?: string;
  }) => {
    const newSearchParams = new URLSearchParams();
    if (params.categoryId) newSearchParams.set('category', String(params.categoryId));
    if (params.subCategoryId) newSearchParams.set('subcategory', String(params.subCategoryId));
    if (params.useCaseId) newSearchParams.set('usecase', String(params.useCaseId));
    if (params.pricingType) newSearchParams.set('pricing', params.pricingType);
    if (params.sortBy && params.sortBy !== 'popular') newSearchParams.set('sort', params.sortBy);
    if (params.search) newSearchParams.set('search', params.search);

    const query = newSearchParams.toString();
    return query ? `/tools?${query}` : '/tools';
  }, []);

  // 处理搜索
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get('search') as string;

    const url = buildFilterUrl({ categoryId, subCategoryId, useCaseId, pricingType, sortBy, search });
    window.location.href = url;
  };

  // 获取当前选中分类的子分类
  const currentSubCategories = categoryId
    ? data.subCategories.filter((s) => s.categoryId === categoryId)
    : [];

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部标题栏 */}
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
                  共 {data.stats.total} 个工具 · {data.stats.free} 免费 · {data.stats.freemium} 增值 · {data.stats.paid} 付费
                </p>
              </div>
            </div>
            <Link href="/">
              <Button variant="ghost" size="sm">返回首页</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - 筛选器 */}
          <aside className="lg:w-60 flex-shrink-0">
            <div className="sticky top-20 space-y-3">
              {/* 按使用场景筛选 */}
              <div className="bg-white rounded-xl border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">使用场景</h3>
                </div>
                <div className="space-y-1">
                  <Link
                    href={buildFilterUrl({ categoryId, subCategoryId, pricingType, sortBy, search: searchQuery })}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                      !useCaseId ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <span>全部场景</span>
                    <span className="text-xs">{data.stats.total}</span>
                  </Link>
                  {data.useCases.map((useCase) => (
                    <Link
                      key={useCase.id}
                      href={buildFilterUrl({ categoryId, subCategoryId, useCaseId: useCase.id, pricingType, sortBy, search: searchQuery })}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                        useCaseId === useCase.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      <span className="truncate">{useCase.name}</span>
                      <span className="text-xs ml-1">{useCase._count?.tools || 0}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* 按分类筛选（带子分类展开） */}
              <div className="bg-white rounded-xl border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">工具分类</h3>
                </div>
                <div className="space-y-1">
                  <Link
                    href={buildFilterUrl({ useCaseId, pricingType, sortBy, search: searchQuery })}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                      !categoryId ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <span>全部分类</span>
                    <span className="text-xs">{data.stats.total}</span>
                  </Link>
                  {data.categories.map((category) => {
                    const isExpanded = expandedCategories.includes(category.id);
                    const isSelected = categoryId === category.id;
                    const hasSubCategories = category.subCategories?.length > 0;

                    return (
                      <div key={category.id}>
                        <div className="flex items-center">
                          {hasSubCategories && (
                            <button
                              onClick={() => toggleCategory(category.id)}
                              className="p-1 mr-1 rounded hover:bg-muted/50"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              )}
                            </button>
                          )}
                          {!hasSubCategories && <span className="w-5" />}
                          <Link
                            href={buildFilterUrl({ categoryId: category.id, useCaseId, pricingType, sortBy, search: searchQuery })}
                            className={`flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                              isSelected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50 text-muted-foreground'
                            }`}
                          >
                            <span className="truncate">{category.name}</span>
                            <span className="text-xs ml-1">{category._count?.tools || 0}</span>
                          </Link>
                        </div>

                        {/* 子分类列表 */}
                        {isExpanded && hasSubCategories && (
                          <div className="ml-5 mt-1 space-y-1 border-l-2 border-muted pl-3">
                            {category.subCategories.map((sub) => (
                              <Link
                                key={sub.id}
                                href={buildFilterUrl({ categoryId: category.id, subCategoryId: sub.id, useCaseId, pricingType, sortBy, search: searchQuery })}
                                className={`flex items-center justify-between px-2.5 py-1 rounded-md text-xs transition-colors ${
                                  subCategoryId === sub.id
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'hover:bg-muted/50 text-muted-foreground'
                                }`}
                              >
                                <span className="truncate">{sub.name}</span>
                                <span className="text-[10px] ml-1 opacity-70">
                                  {(sub as any)._count?.tools || 0}
                                </span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 按定价筛选 */}
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
                    <span className="text-xs">{data.stats.total}</span>
                  </Link>
                  {Object.entries(pricingTypeStyles).map(([type, style]) => (
                    <Link
                      key={type}
                      href={buildFilterUrl({ categoryId, subCategoryId, useCaseId, pricingType: type, sortBy, search: searchQuery })}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                        pricingType === type
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      <span>{style.label}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${style.className}`}>
                        {type === 'Free' ? data.stats.free : type === 'Paid' ? data.stats.paid : data.stats.freemium}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Tools Grid Area */}
          <div className="flex-1">
            {/* 搜索和筛选栏 */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <form onSubmit={handleSearch} className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="search"
                  type="search"
                  defaultValue={searchQuery}
                  placeholder="搜索 AI 工具..."
                  className="w-full pl-10 h-10 bg-white"
                />
              </form>

              {/* 排序选项 */}
              <div className="flex items-center gap-2">
                <div className="flex bg-white border rounded-lg p-1">
                  <Link
                    href={buildFilterUrl({ categoryId, subCategoryId, useCaseId, pricingType, sortBy: 'recommended', search: searchQuery })}
                    className={`flex items-center px-3 py-1.5 text-xs rounded-md transition-colors ${
                      sortBy === 'recommended'
                        ? 'bg-secondary text-secondary-foreground font-medium'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Star className="h-3 w-3 mr-1" />
                    推荐
                  </Link>
                  <Link
                    href={buildFilterUrl({ categoryId, subCategoryId, useCaseId, pricingType, sortBy: 'popular', search: searchQuery })}
                    className={`flex items-center px-3 py-1.5 text-xs rounded-md transition-colors ${
                      sortBy === 'popular'
                        ? 'bg-secondary text-secondary-foreground font-medium'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    热门
                  </Link>
                  <Link
                    href={buildFilterUrl({ categoryId, subCategoryId, useCaseId, pricingType, sortBy: 'latest', search: searchQuery })}
                    className={`flex items-center px-3 py-1.5 text-xs rounded-md transition-colors ${
                      sortBy === 'latest'
                        ? 'bg-secondary text-secondary-foreground font-medium'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    最新
                  </Link>
                  <Link
                    href={buildFilterUrl({ categoryId, subCategoryId, useCaseId, pricingType, sortBy: 'likes', search: searchQuery })}
                    className={`flex items-center px-3 py-1.5 text-xs rounded-md transition-colors ${
                      sortBy === 'likes'
                        ? 'bg-secondary text-secondary-foreground font-medium'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Heart className="h-3 w-3 mr-1" />
                    最多赞
                  </Link>
                </div>
              </div>
            </div>

            {/* 筛选标签 */}
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
                <Link href={`/tools?sort=${sortBy}`}>
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    清除全部
                  </Button>
                </Link>
              </div>
            )}

            {/* 结果数 */}
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                找到 <span className="font-medium text-foreground">{data.tools.length}</span> 个工具
                {loading && <Loader2 className="inline h-3 w-3 ml-2 animate-spin" />}
              </span>
            </div>

            {/* 工具网格 - 每行4个 */}
            {data.tools.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {data.tools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
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

      {/* Featured by UseCase Section */}
      {!hasFilters && data.featuredByUseCase.length > 0 && (
        <section className="border-t bg-muted/30 py-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold">按场景发现工具</h2>
                <p className="text-sm text-muted-foreground">针对不同业务场景精选的 AI 工具</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.featuredByUseCase.map(({ useCase, tool }) => (
                <Link
                  key={useCase.id}
                  href={buildFilterUrl({ useCaseId: useCase.id })}
                  className="group block bg-white rounded-xl border p-4 hover:shadow-md hover:border-primary/20 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {useCase.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(useCase as any)._count?.tools || 0} 个工具 · {Math.round((useCase as any).adoptionRate || 0)}% 采用率
                      </p>
                    </div>
                    <ChevronDown className="h-4 w-4 -rotate-90 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>

                  {tool && (
                    <div className="flex items-center gap-2 pt-3 border-t">
                      {tool.imageUrl ? (
                        <img
                          src={tool.imageUrl}
                          alt={tool.name}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
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
