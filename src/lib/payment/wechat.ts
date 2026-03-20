import { WechatPay } from 'wechatpay-node-v3';
import { readFileSync } from 'fs';
import { join } from 'path';

// 微信支付配置
const wechatPayConfig = {
  appid: process.env.WECHAT_PAY_APP_ID || '',
  mchid: process.env.WECHAT_PAY_MCH_ID || '',
  publicKey: process.env.WECHAT_PAY_CERT_PATH
    ? readFileSync(join(process.cwd(), process.env.WECHAT_PAY_CERT_PATH))
    : Buffer.from(''),
  privateKey: process.env.WECHAT_PAY_KEY_PATH
    ? readFileSync(join(process.cwd(), process.env.WECHAT_PAY_KEY_PATH))
    : Buffer.from(''),
  key: process.env.WECHAT_PAY_API_KEY || '',
};

// 初始化微信支付 (仅在配置完整时)
export const wechatPay =
  wechatPayConfig.appid &&
  wechatPayConfig.mchid &&
  wechatPayConfig.key
    ? new WechatPay({
        appid: wechatPayConfig.appid,
        mchid: wechatPayConfig.mchid,
        publicKey: wechatPayConfig.publicKey,
        privateKey: wechatPayConfig.privateKey,
        key: wechatPayConfig.key,
      })
    : null;

/**
 * 创建微信支付订单 (JSAPI)
 * @param params 支付参数
 */
export async function createWechatOrder(params: {
  description: string;
  out_trade_no: string;
  notify_url: string;
  amount: { total: number };
  payer: { openid: string };
}) {
  if (!wechatPay) {
    throw new Error('微信支付未配置');
  }

  try {
    // 调用微信 Native 支付或 JSAPI 支付
    const result = await wechatPay.transactions_jsapi(params);
    return result;
  } catch (error) {
    console.error('微信支付下单失败:', error);
    throw error;
  }
}

/**
 * 查询微信支付订单
 * @param outTradeNo 商户订单号
 */
export async function queryWechatOrder(outTradeNo: string) {
  if (!wechatPay) {
    throw new Error('微信支付未配置');
  }

  try {
    const result = await wechatPay.query({ out_trade_no: outTradeNo });
    return result;
  } catch (error) {
    console.error('微信支付查询失败:', error);
    throw error;
  }
}

/**
 * 关闭微信支付订单
 * @param outTradeNo 商户订单号
 */
export async function closeWechatOrder(outTradeNo: string) {
  if (!wechatPay) {
    throw new Error('微信支付未配置');
  }

  try {
    const result = await wechatPay.close(outTradeNo);
    return result;
  } catch (error) {
    console.error('微信支付关闭失败:', error);
    throw error;
  }
}

/**
 * 验证微信支付通知签名
 * @param headers 请求头
 * @param body 请求体
 */
export function verifyWechatNotify(headers: any, body: any) {
  if (!wechatPay) {
    throw new Error('微信支付未配置');
  }

  try {
    // 解密并验证通知
    const result = wechatPay.decipher_gcm(headers, body);
    return result;
  } catch (error) {
    console.error('微信支付通知验证失败:', error);
    throw error;
  }
}

/**
 * 生成微信支付 JSAPI 调起支付参数
 * @param prepayId 预支付交易会话标识
 */
export function getWechatPayConfig(prepayId: string) {
  if (!wechatPay) {
    throw new Error('微信支付未配置');
  }

  // 生成调起支付的参数
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = Math.random().toString(36).substring(2, 15);
  const package_str = `prepay_id=${prepayId}`;

  const paySign = wechatPay.sign(
    [wechatPayConfig.appid, timestamp, nonceStr, package_str].join('\n') + '\n'
  );

  return {
    appId: wechatPayConfig.appid,
    timeStamp: timestamp,
    nonceStr,
    package: package_str,
    signType: 'RSA',
    paySign,
  };
}

// ============ 沙箱/测试模式 ============

/**
 * 模拟微信支付成功 (用于测试)
 */
export function mockWechatPaySuccess(orderNo: string) {
  return {
    success: true,
    orderNo,
    tradeState: 'SUCCESS',
    mock: true,
  };
}
