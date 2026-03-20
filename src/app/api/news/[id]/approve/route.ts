import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const newsId = parseInt(id);
    if (isNaN(newsId)) {
      return NextResponse.json({ error: 'Invalid news ID' }, { status: 400 });
    }

    // 获取资讯信息
    const news = await prisma.news.findUnique({
      where: { id: newsId },
    });

    if (!news) {
      return NextResponse.json({ error: 'News not found' }, { status: 404 });
    }

    // 更新资讯状态并处理贡献积分
    const updatedNews = await prisma.$transaction(async (tx) => {
      // 更新资讯状态为已发布
      const updated = await tx.news.update({
        where: { id: newsId },
        data: {
          status: 1,
          publishedAt: news.publishedAt || new Date(),
        },
      });

      // 给创始股东添加贡献积分
      const contribution = await tx.founderContribution.findFirst({
        where: {
          newsId: newsId,
          type: 'NEWS',
        },
      });

      if (contribution && contribution.status === 0) {
        await tx.founderContribution.update({
          where: { id: contribution.id },
          data: { status: 1 },
        });
      }

      return updated;
    });

    // 检查是否是 form 提交（来自 admin 页面）
    const contentType = request.headers.get('content-type') || '';
    const isFormSubmit = contentType.includes('application/x-www-form-urlencoded') ||
                         contentType.includes('multipart/form-data');

    if (isFormSubmit) {
      // 重定向回 admin 页面
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    return NextResponse.json({ news: updatedNews, message: '资讯已通过审核' });
  } catch (error: any) {
    console.error('Failed to approve news:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to approve news' },
      { status: 500 }
    );
  }
}
