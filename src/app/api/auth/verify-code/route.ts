import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Resend } from 'resend';

// 初始化Resend（邮件服务）
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// 生成6位数字验证码
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 发送邮件验证码
async function sendEmailCode(email: string, code: string): Promise<boolean> {
  try {
    if (!resend) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Resend API key not configured; in production verification would fail.');
        console.log(`[DEV only] Email verification code for ${email}: ${code}`);
      } else {
        console.error('Resend API key not configured');
      }
      return process.env.NODE_ENV !== 'production';
    }

    const fromEmail = process.env.FROM_EMAIL || 'noreply@example.com';
    const siteName = process.env.SITE_NAME || 'AI工具库';

    await resend.emails.send({
      from: `${siteName} <${fromEmail}>`,
      to: email,
      subject: `【${siteName}】邮箱验证码`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 20px;">邮箱验证码</h2>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            您好！您正在进行注册验证，您的验证码是：
          </p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 4px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #333; letter-spacing: 8px;">${code}</span>
          </div>
          <p style="color: #999; font-size: 12px;">
            验证码有效期为10分钟，请勿泄露给他人。如非本人操作，请忽略此邮件。
          </p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// 发送短信验证码（使用阿里云SMS）
async function sendSmsCode(phone: string, code: string): Promise<boolean> {
  try {
    // 检查是否配置了短信服务
    if (!process.env.SMS_ACCESS_KEY_ID || !process.env.SMS_ACCESS_KEY_SECRET) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV only] SMS verification code for ${phone}: ${code}`);
      }
      return process.env.NODE_ENV !== 'production';
    }

    // 阿里云SMS SDK 需要额外安装
    // 这里提供基本实现，实际使用时需要安装 @alicloud/dysmsapi20170525
    const accessKeyId = process.env.SMS_ACCESS_KEY_ID;
    const accessKeySecret = process.env.SMS_ACCESS_KEY_SECRET;
    const signName = process.env.SMS_SIGN_NAME || 'AI工具库';
    const templateCode = process.env.SMS_TEMPLATE_CODE;

    if (!accessKeyId || !accessKeySecret) {
      console.error('SMS credentials not configured');
      return false;
    }

    // TODO: 实现阿里云SMS调用
    // 这里仅作演示，实际需要调用阿里云SDK
    console.log(`Sending SMS to ${phone} with code ${code}`);

    return true;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return false;
  }
}

// 检查验证码开关是否启用
async function isVerificationEnabled(type: 'email' | 'phone'): Promise<boolean> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: type === 'email' ? 'registerEmailVerify' : 'registerPhoneVerify' },
    });
    return setting ? setting.value === 'true' : false;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, email, phone } = body;

    // 验证参数
    if (!type || (type !== 'email' && type !== 'phone')) {
      return NextResponse.json(
        { error: '请指定验证类型' },
        { status: 400 }
      );
    }

    // 检查该类型的验证码是否已启用
    const enabled = await isVerificationEnabled(type);
    if (!enabled) {
      return NextResponse.json(
        { error: '该验证类型未启用' },
        { status: 400 }
      );
    }

    if (type === 'email') {
      if (!email) {
        return NextResponse.json(
          { error: '请输入邮箱地址' },
          { status: 400 }
        );
      }

      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: '请输入有效的邮箱地址' },
          { status: 400 }
        );
      }

      // 检查邮箱是否已被注册
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: '该邮箱已被注册' },
          { status: 400 }
        );
      }

      // 检查是否频繁发送（1分钟内）
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const recentCode = await prisma.verificationCode.findFirst({
        where: {
          email,
          type: 'email',
          createdAt: { gt: oneMinuteAgo },
        },
      });

      if (recentCode) {
        return NextResponse.json(
          { error: '验证码发送过于频繁，请稍后再试' },
          { status: 400 }
        );
      }

      // 生成验证码
      const code = generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟有效期

      // 保存验证码到数据库
      await prisma.verificationCode.create({
        data: {
          email,
          code,
          type: 'email',
          purpose: 'register',
          expiresAt,
        },
      });

      // 发送邮件
      const sent = await sendEmailCode(email, code);
      if (!sent) {
        return NextResponse.json(
          { error: '邮件发送失败，请稍后重试' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { message: '验证码已发送到您的邮箱' },
        { status: 200 }
      );
    } else if (type === 'phone') {
      if (!phone) {
        return NextResponse.json(
          { error: '请输入手机号' },
          { status: 400 }
        );
      }

      // 验证手机号格式（中国大陆）
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        return NextResponse.json(
          { error: '请输入有效的手机号' },
          { status: 400 }
        );
      }

      // 检查是否频繁发送
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const recentCode = await prisma.verificationCode.findFirst({
        where: {
          phone,
          type: 'phone',
          createdAt: { gt: oneMinuteAgo },
        },
      });

      if (recentCode) {
        return NextResponse.json(
          { error: '验证码发送过于频繁，请稍后再试' },
          { status: 400 }
        );
      }

      // 生成验证码
      const code = generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟有效期

      // 保存验证码到数据库
      await prisma.verificationCode.create({
        data: {
          phone,
          code,
          type: 'phone',
          purpose: 'register',
          expiresAt,
        },
      });

      // 发送短信
      const sent = await sendSmsCode(phone, code);
      if (!sent) {
        return NextResponse.json(
          { error: '短信发送失败，请稍后重试' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { message: '验证码已发送到您的手机' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: '不支持的验证类型' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Send verification code error:', error);
    return NextResponse.json(
      { error: '发送失败，请稍后重试' },
      { status: 500 }
    );
  }
}
