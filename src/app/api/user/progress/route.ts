import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// 获取用户的学习进度汇总
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    const userId = parseInt(session.user.id);

    // 如果指定了课程ID，返回该课程的学习进度
    if (courseId) {
      const courseIdNum = parseInt(courseId);
      if (isNaN(courseIdNum)) {
        return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
      }

      // 获取课程的所有课时
      const lessons = await prisma.lesson.findMany({
        where: {
          courseId: courseIdNum,
          status: 1,
        },
        select: {
          id: true,
          chapterId: true,
        },
      });

      const totalLessons = lessons.length;
      const lessonIds = lessons.map(l => l.id);

      // 获取用户的学习进度
      const progresses = await prisma.lessonProgress.findMany({
        where: {
          userId,
          lessonId: { in: lessonIds },
        },
      });

      const completedLessons = progresses.filter(p => p.isCompleted).length;
      const overallProgress = totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

      // 按课时组织进度
      const progressMap: Record<number, typeof progresses[0]> = {};
      progresses.forEach(p => {
        progressMap[p.lessonId] = p;
      });

      return NextResponse.json({
        courseId: courseIdNum,
        totalLessons,
        completedLessons,
        overallProgress,
        progressMap,
      });
    }

    // 获取所有学习进度
    const progresses = await prisma.lessonProgress.findMany({
      where: { userId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            courseId: true,
            chapterId: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // 按课程分组统计
    const courseStats: Record<number, {
      courseId: number;
      totalLessons: number;
      completedLessons: number;
      lastStudiedAt: Date;
    }> = {};

    for (const progress of progresses) {
      const courseId = progress.courseId;
      if (!courseStats[courseId]) {
        // 获取课程总课时数
        const totalLessons = await prisma.lesson.count({
          where: {
            courseId,
            status: 1,
          },
        });

        courseStats[courseId] = {
          courseId,
          totalLessons,
          completedLessons: 0,
          lastStudiedAt: progress.updatedAt,
        };
      }

      if (progress.isCompleted) {
        courseStats[courseId].completedLessons++;
      }

      if (progress.updatedAt > courseStats[courseId].lastStudiedAt) {
        courseStats[courseId].lastStudiedAt = progress.updatedAt;
      }
    }

    return NextResponse.json({
      progresses,
      courseStats: Object.values(courseStats),
    });
  } catch (error: any) {
    console.error('Failed to fetch user progress:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}
