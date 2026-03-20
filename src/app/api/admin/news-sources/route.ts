import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// 获取所有新闻源
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const activeOnly = searchParams.get('active') === 'true';

    const where: any = {};
    if (type) {
      where.type = type;
    }
    if (activeOnly) {
      where.isActive = true;
    }

    const sources = await prisma.newsSource.findMany({
      where,
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ sources });
  } catch (error) {
    console.error('Get news sources error:', error);
    return NextResponse.json(
      { error: '获取新闻源列表失败' },
      { status: 500 }
    );
  }
}

// 创建新闻源（仅管理员）
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // 验证必填字段
    if (!data.name || !data.type) {
      return NextResponse.json(
        { error: '名称和类型为必填项' },
        { status: 400 }
      );
    }

    // 根据类型验证
    if (data.type === 'rss' && !data.rssUrl) {
      return NextResponse.json(
        { error: 'RSS类型需要提供rssUrl' },
        { status: 400 }
      );
    }

    if (data.type === 'api' && !data.apiUrl) {
      return NextResponse.json(
        { error: 'API类型需要提供apiUrl' },
        { status: 400 }
      );
    }

    const source = await prisma.newsSource.create({
      data: {
        name: data.name,
        type: data.type,
        category: data.category || 'AI资讯',
        rssUrl: data.rssUrl || null,
        apiUrl: data.apiUrl || null,
        apiKey: data.apiKey || null,
        apiParams: data.apiParams || null,
        fetchInterval: data.fetchInterval || 60,
        isActive: data.isActive ?? true,
        fieldMapping: data.fieldMapping || null,
      },
    });

    return NextResponse.json({ success: true, source });
  } catch (error) {
    console.error('Create news source error:', error);
    return NextResponse.json(
      { error: '创建新闻源失败' },
      { status: 500 }
    );
  }
}

// 更新新闻源（仅管理员）
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        { error: '缺少ID参数' },
        { status: 400 }
      );
    }

    const source = await prisma.newsSource.update({
      where: { id: parseInt(id) },
      data: {
        name: updateData.name,
        type: updateData.type,
        category: updateData.category,
        rssUrl: updateData.rssUrl,
        apiUrl: updateData.apiUrl,
        apiKey: updateData.apiKey,
        apiParams: updateData.apiParams,
        fetchInterval: updateData.fetchInterval,
        isActive: updateData.isActive,
        fieldMapping: updateData.fieldMapping,
      },
    });

    return NextResponse.json({ success: true, source });
  } catch (error) {
    console.error('Update news source error:', error);
    return NextResponse.json(
      { error: '更新新闻源失败' },
      { status: 500 }
    );
  }
}
