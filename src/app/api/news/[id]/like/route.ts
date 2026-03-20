import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// 点赞/取消点赞
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const newsId = parseInt(id);
    if (isNaN(newsId)) {
      return NextResponse.json({ error: 'Invalid news ID' }, { status: 400 });
    }

    const userId = parseInt(session.user.id);

    // Check if already liked - using a simple approach without separate table
    // We'll use localStorage on client side to track likes, and just increment here
    // For server-side tracking, we could add a NewsLike table in the future

    // Toggle like by incrementing/decrementing
    const { action } = await request.json();

    if (action === 'like') {
      await prisma.news.update({
        where: { id: newsId },
        data: { likes: { increment: 1 } },
      });
    } else if (action === 'unlike') {
      await prisma.news.update({
        where: { id: newsId },
        data: { likes: { decrement: 1 } },
      });
    }

    const news = await prisma.news.findUnique({
      where: { id: newsId },
      select: { likes: true },
    });

    return NextResponse.json({
      likes: news?.likes || 0,
      action,
    });
  } catch (error: any) {
    console.error('Failed to toggle like:', error);
    return NextResponse.json(
      { error: '操作失败' },
      { status: 500 }
    );
  }
}

// 获取点赞数
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const newsId = parseInt(id);
    if (isNaN(newsId)) {
      return NextResponse.json({ error: 'Invalid news ID' }, { status: 400 });
    }

    const news = await prisma.news.findUnique({
      where: { id: newsId },
      select: { likes: true },
    });

    return NextResponse.json({ likes: news?.likes || 0 });
  } catch (error: any) {
    console.error('Failed to get likes:', error);
    return NextResponse.json(
      { error: '获取失败' },
      { status: 500 }
    );
  }
}
