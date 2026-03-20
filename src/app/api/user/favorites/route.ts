import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// 获取用户收藏列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        favorites: {
          where: { status: 1 },
          include: {
            category: true,
            subCategory: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json({ favorites: user?.favorites || [] });
  } catch (error: any) {
    console.error('Failed to fetch favorites:', error);
    return NextResponse.json(
      { error: '获取收藏失败' },
      { status: 500 }
    );
  }
}

// 添加收藏
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { toolId } = await request.json();

    if (!toolId) {
      return NextResponse.json({ error: '缺少工具ID' }, { status: 400 });
    }

    const userId = parseInt(session.user.id);

    // 检查工具是否存在
    const tool = await prisma.tool.findUnique({
      where: { id: toolId },
    });

    if (!tool) {
      return NextResponse.json({ error: '工具不存在' }, { status: 404 });
    }

    // 添加收藏关系
    await prisma.user.update({
      where: { id: userId },
      data: {
        favorites: {
          connect: { id: toolId },
        },
      },
    });

    return NextResponse.json({ success: true, message: '收藏成功' });
  } catch (error: any) {
    console.error('Failed to add favorite:', error);
    return NextResponse.json(
      { error: '收藏失败' },
      { status: 500 }
    );
  }
}

// 取消收藏
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const toolId = searchParams.get('toolId');

    if (!toolId) {
      return NextResponse.json({ error: '缺少工具ID' }, { status: 400 });
    }

    const userId = parseInt(session.user.id);

    await prisma.user.update({
      where: { id: userId },
      data: {
        favorites: {
          disconnect: { id: parseInt(toolId) },
        },
      },
    });

    return NextResponse.json({ success: true, message: '取消收藏成功' });
  } catch (error: any) {
    console.error('Failed to remove favorite:', error);
    return NextResponse.json(
      { error: '取消收藏失败' },
      { status: 500 }
    );
  }
}
