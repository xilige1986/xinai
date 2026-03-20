import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// 获取单个新闻源
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const id = parseInt(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: '无效的ID' }, { status: 400 });
    }

    const source = await prisma.newsSource.findUnique({
      where: { id },
    });

    if (!source) {
      return NextResponse.json(
        { error: '新闻源不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ source });
  } catch (error) {
    console.error('Get news source error:', error);
    return NextResponse.json(
      { error: '获取新闻源失败' },
      { status: 500 }
    );
  }
}

// 删除新闻源
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
    await prisma.newsSource.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete news source error:', error);

    // 处理外键约束错误
    if (error.code === 'P2003' || error.code === 'P2014') {
      return NextResponse.json(
        { error: '无法删除：该新闻源有关联的抓取日志，请先删除相关日志' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '删除新闻源失败' },
      { status: 500 }
    );
  }
}

// 手动触发抓取
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const id = parseInt(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: '无效的ID' }, { status: 400 });
    }

    const source = await prisma.newsSource.findUnique({
      where: { id },
    });

    if (!source) {
      return NextResponse.json(
        { error: '新闻源不存在' },
        { status: 404 }
      );
    }

    // 异步触发抓取
    // 这里可以调用抓取函数或发送到任务队列
    const result = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/news/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceId: source.id }),
    });

    return NextResponse.json({
      success: true,
      message: '抓取任务已触发',
    });
  } catch (error) {
    console.error('Trigger crawl error:', error);
    return NextResponse.json(
      { error: '触发抓取失败' },
      { status: 500 }
    );
  }
}
