'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Star,
  Menu,
  SlidersHorizontal,
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
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export function ToolsPageClient({
  initialData,
}: {
  initialData: ToolsData;
}) {
  const [data, setData] = useState<ToolsData>(initialData);
  const [loading, setLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  // 本地状态管理筛选条件（不再依赖 URL）
  const [filters, setFilters] = useState({
    categoryId: undefined as number | undefined,
    subCategoryId: undefined as number | undefined,
    useCaseId: undefined as number | undefined,
    pricingType: undefined as string | undefined,
    sortBy: 'popular',
    searchQuery: '',
    page: 1,
  });

  const hasFilters = filters.categoryId || filters.subCategoryId || filters.useCaseId || filters.pricingType || filters.searchQuery;

  const selectedCategory = data.categories.find((c) => c.id === filters.categoryId);
  const selectedSubCategory = data.subCategories.find((s) => s.id === filters.subCategoryId);
  const selectedUseCase = data.useCases.find((u) => u.id === filters.useCaseId);

  // 自动展开选中的分类
  useEffect(() => {
    if (filters.categoryId && !expandedCategories.includes(filters.categoryId)) {
      setExpandedCategories((prev) => [...prev, filters.categoryId!]);
    }
  }, [filters.categoryId, expandedCategories]);

  // 切换分类展开状态
  const toggleCategory = (catId: number) => {
    setExpandedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  // 获取数据的函数
  const fetchTools = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.categoryId) params.set('category', String(filters.categoryId));
      if (filters.subCategoryId) params.set('subcategory', String(filters.subCategoryId));
      if (filters.useCaseId) params.set('usecase', String(filters.useCaseId));
      if (filters.pricingType) params.set('pricing', filters.pricingType);
      if (filters.sortBy !== 'popular') params.set('sort', filters.sortBy);
      if (filters.searchQuery) params.set('search', filters.searchQuery);
      if (filters.page > 1) params.set('page', String(filters.page));

      const response = await fetch(`/api/tools?${params.toString()}`);
      const result = await response.json();

      if (result.tools?.tools) {
        setData((prev) => ({
          ...prev,
          tools: result.tools.tools,
          pagination: {
            total: result.tools.total,
            page: result.tools.page,
            pageSize: result.tools.pageSize,
            totalPages: result.tools.totalPages,
          },
        }));
      } else if (result.tools) {
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

  // 处理筛选点击 - 立即更新并获取数据
  const handleFilter = useCallback((updates: Partial<typeof filters>) => {
    setFilters((prev) => {
      const newFilters = { ...prev, ...updates };
      // 如果切换分类，清除子分类
      if (updates.categoryId !== undefined && updates.categoryId !== prev.categoryId) {
        newFilters.subCategoryId = undefined;
      }
      // 如果筛选条件变化（非分页），重置到第一页
      if (!('page' in updates)) {
        newFilters.page = 1;
      }
      return newFilters;
    });
  }, []);

  // 当筛选条件变化时获取数据
  useEffect(() => {
    fetchTools();
  }, [filters]);

  // 处理搜索
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get('search') as string;
    handleFilter({ searchQuery: search });
  };

  // 清除全部筛选
  const clearAllFilters = () => {
    setFilters({
      categoryId: undefined,
      subCategoryId: undefined,
      useCaseId: undefined,
      pricingType: undefined,
      sortBy: 'popular',
      searchQuery: '',
      page: 1,
    });
    setFilterOpen(false);
  };

  // 筛选面板内容组件
  const FilterPanelContent = ({ inDrawer = false }: { inDrawer?: boolean }) => (
    <div className={`space-y-3 ${inDrawer ? 'pb-20' : ''}`}>
      {/* 按使用场景筛选 */}
      <div className="bg-card rounded-xl border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">使用场景</h3>
        </div>
        <div className="space-y-1">
          <button
            onClick={() => { handleFilter({ useCaseId: undefined }); if (inDrawer) setFilterOpen(false); }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors text-left ${
              !filters.useCaseId ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50 text-muted-foreground'
            }`}
          >
            <span>全部场景</span>
            <span className="text-xs">{data.stats.total}</span>
          </button>
          {data.useCases.map((useCase) => (
            <button
              key={useCase.id}
              onClick={() => { handleFilter({ useCaseId: useCase.id }); if (inDrawer) setFilterOpen(false); }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors text-left ${
                filters.useCaseId === useCase.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50 text-muted-foreground'
              }`}
            >
              <span className="truncate">{useCase.name}</span>
              <span className="text-xs ml-1">{useCase._count?.tools || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 按分类筛选（带子分类展开） */}
      <div className="bg-card rounded-xl border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">工具分类</h3>
        </div>
        <div className="space-y-1">
          <button
            onClick={() => { handleFilter({ categoryId: undefined, subCategoryId: undefined }); if (inDrawer) setFilterOpen(false); }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors text-left ${
              !filters.categoryId ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50 text-muted-foreground'
            }`}
          >
            <span>全部分类</span>
            <span className="text-xs">{data.stats.total}</span>
          </button>
          {data.categories.map((category) => {
            const isExpanded = expandedCategories.includes(category.id);
            const isSelected = filters.categoryId === category.id && !filters.subCategoryId;
            const hasSubCategories = category.subCategories?.length > 0;

            return (
              <div key={category.id}>
                <div className="flex items-center">
                  {!hasSubCategories && <span className="w-5" />}
                  <button
                    onClick={() => {
                      if (hasSubCategories) {
                        // 有子分类：点击展开/收回
                        toggleCategory(category.id);
                      } else {
                        // 无子分类：直接选中该分类
                        handleFilter({ categoryId: category.id, subCategoryId: undefined });
                        if (inDrawer) setFilterOpen(false);
                      }
                    }}
                    className={`flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors text-left ${
                      isSelected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {hasSubCategories && (
                        isExpanded ? (
                          <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        )
                      )}
                      <span className="truncate">{category.name}</span>
                    </div>
                    <span className="text-xs ml-1">{category._count?.tools || 0}</span>
                  </button>
                </div>

                {/* 子分类列表 */}
                {isExpanded && hasSubCategories && (
                  <div className="ml-5 mt-1 space-y-1 border-l-2 border-muted pl-3">
                    <button
                      onClick={() => { handleFilter({ categoryId: category.id, subCategoryId: undefined }); if (inDrawer) setFilterOpen(false); }}
                      className={`w-full flex items-center justify-between px-2.5 py-1 rounded-md text-xs transition-colors text-left ${
                        filters.categoryId === category.id && !filters.subCategoryId
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      <span className="truncate">全部</span>
                      <span className="text-[10px] ml-1 opacity-70">{category._count?.tools || 0}</span>
                    </button>
                    {category.subCategories.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => { handleFilter({ categoryId: category.id, subCategoryId: sub.id }); if (inDrawer) setFilterOpen(false); }}
                        className={`w-full flex items-center justify-between px-2.5 py-1 rounded-md text-xs transition-colors text-left ${
                          filters.subCategoryId === sub.id
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        <span className="truncate">{sub.name}</span>
                        <span className="text-[10px] ml-1 opacity-70">
                          {(sub as any)._count?.tools || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 按定价筛选 */}
      <div className="bg-card rounded-xl border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">定价类型</h3>
        </div>
        <div className="space-y-1">
          <button
            onClick={() => { handleFilter({ pricingType: undefined }); if (inDrawer) setFilterOpen(false); }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors text-left ${
              !filters.pricingType ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50 text-muted-foreground'
            }`}
          >
            <span>全部定价</span>
            <span className="text-xs">{data.stats.total}</span>
          </button>
          {Object.entries(pricingTypeStyles).map(([type, style]) => (
            <button
              key={type}
              onClick={() => { handleFilter({ pricingType: type }); if (inDrawer) setFilterOpen(false); }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors text-left ${
                filters.pricingType === type
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-muted/50 text-muted-foreground'
              }`}
            >
              <span>{style.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${style.className}`}>
                {type === 'Free' ? data.stats.free : type === 'Paid' ? data.stats.paid : data.stats.freemium}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部标题栏 */}
      <div className="border-b bg-card">
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
          {/* Desktop Sidebar - 筛选器 (lg及以上显示) */}
          <aside className="hidden lg:block lg:w-60 flex-shrink-0">
            <div className="sticky top-20">
              <FilterPanelContent />
            </div>
          </aside>

          {/* Mobile Filter Drawer */}
          {filterOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setFilterOpen(false)}
              />
              {/* Drawer */}
              <div className="fixed inset-y-0 left-0 w-[300px] sm:w-[350px] bg-background z-50 lg:hidden shadow-xl">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="font-semibold flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5" />
                    筛选工具
                  </h2>
                  <Button variant="ghost" size="icon" onClick={() => setFilterOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="p-4 h-[calc(100vh-65px)] overflow-y-auto">
                  <FilterPanelContent inDrawer />
                </div>
              </div>
            </>
          )}

          {/* Tools Grid Area */}
          <div className="flex-1">
            {/* 搜索和筛选栏 */}
            <div className="flex flex-row gap-2 mb-4">
              {/* Mobile Filter Button - 汉堡菜单 */}
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden flex-shrink-0 h-10 w-10"
                onClick={() => setFilterOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>

              <form onSubmit={handleSearch} className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="search"
                  type="search"
                  defaultValue={filters.searchQuery}
                  placeholder="搜索 AI 工具..."
                  className="w-full pl-10 h-10 bg-background"
                />
              </form>

              {/* 排序选项 */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex bg-card border rounded-lg p-1 h-10 items-center">
                  <button
                    onClick={() => handleFilter({ sortBy: 'recommended' })}
                    className={`flex items-center px-2 sm:px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${
                      filters.sortBy === 'recommended'
                        ? 'bg-secondary text-secondary-foreground font-medium'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Star className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">推荐</span>
                  </button>
                  <button
                    onClick={() => handleFilter({ sortBy: 'popular' })}
                    className={`flex items-center px-2 sm:px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${
                      filters.sortBy === 'popular'
                        ? 'bg-secondary text-secondary-foreground font-medium'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">热门</span>
                  </button>
                  <button
                    onClick={() => handleFilter({ sortBy: 'latest' })}
                    className={`flex items-center px-2 sm:px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${
                      filters.sortBy === 'latest'
                        ? 'bg-secondary text-secondary-foreground font-medium'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">最新</span>
                  </button>
                  <button
                    onClick={() => handleFilter({ sortBy: 'likes' })}
                    className={`flex items-center px-2 sm:px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${
                      filters.sortBy === 'likes'
                        ? 'bg-secondary text-secondary-foreground font-medium'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Heart className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">最多赞</span>
                  </button>
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
                    <button onClick={() => handleFilter({ categoryId: undefined })}>
                      <X className="h-3 w-3 ml-1 hover:text-destructive cursor-pointer" />
                    </button>
                  </Badge>
                )}
                {selectedSubCategory && (
                  <Badge variant="secondary" className="gap-1 px-2 py-1">
                    {selectedSubCategory.name}
                    <button onClick={() => handleFilter({ subCategoryId: undefined })}>
                      <X className="h-3 w-3 ml-1 hover:text-destructive cursor-pointer" />
                    </button>
                  </Badge>
                )}
                {selectedUseCase && (
                  <Badge variant="secondary" className="gap-1 px-2 py-1">
                    {selectedUseCase.name}
                    <button onClick={() => handleFilter({ useCaseId: undefined })}>
                      <X className="h-3 w-3 ml-1 hover:text-destructive cursor-pointer" />
                    </button>
                  </Badge>
                )}
                {filters.pricingType && (
                  <Badge variant="secondary" className="gap-1 px-2 py-1">
                    {pricingTypeStyles[filters.pricingType]?.label}
                    <button onClick={() => handleFilter({ pricingType: undefined })}>
                      <X className="h-3 w-3 ml-1 hover:text-destructive cursor-pointer" />
                    </button>
                  </Badge>
                )}
                {filters.searchQuery && (
                  <Badge variant="secondary" className="gap-1 px-2 py-1">
                    搜索: {filters.searchQuery}
                    <button onClick={() => handleFilter({ searchQuery: '' })}>
                      <X className="h-3 w-3 ml-1 hover:text-destructive cursor-pointer" />
                    </button>
                  </Badge>
                )}
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearAllFilters}>
                  清除全部
                </Button>
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
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {data.tools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>

                {/* 分页 */}
                {data.pagination && data.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => handleFilter({ page: filters.page - 1 })}
                      disabled={filters.page <= 1}
                      className="px-4 py-2 text-sm font-medium rounded-lg border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      上一页
                    </button>
                    <span className="text-sm text-muted-foreground px-4">
                      第 {filters.page} / {data.pagination.totalPages} 页
                      <span className="ml-2">(共 {data.pagination.total} 个工具)</span>
                    </span>
                    <button
                      onClick={() => handleFilter({ page: filters.page + 1 })}
                      disabled={filters.page >= data.pagination.totalPages}
                      className="px-4 py-2 text-sm font-medium rounded-lg border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      下一页
                    </button>
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
                <Button variant="outline" size="sm" onClick={clearAllFilters}>清除筛选</Button>
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
                <button
                  key={useCase.id}
                  onClick={() => handleFilter({ useCaseId: useCase.id })}
                  className="w-full text-left group block bg-card rounded-xl border p-4 hover:shadow-md hover:border-primary/20 transition-all"
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
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
