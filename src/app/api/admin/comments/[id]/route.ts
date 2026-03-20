import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// 处理form action方式的审核（通过或拒绝）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const commentId = parseInt(id);
    if (isNaN(commentId)) {
      return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 });
    }

    // 支持form-data和JSON两种方式
    let action: string;
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      action = body.action;
    } else {
      const formData = await request.formData();
      action = formData.get('action') as string;
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 1 : 2;

    // 获取评论信息
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { news: true },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // 执行审核操作
    await prisma.$transaction(async (tx) => {
      // 更新评论状态
      await tx.comment.update({
        where: { id: commentId },
        data: { status: newStatus },
      });

      // 如果是通过且之前不是已通过状态，更新资讯评论数并添加贡献积分
      if (action === 'approve' && comment.status !== 1) {
        await tx.news.update({
          where: { id: comment.newsId },
          data: { comments: { increment: 1 } },
        });

        // 给创始股东添加贡献积分
        const contribution = await tx.founderContribution.findFirst({
          where: {
            userId: comment.userId,
            reviewId: commentId,
            type: 'REVIEW',
          },
        });

        if (contribution && contribution.status === 0) {
          await tx.founderContribution.update({
            where: { id: contribution.id },
            data: { status: 1 },
          });
        }
      }

      // 如果是拒绝一个之前已通过的评论，减少资讯评论数
      if (action === 'reject' && comment.status === 1) {
        await tx.news.update({
          where: { id: comment.newsId },
          data: { comments: { decrement: 1 } },
        });
      }

      // 如果是拒绝且有待审核的贡献记录，拒绝贡献
      if (action === 'reject') {
        const contribution = await tx.founderContribution.findFirst({
          where: {
            userId: comment.userId,
            reviewId: commentId,
            type: 'REVIEW',
            status: 0,
          },
        });

        if (contribution) {
          await tx.founderContribution.update({
            where: { id: contribution.id },
            data: { status: 2 },
          });
        }
      }
    });

    // 重定向回admin首页
    return NextResponse.redirect(new URL('/admin', request.url));
  } catch (error: any) {
    console.error('Failed to moderate comment:', error);
    return NextResponse.json(
      { error: '操作失败' },
      { status: 500 }
    );
  }
}

// 删除评论
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const commentId = parseInt(id);
    if (isNaN(commentId)) {
      return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 删除评论
      await tx.comment.delete({
        where: { id: commentId },
      });

      // 如果评论已通过，减少资讯评论数
      if (comment.status === 1) {
        await tx.news.update({
          where: { id: comment.newsId },
          data: { comments: { decrement: 1 } },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: '评论已删除',
    });
  } catch (error: any) {
    console.error('Failed to delete comment:', error);
    return NextResponse.json(
      { error: '删除失败' },
      { status: 500 }
    );
  }
}
