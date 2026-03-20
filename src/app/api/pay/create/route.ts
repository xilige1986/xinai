import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  createPayOrder,
  isPayAvailable,
  OrderStatus,
} from '@/lib/payment';

// 使用 Node.js 运行时
export const runtime = 'nodejs';

/**
 * 创建支付订单
 * POST /api/pay/create
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { orderId, payType } = await request.json();

    if (!orderId || !payType) {
      return NextResponse.json(
        { error: '参数错误' },
        { status: 400 }
      );
    }

    // 检查支付方式是否可用
    if (!isPayAvailable(payType)) {
      return NextResponse.json(
        { error: `${payType} 支付未配置` },
        { status: 400 }
      );
    }

    // 查询订单
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { course: true },
    });

    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    // 验证订单归属
    if (order.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: '无权操作' }, { status: 403 });
    }

    // 检查订单状态
    if (order.status !== OrderStatus.PENDING) {
      return NextResponse.json(
        { error: '订单状态不正确' },
        { status: 400 }
      );
    }

    // 获取用户 openid (微信支付需要)
    let openid = '';
    if (payType === 'wechat') {
      // 从 session 或数据库获取用户的微信 openid
      // 这里简化处理，实际需要从微信授权获取
      openid = (session.user as any).openid || '';

      if (!openid) {
        return NextResponse.json(
          { error: '请先绑定微信', needBind: true },
          { status: 400 }
        );
      }
    }

    // 创建支付订单
    const notifyUrl = `${process.env.PAY_NOTIFY_URL}/${payType}`;
    const returnUrl = `${process.env.PAY_SUCCESS_URL}?orderNo=${order.orderNo}`;

    const payResult = await createPayOrder(payType, {
      orderNo: order.orderNo,
      amount: order.amount,
      description: `购买课程：${order.course.title}`,
      notifyUrl,
      returnUrl,
      openid,
    });

    return NextResponse.json({
      success: true,
      data: payResult,
    });
  } catch (error) {
    console.error('Create pay order error:', error);
    return NextResponse.json(
      { error: '创建支付订单失败' },
      { status: 500 }
    );
  }
}

/**
 * 查询支付状态
 * GET /api/pay/query?orderNo=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const orderNo = request.nextUrl.searchParams.get('orderNo');
    if (!orderNo) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: { orderNo },
    });

    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    // 检查订单归属
    if (order.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: '无权操作' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      order: {
        orderNo: order.orderNo,
        status: order.status,
        payType: order.payType,
        payTime: order.payTime,
      },
    });
  } catch (error) {
    console.error('Query pay status error:', error);
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}
