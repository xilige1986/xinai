import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import LearnPageClient from './LearnPageClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getLesson(id: number) {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      chapter: {
        select: {
          id: true,
          title: true,
          courseId: true,
        },
      },
    },
  });
  return lesson;
}

async function getCourse(courseId: number) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      slug: true,
      coverImage: true,
      price: true,
    },
  });
  return course;
}

async function getCourseChapters(courseId: number) {
  const chapters = await prisma.chapter.findMany({
    where: {
      courseId,
      status: 1,
    },
    orderBy: { sortOrder: 'asc' },
    include: {
      lessons: {
        where: { status: 1 },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          title: true,
          description: true,
          duration: true,
          contentType: true,
          isFree: true,
          sortOrder: true,
          chapterId: true,
        },
      },
    },
  });
  return chapters;
}

async function getLessonProgress(userId: number, lessonId: number) {
  const progress = await prisma.lessonProgress.findUnique({
    where: {
      userId_lessonId: {
        userId,
        lessonId,
      },
    },
  });
  return progress;
}

// 获取推荐课程
async function getRelatedCourses(currentCourseId: number) {
  return await prisma.course.findMany({
    where: {
      status: 1,
      id: { not: currentCourseId },
    },
    take: 5,
    orderBy: { studentCount: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      coverImage: true,
      price: true,
    },
  });
}

// 获取相邻课时
function getAdjacentLessons(chapters: any[], currentLessonId: number) {
  const allLessons: any[] = [];
  chapters.forEach((chapter) => {
    chapter.lessons.forEach((lesson: any) => {
      allLessons.push({
        ...lesson,
        chapterId: chapter.id,
      });
    });
  });

  const currentIndex = allLessons.findIndex((l) => l.id === currentLessonId);
  return {
    prevLesson: currentIndex > 0 ? allLessons[currentIndex - 1] : null,
    nextLesson:
      currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null,
  };
}

export default async function LearnPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  // 如果未登录，重定向到登录页
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/learn');
  }

  const { id } = await params;
  const lessonId = parseInt(id);

  if (isNaN(lessonId)) {
    redirect('/courses');
  }

  const lesson = await getLesson(lessonId);

  if (!lesson) {
    redirect('/courses');
  }

  const [course, chapters, progress, relatedCourses] = await Promise.all([
    getCourse(lesson.courseId),
    getCourseChapters(lesson.courseId),
    getLessonProgress(parseInt(session.user.id), lessonId),
    getRelatedCourses(lesson.courseId),
  ]);

  if (!course) {
    redirect('/courses');
  }

  const { prevLesson, nextLesson } = getAdjacentLessons(chapters, lessonId);

  // 检查用户是否有权限访问
  const userRole = (session.user as any).role;
  const userMembership = (session.user as any).membership || 'MEMBER';
  const isAdmin = userRole === 'ADMIN';
  const isVIP = userMembership === 'VIP' || userMembership === 'FOUNDER';

  // VIP/创始股东/管理员可以访问所有课程
  let hasAccess = isAdmin || isVIP || lesson.isFree;
  let purchaseInfo = null;

  if (!hasAccess) {
    // 普通会员检查是否已购买
    const order = await prisma.order.findFirst({
      where: {
        userId: parseInt(session.user.id),
        courseId: course.id,
        status: 1, // 已支付
      },
    });

    if (order) {
      hasAccess = true;
      purchaseInfo = {
        orderNo: order.orderNo,
        payTime: order.payTime,
      };
    }
  }

  // 如果课程免费，允许所有会员访问
  if (course.price === 0) {
    hasAccess = true;
  }

  return (
    <LearnPageClient
      lesson={lesson}
      course={course}
      chapters={chapters}
      initialProgress={
        progress || {
          progress: 0,
          isCompleted: false,
          lastPosition: null,
        }
      }
      nextLesson={nextLesson}
      prevLesson={prevLesson}
      hasAccess={hasAccess}
      relatedCourses={relatedCourses}
    />
  );
}
