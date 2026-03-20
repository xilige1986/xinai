import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAlipayNotify, OrderStatus } from '@/lib/payment';

// 使用 Node.js 运行时
export const runtime = 'nodejs';

/**
 * 支付宝异步通知
 * POST /api/pay/notify/alipay
 */
export async function POST(request: NextRequest) {
  try {
    // 读取表单数据
    const formData = await request.formData();
    const notifyData: Record<string, string> = {};

    formData.forEach((value, key) => {
      notifyData[key] = value.toString();
    });

    // 验签
    const isValid = verifyAlipayNotify(notifyData);

    if (!isValid) {
      console.error('支付宝通知验签失败');
      return new Response('fail', { status: 400 });
    }

    const { out_trade_no, trade_status } = notifyData;

    // 查询订单
    const order = await prisma.order.findFirst({
      where: { orderNo: out_trade_no },
    });

    if (!order) {
      console.error('订单不存在:', out_trade_no);
      return new Response('success', { status: 200 }); // 返回成功避免支付宝重复通知
    }

    // 已处理过，直接返回成功
    if (order.status === OrderStatus.PAID) {
      return new Response('success', { status: 200 });
    }

    // 更新订单状态
    if (trade_status === 'TRADE_SUCCESS' || trade_status === 'TRADE_FINISHED') {
      await prisma.$transaction(async (tx) => {
        // 更新订单
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.PAID,
            payType: 'alipay',
            payTime: new Date(),
          },
        });

        // 增加课程学生数
        await tx.course.update({
          where: { id: order.courseId },
          data: { studentCount: { increment: 1 } },
        });
      });

      console.log('支付宝支付成功:', order.orderNo);
    }

    return new Response('success', { status: 200 });
  } catch (error) {
    console.error('支付宝通知处理失败:', error);
    return new Response('fail', { status: 500 });
  }
}
