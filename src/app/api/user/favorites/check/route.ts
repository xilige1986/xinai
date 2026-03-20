import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// 检查工具是否已收藏
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ isFavorite: false });
    }

    const { searchParams } = new URL(request.url);
    const toolId = searchParams.get('toolId');

    if (!toolId) {
      return NextResponse.json({ error: '缺少工具ID' }, { status: 400 });
    }

    const userId = parseInt(session.user.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        favorites: {
          where: { id: parseInt(toolId) },
          select: { id: true },
        },
      },
    });

    const isFavorite = (user?.favorites?.length || 0) > 0;

    return NextResponse.json({ isFavorite });
  } catch (error: any) {
    console.error('Failed to check favorite:', error);
    return NextResponse.json(
      { error: '检查收藏状态失败' },
      { status: 500 }
    );
  }
}
