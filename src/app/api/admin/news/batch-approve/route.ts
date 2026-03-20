import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: '请提供要审核的资讯ID列表' },
        { status: 400 }
      );
    }

    // 批量审核通过
    const result = await prisma.news.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        status: 1,
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
    });
  } catch (error) {
    console.error('Batch approve news error:', error);
    return NextResponse.json(
      { error: '批量审核失败' },
      { status: 500 }
    );
  }
}
