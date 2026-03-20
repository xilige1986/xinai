import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// 获取所有快捷入口
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const quickLinks = await prisma.quickLink.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ quickLinks });
  } catch (error: any) {
    console.error('Failed to fetch quick links:', error);
    return NextResponse.json(
      { error: '获取快捷入口失败' },
      { status: 500 }
    );
  }
}

// 创建快捷入口
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { label, href, sortOrder, isActive } = body;

    if (!label || !href) {
      return NextResponse.json(
        { error: '名称和链接不能为空' },
        { status: 400 }
      );
    }

    const quickLink = await prisma.quickLink.create({
      data: {
        label,
        href,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ quickLink });
  } catch (error: any) {
    console.error('Failed to create quick link:', error);
    return NextResponse.json(
      { error: '创建快捷入口失败' },
      { status: 500 }
    );
  }
}
