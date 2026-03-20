import { Resend } from 'resend';

// 初始化 Resend（需要配置 API Key）
const resendApiKey = process.env.RESEND_API_KEY;

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

// 发件人邮箱（需要从 Resend 验证的域名配置）
export const FROM_EMAIL = process.env.FROM_EMAIL || 'newsletter@yourdomain.com';

// 检查邮件服务是否可用
export function isEmailServiceEnabled(): boolean {
  return !!resend && !!resendApiKey;
}
