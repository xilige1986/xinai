import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// 获取推送历史
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('scheduleId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (scheduleId) {
      where.scheduleId = parseInt(scheduleId);
    }

    const [history, total] = await Promise.all([
      prisma.newsletterHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          schedule: {
            select: { name: true },
          },
        },
      }),
      prisma.newsletterHistory.count({ where }),
    ]);

    // 解析 newsIds
    const historyWithParsedNewsIds = history.map((h) => ({
      ...h,
      newsIds: JSON.parse(h.newsIds),
    }));

    return NextResponse.json({
      history: historyWithParsedNewsIds,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch history:', error);
    return NextResponse.json(
      { error: '获取历史失败' },
      { status: 500 }
    );
  }
}
