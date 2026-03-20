import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { stopTask, reschedule, runNow } from '@/lib/newsletter-scheduler';
import { authOptions } from '@/lib/auth';

// 更新定时推送配置
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const scheduleId = parseInt(id);
    if (isNaN(scheduleId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
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

    // 验证时间格式
    if (time) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(time)) {
        return NextResponse.json(
          { error: '时间格式不正确，应为 HH:mm' },
          { status: 400 }
        );
      }
    }

    const schedule = await prisma.newsletterSchedule.update({
      where: { id: scheduleId },
      data: {
        name,
        enabled,
        frequency,
        dayOfWeek: frequency === 'weekly' ? dayOfWeek : null,
        dayOfMonth: frequency === 'monthly' ? dayOfMonth : null,
        time,
        subject,
        content,
        autoSelectNews,
        maxNewsCount,
      },
    });

    // 重新调度任务
    await reschedule(schedule.id);

    return NextResponse.json({
      success: true,
      schedule,
    });
  } catch (error: any) {
    console.error('Failed to update schedule:', error);
    return NextResponse.json(
      { error: '更新失败: ' + (error.message || String(error)) },
      { status: 500 }
    );
  }
}

// 删除定时推送配置
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const scheduleId = parseInt(id);
    if (isNaN(scheduleId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // 停止任务
    stopTask(scheduleId);

    // 删除配置
    await prisma.newsletterSchedule.delete({
      where: { id: scheduleId },
    });

    return NextResponse.json({
      success: true,
      message: '已删除',
    });
  } catch (error: any) {
    console.error('Failed to delete schedule:', error);
    return NextResponse.json(
      { error: '删除失败' },
      { status: 500 }
    );
  }
}

// 手动触发执行
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const scheduleId = parseInt(id);
    if (isNaN(scheduleId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // 立即执行
    await runNow(scheduleId);

    return NextResponse.json({
      success: true,
      message: '已开始执行',
    });
  } catch (error: any) {
    console.error('Failed to run schedule:', error);
    return NextResponse.json(
      { error: '执行失败' },
      { status: 500 }
    );
  }
}
