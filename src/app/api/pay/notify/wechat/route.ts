import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyWechatNotify, verifyAlipayNotify, OrderStatus } from '@/lib/payment';

// 使用 Node.js 运行时（避免 Edge Runtime 与 formidable 不兼容）
export const runtime = 'nodejs';

/**
 * 微信支付异步通知
 * POST /api/pay/notify/wechat
 */
export async function POST(request: NextRequest) {
  try {
    // 读取请求头
    const timestamp = request.headers.get('Wechatpay-Timestamp') || '';
    const nonce = request.headers.get('Wechatpay-Nonce') || '';
    const signature = request.headers.get('Wechatpay-Signature') || '';
    const serial = request.headers.get('Wechatpay-Serial') || '';

    // 读取请求体
    const body = await request.text();

    // 验证签名并解密
    const result = verifyWechatNotify(
      { timestamp, nonce, signature, serial },
      body
    );

    const data = result as any;

    // 查询订单
    const order = await prisma.order.findFirst({
      where: { orderNo: data.out_trade_no },
    });

    if (!order) {
      console.error('订单不存在:', data.out_trade_no);
      return new Response('SUCCESS', { status: 200 }); // 返回成功避免微信重复通知
    }

    // 已处理过，直接返回成功
    if (order.status === OrderStatus.PAID) {
      return new Response('SUCCESS', { status: 200 });
    }

    // 更新订单状态
    if (data.trade_state === 'SUCCESS') {
      await prisma.$transaction(async (tx) => {
        // 更新订单
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.PAID,
            payType: 'wechat',
            payTime: new Date(),
          },
        });

        // 增加课程学生数
        await tx.course.update({
          where: { id: order.courseId },
          data: { studentCount: { increment: 1 } },
        });
      });

      console.log('微信支付成功:', order.orderNo);
    }

    return new Response('SUCCESS', { status: 200 });
  } catch (error) {
    console.error('微信支付通知处理失败:', error);
    return new Response('FAIL', { status: 500 });
  }
}
