import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// 获取用户在该课时的学习进度
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const lessonId = parseInt(id);
    if (isNaN(lessonId)) {
      return NextResponse.json({ error: 'Invalid lesson ID' }, { status: 400 });
    }

    const userId = parseInt(session.user.id);

    const progress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
    });

    if (!progress) {
      return NextResponse.json({
        progress: {
          progress: 0,
          isCompleted: false,
          lastPosition: null,
        },
      });
    }

    return NextResponse.json({ progress });
  } catch (error: any) {
    console.error('Failed to fetch lesson progress:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}

// 更新学习进度
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const lessonId = parseInt(id);
    if (isNaN(lessonId)) {
      return NextResponse.json({ error: 'Invalid lesson ID' }, { status: 400 });
    }

    const body = await request.json();
    const { progress: progressValue, isCompleted, lastPosition } = body;

    const userId = parseInt(session.user.id);

    // 获取课时信息
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { courseId: true },
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // 使用upsert创建或更新进度
    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      create: {
        userId,
        lessonId,
        courseId: lesson.courseId,
        progress: progressValue ?? 0,
        isCompleted: isCompleted ?? false,
        lastPosition: lastPosition ?? null,
        completedAt: isCompleted ? new Date() : null,
      },
      update: {
        progress: progressValue !== undefined ? progressValue : undefined,
        isCompleted: isCompleted !== undefined ? isCompleted : undefined,
        lastPosition: lastPosition !== undefined ? lastPosition : undefined,
        completedAt: isCompleted ? new Date() : undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ progress, message: '学习进度已更新' });
  } catch (error: any) {
    console.error('Failed to update lesson progress:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update progress' },
      { status: 500 }
    );
  }
}

// 标记课时完成
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const lessonId = parseInt(id);
    if (isNaN(lessonId)) {
      return NextResponse.json({ error: 'Invalid lesson ID' }, { status: 400 });
    }

    const userId = parseInt(session.user.id);

    // 获取课时信息
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { courseId: true },
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      create: {
        userId,
        lessonId,
        courseId: lesson.courseId,
        progress: 100,
        isCompleted: true,
        completedAt: new Date(),
      },
      update: {
        progress: 100,
        isCompleted: true,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ progress, message: '课时已标记为完成' });
  } catch (error: any) {
    console.error('Failed to complete lesson:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete lesson' },
      { status: 500 }
    );
  }
}
