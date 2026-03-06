import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// PUT /api/usecases/[id] - 更新使用场景
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
    const useCaseId = parseInt(id);
    if (isNaN(useCaseId)) {
      return NextResponse.json({ error: 'Invalid use case ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, slug, description, adoptionRate } = body;

    // Check if slug is unique (excluding current use case)
    if (slug) {
      const existing = await prisma.useCase.findFirst({
        where: {
          slug,
          id: { not: useCaseId },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Slug already exists' },
          { status: 400 }
        );
      }
    }

    const useCase = await prisma.useCase.update({
      where: { id: useCaseId },
      data: {
        name,
        slug,
        description,
        adoptionRate,
      },
    });

    return NextResponse.json({ useCase });
  } catch (error: any) {
    console.error('Failed to update use case:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update use case' },
      { status: 500 }
    );
  }
}

// DELETE /api/usecases/[id] - 删除使用场景
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
    const useCaseId = parseInt(id);
    if (isNaN(useCaseId)) {
      return NextResponse.json({ error: 'Invalid use case ID' }, { status: 400 });
    }

    await prisma.useCase.delete({
      where: { id: useCaseId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete use case:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete use case' },
      { status: 500 }
    );
  }
}
