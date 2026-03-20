import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// 获取资讯的所有评论
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { newsId, status: 1 }, // 只显示已通过审核的评论
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.comment.count({ where: { newsId, status: 1 } }), // 只统计已通过的数量
    ]);

    return NextResponse.json({
      comments,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch comments:', error);
    return NextResponse.json(
      { error: '获取评论失败' },
      { status: 500 }
    );
  }
}

// 提交评论
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

    const body = await request.json();
    const { content } = body;

    // 验证评论内容
    if (!content || content.trim().length < 2) {
      return NextResponse.json(
        { error: '评论内容至少 2 个字符' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);
    const userMembership = (session.user as any).membership || 'MEMBER';
    const isFounder = userMembership === 'FOUNDER';

    // 创建评论并更新评论数
    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          content: content.trim(),
          newsId,
          userId,
          status: 0, // 默认待审核
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      // 创始股东创建贡献记录
      if (isFounder) {
        await tx.founderContribution.create({
          data: {
            userId,
            type: 'REVIEW',
            title: '提交资讯评论',
            description: content.trim().substring(0, 100) + '...',
            status: 0,
            points: 1,
            reviewId: newComment.id,
          },
        });
      }

      // 注意：不立即更新评论数，因为需要审核通过后才显示

      return newComment;
    });

    return NextResponse.json({
      comment,
      message: '评论提交成功，等待审核',
    });
  } catch (error: any) {
    console.error('Failed to submit comment:', error);
    return NextResponse.json(
      { error: '提交评论失败' },
      { status: 500 }
    );
  }
}
