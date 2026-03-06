import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET /api/usecases - 获取所有使用场景
export async function GET() {
  try {
    const useCases = await prisma.useCase.findMany({
      orderBy: { adoptionRate: 'desc' },
      include: {
        _count: { select: { tools: true } },
      },
    });

    return NextResponse.json({ useCases });
  } catch (error) {
    console.error('Failed to fetch use cases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch use cases' },
      { status: 500 }
    );
  }
}

// POST /api/usecases - 创建新使用场景
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, description, adoptionRate } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existing = await prisma.useCase.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      );
    }

    const useCase = await prisma.useCase.create({
      data: {
        name,
        slug,
        description,
        adoptionRate: adoptionRate || 0,
      },
    });

    return NextResponse.json({ useCase }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create use case:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create use case' },
      { status: 500 }
    );
  }
}
