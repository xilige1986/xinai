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
    const reviewId = parseInt(id);
    if (isNaN(reviewId)) {
      return NextResponse.json({ error: 'Invalid review ID' }, { status: 400 });
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

    // 获取点评信息
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { tool: true },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // 执行审核操作
    await prisma.$transaction(async (tx) => {
      // 更新点评状态
      await tx.review.update({
        where: { id: reviewId },
        data: { status: newStatus },
      });

      // 如果是通过且之前不是已通过状态，更新工具评分统计并添加贡献积分
      if (action === 'approve' && review.status !== 1) {
        await tx.tool.update({
          where: { id: review.toolId },
          data: {
            ratingSum: { increment: review.rating },
            ratingCount: { increment: 1 },
          },
        });

        // 给创始股东添加贡献积分
        const contribution = await tx.founderContribution.findFirst({
          where: {
            userId: review.userId,
            reviewId: reviewId,
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

      // 如果是拒绝一个之前已通过的点评，减少工具评分统计
      if (action === 'reject' && review.status === 1) {
        await tx.tool.update({
          where: { id: review.toolId },
          data: {
            ratingSum: { decrement: review.rating },
            ratingCount: { decrement: 1 },
          },
        });
      }

      // 如果是拒绝且有待审核的贡献记录，拒绝贡献
      if (action === 'reject') {
        const contribution = await tx.founderContribution.findFirst({
          where: {
            userId: review.userId,
            reviewId: reviewId,
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
    console.error('Failed to moderate review:', error);
    return NextResponse.json(
      { error: '操作失败' },
      { status: 500 }
    );
  }
}

// 删除点评
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
    const reviewId = parseInt(id);
    if (isNaN(reviewId)) {
      return NextResponse.json({ error: 'Invalid review ID' }, { status: 400 });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 删除点评
      await tx.review.delete({
        where: { id: reviewId },
      });

      // 如果点评已通过，减少工具评分统计
      if (review.status === 1) {
        await tx.tool.update({
          where: { id: review.toolId },
          data: {
            ratingSum: { decrement: review.rating },
            ratingCount: { decrement: 1 },
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: '点评已删除',
    });
  } catch (error: any) {
    console.error('Failed to delete review:', error);
    return NextResponse.json(
      { error: '删除失败' },
      { status: 500 }
    );
  }
}
