import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(session.user.id);
    const courseId = parseInt(id);

    if (isNaN(courseId)) {
      return NextResponse.json({ error: '无效的课程ID' }, { status: 400 });
    }

    // 获取课程信息
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: '课程不存在' }, { status: 404 });
    }

    // 检查课程是否支持积分购买
    if (!course.allowPointsPurchase || course.pointsRequired <= 0) {
      return NextResponse.json({ error: '该课程不支持积分兑换' }, { status: 400 });
    }

    // 检查是否已解锁
    const existingAccess = await prisma.coursePointsAccess.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (existingAccess) {
      return NextResponse.json({ error: '您已解锁该课程' }, { status: 400 });
    }

    // 检查是否已购买（资金）
    const existingOrder = await prisma.order.findFirst({
      where: {
        userId,
        courseId,
        status: 1,
      },
    });

    if (existingOrder) {
      return NextResponse.json({ error: '您已购买该课程' }, { status: 400 });
    }

    // 获取用户积分
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });

    const userPoints = user?.points || 0;

    if (userPoints < course.pointsRequired) {
      return NextResponse.json({
        error: '积分不足',
        required: course.pointsRequired,
        current: userPoints,
      }, { status: 400 });
    }

    // 扣除积分并创建解锁记录
    await prisma.$transaction([
      // 扣除用户积分
      prisma.user.update({
        where: { id: userId },
        data: { points: { decrement: course.pointsRequired } },
      }),
      // 创建解锁记录
      prisma.coursePointsAccess.create({
        data: {
          userId,
          courseId,
          points: course.pointsRequired,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: '兑换成功',
      consumedPoints: course.pointsRequired,
    });
  } catch (error) {
    console.error('Unlock course error:', error);
    return NextResponse.json({ error: '兑换失败，请稍后重试' }, { status: 500 });
  }
}
