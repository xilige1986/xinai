import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const categoryId = searchParams.get('category') ? parseInt(searchParams.get('category')!) : undefined;
  const subCategoryId = searchParams.get('subcategory') ? parseInt(searchParams.get('subcategory')!) : undefined;
  const useCaseId = searchParams.get('usecase') ? parseInt(searchParams.get('usecase')!) : undefined;
  const pricingType = searchParams.get('pricing') || undefined;
  const sortBy = searchParams.get('sort') || 'popular';
  const search = searchParams.get('search') || undefined;

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
    where.OR = [
      { name: { contains: search } },
      { shortDesc: { contains: search } },
      { description: { contains: search } },
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

  try {
    const tools = await prisma.tool.findMany({
      where,
      orderBy,
      include: {
        category: true,
        subCategory: true,
        useCase: true,
      },
    });

    return NextResponse.json({ tools });
  } catch (error) {
    console.error('Failed to fetch tools:', error);
    return NextResponse.json({ tools: [], error: 'Failed to fetch tools' }, { status: 500 });
  }
}
