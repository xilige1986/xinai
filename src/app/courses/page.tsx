import { prisma } from '@/lib/db';
import { CourseList } from './CourseList';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI课程 - 系统化人工智能学习平台',
  description: '提供专业的AI技能培训课程，涵盖ChatGPT、Midjourney、Python编程、机器学习等热门领域。从入门到精通，助您掌握前沿AI技术。',
  keywords: 'AI课程,人工智能学习,ChatGPT教程,Midjourney教程,机器学习课程,AI编程,AI培训',
  openGraph: {
    title: 'AI课程 - 系统化人工智能学习平台',
    description: '提供专业的AI技能培训课程，从入门到精通，助您掌握前沿AI技术。',
    type: 'website',
  },
};

async function getCourses() {
  return await prisma.course.findMany({
    where: { status: 1 },
    orderBy: { createdAt: 'desc' },
    include: {
      tools: true,
    },
  });
}

async function getUserCourseAccess(userId: number, courseIds: number[]) {
  const orders = await prisma.order.findMany({
    where: {
      userId,
      courseId: { in: courseIds },
      status: 1,
    },
    select: { courseId: true },
  });

  const pointsAccess = await prisma.coursePointsAccess.findMany({
    where: {
      userId,
      courseId: { in: courseIds },
    },
    select: { courseId: true },
  });

  const accessSet = new Set([
    ...orders.map((o) => o.courseId),
    ...pointsAccess.map((p) => p.courseId),
  ]);

  return accessSet;
}

export default async function CoursesPage() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user?.id;
  const userId = session?.user?.id ? parseInt(session.user.id) : null;
  const userRole = (session?.user as any)?.role;
  const userMembership = (session?.user as any)?.membership || 'MEMBER';
  const isAdminOrVIP = userRole === 'ADMIN' || userMembership === 'VIP' || userMembership === 'FOUNDER';

  const courses = await getCourses().catch(() => []);

  // 获取用户有权限的课程
  const courseIds = courses.map((c) => c.id);
  const userAccess = userId && !isAdminOrVIP ? await getUserCourseAccess(userId, courseIds) : new Set<number>();

  // 给课程添加 hasAccess 属性
  const coursesWithAccess = courses.map((course) => ({
    ...course,
    hasAccess: isAdminOrVIP || (course.price === 0 && !course.allowPointsPurchase) || userAccess.has(course.id),
  }));

  return (
    <CourseList
      courses={coursesWithAccess}
      isLoggedIn={isLoggedIn}
    />
  );
}
