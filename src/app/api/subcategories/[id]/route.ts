import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// PUT /api/subcategories/[id] - 更新子分类
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const subCategoryId = parseInt(id);
    if (isNaN(subCategoryId)) {
      return NextResponse.json({ error: 'Invalid subcategory ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, slug, description } = body;

    // Get current subcategory to check categoryId
    const current = await prisma.subCategory.findUnique({
      where: { id: subCategoryId },
    });

    if (!current) {
      return NextResponse.json({ error: 'Subcategory not found' }, { status: 404 });
    }

    // Check if slug is unique (excluding current subcategory)
    if (slug && slug !== current.slug) {
      const existing = await prisma.subCategory.findUnique({
        where: {
          categoryId_slug: {
            categoryId: current.categoryId,
            slug,
          },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Slug already exists in this category' },
          { status: 400 }
        );
      }
    }

    const subCategory = await prisma.subCategory.update({
      where: { id: subCategoryId },
      data: {
        name,
        slug,
        description,
      },
    });

    return NextResponse.json({ subCategory });
  } catch (error: any) {
    console.error('Failed to update subcategory:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update subcategory' },
      { status: 500 }
    );
  }
}

// DELETE /api/subcategories/[id] - 删除子分类
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const subCategoryId = parseInt(id);
    if (isNaN(subCategoryId)) {
      return NextResponse.json({ error: 'Invalid subcategory ID' }, { status: 400 });
    }

    await prisma.subCategory.delete({
      where: { id: subCategoryId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete subcategory:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete subcategory' },
      { status: 500 }
    );
  }
}
