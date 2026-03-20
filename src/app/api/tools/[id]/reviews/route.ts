import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// 获取工具的所有点评
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const toolId = parseInt(id);
    if (isNaN(toolId)) {
      return NextResponse.json({ error: 'Invalid tool ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { toolId, status: 1 }, // 只显示已通过审核的点评
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
      prisma.review.count({ where: { toolId, status: 1 } }), // 只统计已通过的
    ]);

    // 获取统计信息（只统计已通过的）
    const stats = await prisma.review.groupBy({
      by: ['rating'],
      where: { toolId, status: 1 }, // 只统计已通过的
      _count: {
        rating: true,
      },
    });

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;
    let ratingCount = 0;

    stats.forEach((stat) => {
      ratingDistribution[stat.rating] = stat._count.rating;
      totalRating += stat.rating * stat._count.rating;
      ratingCount += stat._count.rating;
    });

    const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : '0.0';

    return NextResponse.json({
      reviews,
      total,
      averageRating,
      ratingCount,
      ratingDistribution,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch reviews:', error);
    return NextResponse.json(
      { error: '获取点评失败' },
      { status: 500 }
    );
  }
}

// 提交点评
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
    const toolId = parseInt(id);
    if (isNaN(toolId)) {
      return NextResponse.json({ error: 'Invalid tool ID' }, { status: 400 });
    }

    const body = await request.json();
    const { rating, content } = body;

    // 验证评分
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: '评分必须在 1-5 之间' },
        { status: 400 }
      );
    }

    // 验证点评内容
    if (!content || content.trim().length < 5) {
      return NextResponse.json(
        { error: '点评内容至少 5 个字符' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);
    const userMembership = (session.user as any).membership || 'MEMBER';
    const isFounder = userMembership === 'FOUNDER';

    // 检查是否已点评过
    const existingReview = await prisma.review.findUnique({
      where: {
        toolId_userId: {
          toolId,
          userId,
        },
      },
    });

    let review;
    const oldRating = existingReview?.rating || 0;

    await prisma.$transaction(async (tx) => {
      if (existingReview) {
        // 更新已有点评（如果是已通过审核的，需要更新评分统计）
        const wasApproved = existingReview.status === 1;
        review = await tx.review.update({
          where: { id: existingReview.id },
          data: {
            rating,
            content: content.trim(),
            status: 0, // 修改后重新进入待审核状态
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

        // 只有之前已通过审核的点评才需要更新评分统计（因为新点评不计入）
        if (wasApproved) {
          await tx.tool.update({
            where: { id: toolId },
            data: {
              ratingSum: { decrement: oldRating }, // 减去旧评分
            },
          });
        }

        // 创始股东更新贡献记录状态为待审核
        if (isFounder) {
          const existingContribution = await tx.founderContribution.findFirst({
            where: {
              userId,
              reviewId: existingReview.id,
              type: 'REVIEW',
            },
          });
          if (existingContribution) {
            await tx.founderContribution.update({
              where: { id: existingContribution.id },
              data: { status: 0 },
            });
          }
        }
      } else {
        // 创建新点评
        review = await tx.review.create({
          data: {
            rating,
            content: content.trim(),
            toolId,
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
              title: '提交工具点评',
              description: content.trim().substring(0, 100) + '...',
              status: 0,
              points: 1,
              reviewId: review.id,
            },
          });
        }

        // 新点评不计入评分统计，审核通过后才计入
      }
    });

    return NextResponse.json({
      review,
      message: existingReview ? '点评已更新，等待审核' : '点评提交成功，等待审核',
    });
  } catch (error: any) {
    console.error('Failed to submit review:', error);
    return NextResponse.json(
      { error: '提交点评失败' },
      { status: 500 }
    );
  }
}
