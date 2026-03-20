import { Suspense } from 'react';
import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { ToolsPageClient } from './ToolsPageClient';

export const metadata: Metadata = {
  title: 'AI工具库 - 发现最实用的AI工具',
  description: '探索超过1000+个AI工具，涵盖写作、绘画、视频、音频等多个领域。发现适合你的AI工具，提升工作效率。',
  keywords: 'AI工具,人工智能工具,AI工具库,AI应用,AI软件',
  openGraph: {
    title: 'AI工具库 - 发现最实用的AI工具',
    description: '探索超过1000+个AI工具，涵盖写作、绘画、视频、音频等多个领域。',
    type: 'website',
  },
};

// 获取使用场景
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

// 获取分类（带子分类）
const getCategories = async () => {
  return await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      subCategories: {
        orderBy: { id: 'asc' },
        select: { id: true, name: true, slug: true, description: true, categoryId: true },
      },
      _count: { select: { tools: true } },
    },
  });
};

// 获取子分类
const getSubCategories = async () => {
  return await prisma.subCategory.findMany({
    orderBy: { id: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      categoryId: true,
      category: { select: { id: true, name: true, slug: true } },
      _count: { select: { tools: true } },
    },
  });
};

// 获取统计
const getStats = async () => {
  const [total, free, paid, freemium] = await Promise.all([
    prisma.tool.count({ where: { status: 1 } }),
    prisma.tool.count({ where: { status: 1, pricingType: 'Free' } }),
    prisma.tool.count({ where: { status: 1, pricingType: 'Paid' } }),
    prisma.tool.count({ where: { status: 1, pricingType: 'Freemium' } }),
  ]);
  return { total, free, paid, freemium };
};

// 获取精选工具（按使用场景）
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
  if (useCases.length === 0) return [];

  const useCaseIds = useCases.map((uc) => uc.id);
  const tools = await prisma.tool.findMany({
    where: { status: 1, useCaseId: { in: useCaseIds } },
    orderBy: [{ likes: 'desc' }, { views: 'desc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      shortDesc: true,
      imageUrl: true,
      websiteUrl: true,
      pricingType: true,
      views: true,
      likes: true,
      sortOrder: true,
      useCaseId: true,
      category: { select: { id: true, name: true, slug: true } },
      subCategory: { select: { id: true, name: true, slug: true } },
      useCase: { select: { id: true, name: true, slug: true } },
    },
  });

  const firstToolByUseCaseId = new Map<number, (typeof tools)[0]>();
  for (const tool of tools) {
    if (!firstToolByUseCaseId.has(tool.useCaseId)) {
      firstToolByUseCaseId.set(tool.useCaseId, tool);
    }
  }

  return useCases
    .map((useCase) => {
      const tool = firstToolByUseCaseId.get(useCase.id) ?? null;
      return { useCase, tool };
    })
    .filter((item): item is { useCase: (typeof useCases)[0]; tool: NonNullable<typeof item.tool> } => item.tool !== null);
};

// 获取初始工具列表
const getInitialTools = async () => {
  const pageSize = 40;
  const [tools, total] = await Promise.all([
    prisma.tool.findMany({
      where: { status: 1 },
      orderBy: [{ likes: 'desc' }, { views: 'desc' }],
      take: pageSize,
      select: {
        id: true,
        name: true,
        slug: true,
        shortDesc: true,
        imageUrl: true,
        websiteUrl: true,
        pricingType: true,
        views: true,
        likes: true,
        sortOrder: true,
        category: { select: { id: true, name: true, slug: true } },
        subCategory: { select: { id: true, name: true, slug: true } },
        useCase: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.tool.count({ where: { status: 1 } }),
  ]);

  return {
    tools,
    total,
    page: 1,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

function ToolsPageFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">加载中...</p>
      </div>
    </div>
  );
}

export default async function ToolsPage() {
  const [toolsData, categories, subCategories, useCases, stats, featuredByUseCase] = await Promise.all([
    getInitialTools(),
    getCategories(),
    getSubCategories(),
    getUseCases(),
    getStats(),
    getFeaturedByUseCase(),
  ]);

  const initialData = {
    tools: toolsData.tools,
    categories,
    subCategories,
    useCases,
    stats,
    featuredByUseCase,
    pagination: {
      total: toolsData.total,
      page: toolsData.page,
      pageSize: toolsData.pageSize,
      totalPages: toolsData.totalPages,
    },
  };

  return (
    <Suspense fallback={<ToolsPageFallback />}>
      <ToolsPageClient initialData={initialData} />
    </Suspense>
  );
}
