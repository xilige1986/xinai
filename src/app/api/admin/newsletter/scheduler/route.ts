import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { initNewsletterScheduler, shutdownNewsletterScheduler } from '@/lib/newsletter-init';
import { getStatus } from '@/lib/newsletter-scheduler';
import { authOptions } from '@/lib/auth';

// 获取定时任务状态
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = getStatus();

    return NextResponse.json({
      status,
      enabled: process.env.ENABLE_NEWSLETTER_SCHEDULER !== 'false',
    });
  } catch (error: any) {
    console.error('Failed to get scheduler status:', error);
    return NextResponse.json(
      { error: '获取状态失败' },
      { status: 500 }
    );
  }
}

// 启动/停止定时任务
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'start') {
      await initNewsletterScheduler();
      return NextResponse.json({
        success: true,
        message: '定时任务已启动',
        status: getStatus(),
      });
    }

    if (action === 'stop') {
      shutdownNewsletterScheduler();
      return NextResponse.json({
        success: true,
        message: '定时任务已停止',
        status: getStatus(),
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Failed to control scheduler:', error);
    return NextResponse.json(
      { error: '操作失败' },
      { status: 500 }
    );
  }
}
