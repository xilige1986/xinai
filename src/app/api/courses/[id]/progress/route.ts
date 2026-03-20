import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * 获取用户在某门课程的学习进度
 * GET /api/courses/[id]/progress
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { id } = await params;
    const courseId = parseInt(id);
    const userId = parseInt(session.user.id);

    // 获取课程的所有课时
    const chapters = await prisma.chapter.findMany({
      where: {
        courseId,
        status: 1,
      },
      include: {
        lessons: {
          where: { status: 1 },
          select: {
            id: true,
          },
        },
      },
    });

    const allLessonIds = chapters.flatMap((ch) => ch.lessons.map((l) => l.id));

    if (allLessonIds.length === 0) {
      return NextResponse.json({
        progress: 0,
        isCompleted: false,
        completedLessons: 0,
        totalLessons: 0,
      });
    }

    // 获取用户的学习进度
    const progresses = await prisma.lessonProgress.findMany({
      where: {
        userId,
        lessonId: { in: allLessonIds },
      },
    });

    const completedLessons = progresses.filter((p) => p.isCompleted).length;
    const totalLessons = allLessonIds.length;
    const progress = Math.round((completedLessons / totalLessons) * 100);

    return NextResponse.json({
      progress,
      isCompleted: completedLessons === totalLessons,
      completedLessons,
      totalLessons,
    });
  } catch (error) {
    console.error('Get course progress error:', error);
    return NextResponse.json({ error: '获取进度失败' }, { status: 500 });
  }
}
