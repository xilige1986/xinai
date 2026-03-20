import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// 订阅邮件
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = body;

    // 验证邮箱
    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: '请输入邮箱地址' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 检查是否已订阅
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      if (existing.status === 1) {
        return NextResponse.json(
          { error: '该邮箱已订阅' },
          { status: 400 }
        );
      } else {
        // 重新激活订阅
        await prisma.newsletterSubscriber.update({
          where: { id: existing.id },
          data: { status: 1 },
        });
        return NextResponse.json({
          success: true,
          message: '订阅已重新激活',
        });
      }
    }

    // 创建新订阅
    await prisma.newsletterSubscriber.create({
      data: {
        email: normalizedEmail,
        name: name?.trim() || null,
        source: 'news_page',
      },
    });

    return NextResponse.json({
      success: true,
      message: '订阅成功！感谢您的关注',
    });
  } catch (error: any) {
    console.error('Failed to subscribe:', error);
    return NextResponse.json(
      { error: '订阅失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// 取消订阅
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: '请提供邮箱地址' },
        { status: 400 }
      );
    }

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!existing) {
      return NextResponse.json(
        { error: '未找到该订阅' },
        { status: 404 }
      );
    }

    await prisma.newsletterSubscriber.update({
      where: { id: existing.id },
      data: { status: 0 },
    });

    return NextResponse.json({
      success: true,
      message: '已取消订阅',
    });
  } catch (error: any) {
    console.error('Failed to unsubscribe:', error);
    return NextResponse.json(
      { error: '操作失败' },
      { status: 500 }
    );
  }
}

// 通过 GET 请求取消订阅（用于邮件中的链接）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return new Response(
        `<html><body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1>取消订阅失败</h1>
          <p>请提供邮箱地址</p>
        </body></html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!existing) {
      return new Response(
        `<html><body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1>取消订阅失败</h1>
          <p>未找到该邮箱的订阅记录</p>
          <a href="/" style="color: #667eea;">返回首页</a>
        </body></html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    await prisma.newsletterSubscriber.update({
      where: { id: existing.id },
      data: { status: 0 },
    });

    return new Response(
      `<html><head><meta charset="utf-8"><title>已取消订阅</title></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 50px; background: #f5f5f5;">
        <div style="max-width: 400px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="width: 60px; height: 60px; background: #10b981; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h1 style="color: #333; margin-bottom: 10px;">已取消订阅</h1>
          <p style="color: #666; margin-bottom: 20px;">您已成功取消订阅 AI 工具库资讯邮件。</p>
          <p style="color: #999; font-size: 14px; margin-bottom: 30px;">邮箱：${email}</p>
          <a href="/news" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">返回资讯页面</a>
        </div>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch (error: any) {
    console.error('Failed to unsubscribe:', error);
    return new Response(
      `<html><body style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1>取消订阅失败</h1>
        <p>操作过程中发生错误，请稍后重试</p>
        <a href="/" style="color: #667eea;">返回首页</a>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}
