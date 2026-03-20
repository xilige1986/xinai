import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// 创建资讯
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();

    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;
    const summary = formData.get('summary') as string;
    const content = formData.get('content') as string;
    const category = formData.get('category') as string;
    const tags = formData.get('tags') as string;
    const author = formData.get('author') as string;
    const source = formData.get('source') as string;
    const sourceUrl = formData.get('sourceUrl') as string;
    const coverImage = formData.get('coverImage') as string;
    const status = parseInt(formData.get('status') as string) || 0;
    const isHot = formData.get('isHot') === 'true';

    // 验证必填字段
    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: '标题、URL标识和正文内容为必填项' },
        { status: 400 }
      );
    }

    // 检查 slug 是否已存在
    const existing = await prisma.news.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'URL 标识已存在，请更换' },
        { status: 400 }
      );
    }

    // 处理 tags
    let tagsJson = null;
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
      tagsJson = JSON.stringify(tagArray);
    }

    // 判断是否聚合新闻（有 sourceUrl 且不为空）
    const isAggregated = !!(sourceUrl && sourceUrl.trim());

    // 创建资讯
    const news = await prisma.news.create({
      data: {
        title,
        slug,
        summary,
        content: isAggregated ? null : content, // 聚合新闻不存正文
        category,
        tags: tagsJson,
        author,
        source,
        sourceUrl,
        isAggregated, // 自动判断
        coverImage,
        status,
        isHot,
        publishedAt: status === 1 ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, news });
  } catch (error) {
    console.error('Create news error:', error);
    return NextResponse.json(
      { error: '创建资讯失败' },
      { status: 500 }
    );
  }
}

// 获取资讯列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const source = searchParams.get('source');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const where: any = {};

    // 默认只显示已发布的
    if (status !== null) {
      where.status = parseInt(status);
    } else {
      where.status = 1;
    }

    if (category) {
      where.category = category;
    }

    if (source) {
      where.source = source;
    }

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        orderBy: [{ isHot: 'desc' }, { publishedAt: 'desc' }],
        take: limit,
        skip,
      }),
      prisma.news.count({ where }),
    ]);

    return NextResponse.json({
      news,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get news error:', error);
    return NextResponse.json(
      { error: '获取资讯列表失败' },
      { status: 500 }
    );
  }
}
