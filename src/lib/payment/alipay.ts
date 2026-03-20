import { AlipaySdk } from 'alipay-sdk';

// 支付宝配置
const alipayConfig = {
  appId: process.env.ALIPAY_APP_ID || '',
  privateKey: process.env.ALIPAY_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY?.replace(/\\n/g, '\n') || '',
  gateway: process.env.ALIPAY_GATEWAY_URL || 'https://openapi.alipay.com/gateway.do',
  sandbox: process.env.ALIPAY_SANDBOX === 'true',
};

// 初始化支付宝 SDK (仅在配置完整时)
export const alipaySdk =
  alipayConfig.appId && alipayConfig.privateKey
    ? new AlipaySdk({
        appId: alipayConfig.appId,
        privateKey: alipayConfig.privateKey,
        alipayPublicKey: alipayConfig.alipayPublicKey,
        gateway: alipayConfig.gateway,
        signType: 'RSA2',
        charset: 'utf-8',
        version: '1.0',
      })
    : null;

/**
 * 创建支付宝手机网站支付订单
 * @param params 支付参数
 */
export async function createAlipayWapOrder(params: {
  outTradeNo: string;
  totalAmount: string;
  subject: string;
  body?: string;
  returnUrl: string;
  notifyUrl: string;
}) {
  if (!alipaySdk) {
    throw new Error('支付宝支付未配置');
  }

  try {
    // 调用支付宝手机网站支付
    const result = await alipaySdk.exec('alipay.trade.wap.pay', {
      notify_url: params.notifyUrl,
      bizContent: {
        out_trade_no: params.outTradeNo,
        total_amount: params.totalAmount,
        subject: params.subject,
        body: params.body || params.subject,
        product_code: 'QUICK_WAP_WAY',
        quit_url: params.returnUrl,
      },
    });

    // 返回的是 HTML 表单，需要在前端提交
    return result as string;
  } catch (error) {
    console.error('支付宝支付下单失败:', error);
    throw error;
  }
}

/**
 * 创建支付宝电脑网站支付订单
 * @param params 支付参数
 */
export async function createAlipayPageOrder(params: {
  outTradeNo: string;
  totalAmount: string;
  subject: string;
  body?: string;
  returnUrl: string;
  notifyUrl: string;
}) {
  if (!alipaySdk) {
    throw new Error('支付宝支付未配置');
  }

  try {
    const result = await alipaySdk.exec('alipay.trade.page.pay', {
      notify_url: params.notifyUrl,
      bizContent: {
        out_trade_no: params.outTradeNo,
        total_amount: params.totalAmount,
        subject: params.subject,
        body: params.body || params.subject,
        product_code: 'FAST_INSTANT_TRADE_PAY',
      },
    });

    return result as string;
  } catch (error) {
    console.error('支付宝支付下单失败:', error);
    throw error;
  }
}

/**
 * 查询支付宝订单
 * @param outTradeNo 商户订单号
 */
export async function queryAlipayOrder(outTradeNo: string) {
  if (!alipaySdk) {
    throw new Error('支付宝支付未配置');
  }

  try {
    const result = await alipaySdk.exec('alipay.trade.query', {
      bizContent: {
        out_trade_no: outTradeNo,
      },
    });

    return result;
  } catch (error) {
    console.error('支付宝订单查询失败:', error);
    throw error;
  }
}

/**
 * 关闭支付宝订单
 * @param outTradeNo 商户订单号
 */
export async function closeAlipayOrder(outTradeNo: string) {
  if (!alipaySdk) {
    throw new Error('支付宝支付未配置');
  }

  try {
    const result = await alipaySdk.exec('alipay.trade.close', {
      bizContent: {
        out_trade_no: outTradeNo,
      },
    });

    return result;
  } catch (error) {
    console.error('支付宝订单关闭失败:', error);
    throw error;
  }
}

/**
 * 验证支付宝异步通知
 * @param notifyData 通知数据
 */
export function verifyAlipayNotify(notifyData: Record<string, string>) {
  if (!alipaySdk) {
    throw new Error('支付宝支付未配置');
  }

  try {
    const sign = notifyData.sign;
    const signType = notifyData.sign_type;

    // 移除 sign 和 sign_type 进行验签
    const dataToVerify = { ...notifyData };
    delete dataToVerify.sign;
    delete dataToVerify.sign_type;

    const isValid = alipaySdk.checkSign(
      dataToVerify,
      sign,
      signType as 'RSA2'
    );

    return isValid;
  } catch (error) {
    console.error('支付宝通知验签失败:', error);
    return false;
  }
}

/**
 * 支付宝订单退款
 * @param params 退款参数
 */
export async function refundAlipayOrder(params: {
  outTradeNo: string;
  refundAmount: string;
  outRequestNo: string; // 退款请求号，同一笔退款需要唯一
  refundReason?: string;
}) {
  if (!alipaySdk) {
    throw new Error('支付宝支付未配置');
  }

  try {
    const result = await alipaySdk.exec('alipay.trade.refund', {
      bizContent: {
        out_trade_no: params.outTradeNo,
        refund_amount: params.refundAmount,
        out_request_no: params.outRequestNo,
        refund_reason: params.refundReason || '用户申请退款',
      },
    });

    return result;
  } catch (error) {
    console.error('支付宝退款失败:', error);
    throw error;
  }
}

// ============ 沙箱/测试模式 ============

/**
 * 模拟支付宝支付成功 (用于测试)
 */
export function mockAlipaySuccess(orderNo: string) {
  return {
    success: true,
    orderNo,
    tradeStatus: 'TRADE_SUCCESS',
    mock: true,
  };
}
