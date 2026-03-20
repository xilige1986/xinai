import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { scheduleTask, stopTask, reschedule } from '@/lib/newsletter-scheduler';
import { authOptions } from '@/lib/auth';

// 获取所有定时推送配置
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schedules = await prisma.newsletterSchedule.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { history: true },
        },
      },
    });

    return NextResponse.json({ schedules });
  } catch (error: any) {
    console.error('Failed to fetch schedules:', error);
    return NextResponse.json(
      { error: '获取配置失败' },
      { status: 500 }
    );
  }
}

// 创建定时推送配置
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      enabled,
      frequency,
      dayOfWeek,
      dayOfMonth,
      time,
      subject,
      content,
      autoSelectNews,
      maxNewsCount,
    } = body;

    // 验证必填字段
    if (!name || !frequency || !time || !subject) {
      return NextResponse.json(
        { error: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    // 验证时间格式
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return NextResponse.json(
        { error: '时间格式不正确，应为 HH:mm' },
        { status: 400 }
      );
    }

    // 根据频率验证相应字段
    if (frequency === 'weekly' && (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6)) {
      return NextResponse.json(
        { error: '请选择每周的星期几' },
        { status: 400 }
      );
    }

    if (frequency === 'monthly' && (dayOfMonth === undefined || dayOfMonth < 1 || dayOfMonth > 31)) {
      return NextResponse.json(
        { error: '请选择每月的几号' },
        { status: 400 }
      );
    }

    const schedule = await prisma.newsletterSchedule.create({
      data: {
        name,
        enabled: enabled ?? false,
        frequency,
        dayOfWeek: frequency === 'weekly' ? dayOfWeek : null,
        dayOfMonth: frequency === 'monthly' ? dayOfMonth : null,
        time,
        subject,
        content,
        autoSelectNews: autoSelectNews ?? true,
        maxNewsCount: maxNewsCount ?? 5,
      },
    });

    // 如果启用了，立即调度任务
    if (schedule.enabled) {
      scheduleTask(schedule);
    }

    return NextResponse.json({
      success: true,
      schedule,
    });
  } catch (error: any) {
    console.error('Failed to create schedule:', error);
    return NextResponse.json(
      { error: '创建失败: ' + (error.message || String(error)) },
      { status: 500 }
    );
  }
}
