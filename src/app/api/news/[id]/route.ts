import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// 更新资讯
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr);
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

    // 检查 slug 是否被其他文章使用
    const existing = await prisma.news.findFirst({
      where: {
        slug,
        id: { not: id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'URL 标识已被其他文章使用' },
        { status: 400 }
      );
    }

    // 处理 tags
    let tagsJson = null;
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
      tagsJson = JSON.stringify(tagArray);
    }

    // 获取当前文章
    const currentNews = await prisma.news.findUnique({
      where: { id },
    });

    // 更新资讯
    const news = await prisma.news.update({
      where: { id },
      data: {
        title,
        slug,
        summary,
        content,
        category,
        tags: tagsJson,
        author,
        source,
        sourceUrl,
        coverImage,
        status,
        isHot,
        publishedAt: status === 1 && !currentNews?.publishedAt
          ? new Date()
          : currentNews?.publishedAt,
      },
    });

    return NextResponse.json({ success: true, news });
  } catch (error) {
    console.error('Update news error:', error);
    return NextResponse.json(
      { error: '更新资讯失败' },
      { status: 500 }
    );
  }
}

// 删除资讯
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr);

    await prisma.news.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete news error:', error);
    return NextResponse.json(
      { error: '删除资讯失败' },
      { status: 500 }
    );
  }
}
