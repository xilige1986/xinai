import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { resend, FROM_EMAIL, isEmailServiceEnabled } from '@/lib/email';
import { renderNewsletterEmail } from '@/lib/email-templates';
import { authOptions } from '@/lib/auth';

// 网站域名
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// 发送邮件给所有订阅者
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 检查邮件服务是否配置
    if (!isEmailServiceEnabled()) {
      return NextResponse.json(
        { error: '邮件服务未配置，请设置 RESEND_API_KEY 环境变量' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { subject, content, newsIds } = body;

    if (!subject || !subject.trim()) {
      return NextResponse.json(
        { error: '请输入邮件主题' },
        { status: 400 }
      );
    }

    // 获取选中的资讯
    let newsItems: any[] = [];
    if (newsIds && newsIds.length > 0) {
      newsItems = await prisma.news.findMany({
        where: {
          id: { in: newsIds },
          status: 1, // 只选已发布的
        },
        select: {
          id: true,
          title: true,
          summary: true,
          slug: true,
          coverImage: true,
        },
        orderBy: { publishedAt: 'desc' },
      });
    }

    // 获取所有活跃的订阅者
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { status: 1 },
      select: { email: true },
    });

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: '没有活跃的订阅者' },
        { status: 400 }
      );
    }

    // 提取摘要（取前150字符）
    const newsWithSummary = newsItems.map((news) => ({
      ...news,
      summary: news.summary || news.content?.substring(0, 150) + '...' || '暂无摘要',
    }));

    // 批量发送邮件
    const results = {
      success: 0,
      failed: 0,
      total: subscribers.length,
    };

    // 限制并发数
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < subscribers.length; i += batchSize) {
      batches.push(subscribers.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const promises = batch.map(async (subscriber) => {
        try {
          const unsubscribeUrl = `${SITE_URL}/api/subscribe?email=${encodeURIComponent(subscriber.email)}`;
          const html = renderNewsletterEmail({
            subject,
            content: content || '',
            newsItems: newsWithSummary,
            unsubscribeUrl,
          });

          await resend!.emails.send({
            from: FROM_EMAIL,
            to: subscriber.email,
            subject: subject,
            html: html,
          });

          results.success++;
        } catch (error) {
          console.error(`Failed to send to ${subscriber.email}:`, error);
          results.failed++;
        }
      });

      await Promise.all(promises);
    }

    return NextResponse.json({
      success: true,
      message: `邮件发送完成：成功 ${results.success} 封，失败 ${results.failed} 封`,
      results,
    });
  } catch (error: any) {
    console.error('Failed to send newsletter:', error);
    return NextResponse.json(
      { error: '发送失败：' + error.message },
      { status: 500 }
    );
  }
}

// 获取发送预览（测试邮件）
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const newsIds = searchParams.get('newsIds')?.split(',').map(Number) || [];

    const newsItems = await prisma.news.findMany({
      where: {
        id: { in: newsIds },
        status: 1,
      },
      select: {
        id: true,
        title: true,
        summary: true,
        slug: true,
        coverImage: true,
      },
      orderBy: { publishedAt: 'desc' },
    });

    const subscribers = await prisma.newsletterSubscriber.count({
      where: { status: 1 },
    });

    return NextResponse.json({
      newsItems,
      subscriberCount: subscribers,
    });
  } catch (error: any) {
    console.error('Failed to get preview:', error);
    return NextResponse.json(
      { error: '获取预览失败' },
      { status: 500 }
    );
  }
}
