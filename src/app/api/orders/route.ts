import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// 获取用户的订单列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: '获取订单失败' }, { status: 500 });
  }
}

// 支付回调（模拟支付）
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { orderNo, payType = 'wechat' } = await request.json();

    const order = await prisma.order.findUnique({
      where: { orderNo },
    });

    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    // 验证订单归属
    if (order.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: '无权操作' }, { status: 403 });
    }

    // 更新订单为已支付
    const updatedOrder = await prisma.order.update({
      where: { orderNo },
      data: {
        status: 1,
        payType,
        payTime: new Date(),
      },
    });

    // 增加课程学生数
    await prisma.course.update({
      where: { id: order.courseId },
      data: {
        studentCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error('Pay order error:', error);
    return NextResponse.json({ error: '支付失败' }, { status: 500 });
  }
}
