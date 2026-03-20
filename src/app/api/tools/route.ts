import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// ??????
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

// ????
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

// ????
const getStats = async () => {
  const [total, free, paid, freemium] = await Promise.all([
    prisma.tool.count({ where: { status: 1 } }),
    prisma.tool.count({ where: { status: 1, pricingType: 'Free' } }),
    prisma.tool.count({ where: { status: 1, pricingType: 'Paid' } }),
    prisma.tool.count({ where: { status: 1, pricingType: 'Freemium' } }),
  ]);
  return { total, free, paid, freemium };
};

// ???????????????????????????? N+1
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
      useCaseId: true,
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

// ??????
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const categoryId = searchParams.get('category') ? parseInt(searchParams.get('category')!) : undefined;
  const subCategoryId = searchParams.get('subcategory') ? parseInt(searchParams.get('subcategory')!) : undefined;
  const useCaseId = searchParams.get('usecase') ? parseInt(searchParams.get('usecase')!) : undefined;
  const pricingType = searchParams.get('pricing') || undefined;
  const sortBy = searchParams.get('sort') || 'popular';
  const search = searchParams.get('search') || undefined;
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
  const pageSize = 40;

  const where: any = { status: 1 };

  if (categoryId) {
    where.categoryId = categoryId;
  }
  if (subCategoryId) {
    where.subCategoryId = subCategoryId;
  }
  if (useCaseId) {
    where.useCaseId = useCaseId;
  }
  if (pricingType) {
    where.pricingType = pricingType;
  }
  if (search) {
    const term = search.trim().slice(0, 100);
    if (term) {
      where.OR = [
        { name: { contains: term } },
        { shortDesc: { contains: term } },
        { description: { contains: term } },
      ];
    }
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

  const hasFilters = categoryId || subCategoryId || useCaseId || pricingType || search;

  try {
    const skip = (page - 1) * pageSize;

    const [tools, total, useCases, categories, stats, featuredByUseCase] = await Promise.all([
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
      prisma.tool.count({ where }),
      getUseCases(),
      getCategories(),
      getStats(),
      (!categoryId && !subCategoryId && !useCaseId && !pricingType && !search && page === 1)
        ? getFeaturedByUseCase()
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      success: true,
      tools: {
        tools,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      useCases,
      categories,
      stats,
      featuredByUseCase,
    });
  } catch (error) {
    console.error('Failed to fetch tools:', error);
    return NextResponse.json({ success: false, tools: [], error: 'Failed to fetch tools' }, { status: 500 });
  }
}

// ??????????
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: '???' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      shortDesc,
      description,
      websiteUrl,
      imageUrl,
      pricingType,
      status,
      categoryId,
      subCategoryId,
      useCaseId,
      sortOrder,
    } = body;

    // 验证必填字段
    if (!name || !slug || !shortDesc || !description || !websiteUrl || !categoryId || !useCaseId) {
      return NextResponse.json({ error: '请填写所有必填字段' }, { status: 400 });
    }

    // 检查 slug 是否已存在
    const existingTool = await prisma.tool.findUnique({
      where: { slug },
    });

    if (existingTool) {
      return NextResponse.json({ error: 'URL 标识已存在，请更换' }, { status: 400 });
    }

    // 检查 name 是否已存在
    const existingName = await prisma.tool.findUnique({
      where: { name },
    });

    if (existingName) {
      return NextResponse.json({ error: '工具名称已存在，请更换' }, { status: 400 });
    }

    // ????
    const tool = await prisma.tool.create({
      data: {
        name,
        slug,
        shortDesc,
        description,
        websiteUrl,
        imageUrl: imageUrl || null,
        pricingType: pricingType || 'Freemium',
        status: status ?? 0,
        categoryId: parseInt(categoryId),
        subCategoryId: subCategoryId ? parseInt(subCategoryId) : null,
        useCaseId: parseInt(useCaseId),
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json({ tool }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create tool:', error);
    return NextResponse.json(
      { error: error.message || '创建失败' },
      { status: 500 }
    );
  }
}
