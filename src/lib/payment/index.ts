import {
  wechatPay,
  createWechatOrder,
  queryWechatOrder,
  closeWechatOrder,
  verifyWechatNotify,
  getWechatPayConfig,
  mockWechatPaySuccess,
} from './wechat';

import {
  alipaySdk,
  createAlipayWapOrder,
  createAlipayPageOrder,
  queryAlipayOrder,
  closeAlipayOrder,
  verifyAlipayNotify,
  refundAlipayOrder,
  mockAlipaySuccess,
} from './alipay';

// 导出支付 SDK 实例
export { wechatPay, alipaySdk };

// 导出微信支付函数
export {
  createWechatOrder,
  queryWechatOrder,
  closeWechatOrder,
  verifyWechatNotify,
  getWechatPayConfig,
  mockWechatPaySuccess,
};

// 导出支付宝支付函数
export {
  createAlipayWapOrder,
  createAlipayPageOrder,
  queryAlipayOrder,
  closeAlipayOrder,
  verifyAlipayNotify,
  refundAlipayOrder,
  mockAlipaySuccess,
};

// 支付类型
export type PayType = 'wechat' | 'alipay';

// 订单状态
export enum OrderStatus {
  PENDING = 0,    // 待支付
  PAID = 1,       // 已支付
  CANCELLED = 2,  // 已取消
  REFUNDED = 3,   // 已退款
}

// 检查支付方式是否可用
export function isPayAvailable(type: PayType): boolean {
  if (type === 'wechat') {
    return !!wechatPay;
  }
  if (type === 'alipay') {
    return !!alipaySdk;
  }
  return false;
}

// 获取可用的支付方式列表
export function getAvailablePayTypes(): { value: string; label: string }[] {
  const types: { value: string; label: string }[] = [];

  if (wechatPay) {
    types.push({ value: 'wechat', label: '微信支付' });
  }
  if (alipaySdk) {
    types.push({ value: 'alipay', label: '支付宝' });
  }

  return types;
}

// 统一的支付创建接口
export async function createPayOrder(
  type: PayType,
  params: {
    orderNo: string;
    amount: number;
    description: string;
    returnUrl: string;
    notifyUrl: string;
    openid?: string; // 微信支付需要
  }
) {
  switch (type) {
    case 'wechat':
      if (!params.openid) {
        throw new Error('微信支付需要用户 openid');
      }
      const wechatResult = await createWechatOrder({
        description: params.description,
        out_trade_no: params.orderNo,
        notify_url: params.notifyUrl,
        amount: { total: Math.round(params.amount * 100) }, // 转换为分
        payer: { openid: params.openid },
      });
      return {
        type: 'wechat',
        ...wechatResult,
      };

    case 'alipay':
      const alipayResult = await createAlipayWapOrder({
        outTradeNo: params.orderNo,
        totalAmount: params.amount.toFixed(2),
        subject: params.description,
        returnUrl: params.returnUrl,
        notifyUrl: params.notifyUrl,
      });
      return {
        type: 'alipay',
        form: alipayResult,
      };

    default:
      throw new Error(`不支持的支付方式: ${type}`);
  }
}
