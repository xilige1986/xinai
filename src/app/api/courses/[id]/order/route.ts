import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// 生成订单号
function generateOrderNo(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `C${year}${month}${day}${random}`;
}

// 创建订单
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { id } = await params;
    const courseId = parseInt(id);
    const userId = parseInt(session.user.id);

    // 获取课程信息
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: '课程不存在' }, { status: 404 });
    }

    // 免费课程无需购买
    if (course.price === 0) {
      return NextResponse.json({ error: '免费课程无需购买' }, { status: 400 });
    }

    // 检查是否已购买
    const existingOrder = await prisma.order.findFirst({
      where: {
        userId,
        courseId,
        status: 1, // 已支付
      },
    });

    if (existingOrder) {
      return NextResponse.json({ error: '您已购买该课程' }, { status: 400 });
    }

    // 检查是否有未支付的订单
    const pendingOrder = await prisma.order.findFirst({
      where: {
        userId,
        courseId,
        status: 0, // 待支付
      },
    });

    if (pendingOrder) {
      return NextResponse.json({
        order: pendingOrder,
        message: '您有未完成的订单',
      });
    }

    // 创建新订单
    const order = await prisma.order.create({
      data: {
        orderNo: generateOrderNo(),
        userId,
        courseId,
        amount: course.price,
        status: 0, // 待支付
      },
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: '创建订单失败' }, { status: 500 });
  }
}
