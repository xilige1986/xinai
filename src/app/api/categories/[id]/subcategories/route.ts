import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST /api/categories/[id]/subcategories - 创建子分类
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const categoryId = parseInt(id);
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, slug, description } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists in this category
    const existing = await prisma.subCategory.findUnique({
      where: { categoryId_slug: { categoryId, slug } },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Slug already exists in this category' },
        { status: 400 }
      );
    }

    const subCategory = await prisma.subCategory.create({
      data: {
        name,
        slug,
        description,
        categoryId,
      },
    });

    return NextResponse.json({ subCategory }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create subcategory:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create subcategory' },
      { status: 500 }
    );
  }
}
