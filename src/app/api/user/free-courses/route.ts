import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * 获取用户正在学习的免费课程
 * GET /api/user/free-courses
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // 获取用户有学习进度的课程ID
    const progressRecords = await prisma.lessonProgress.findMany({
      where: { userId },
      include: {
        lesson: {
          select: {
            courseId: true,
          },
        },
      },
    });

    // 提取课程ID并去重
    const courseIds = [...new Set(progressRecords.map(p => p.lesson.courseId))];

    if (courseIds.length === 0) {
      return NextResponse.json({ courses: [] });
    }

    // 获取这些课程中免费的课程
    const freeCourses = await prisma.course.findMany({
      where: {
        id: { in: courseIds },
        price: 0,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        price: true,
      },
    });

    return NextResponse.json({ courses: freeCourses });
  } catch (error) {
    console.error('Get user free courses error:', error);
    return NextResponse.json({ error: '获取免费课程失败' }, { status: 500 });
  }
}
