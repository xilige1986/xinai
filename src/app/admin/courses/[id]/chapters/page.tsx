import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import ChapterManagement from './ChapterManagement';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getCourse(id: number) {
  const course = await prisma.course.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
    },
  });
  return course;
}

async function getChapters(courseId: number) {
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
          duration: true,
          contentType: true,
          isFree: true,
          sortOrder: true,
        },
      },
      _count: {
        select: { lessons: true },
      },
    },
  });
  return chapters;
}

export default async function ChaptersPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const { id } = await params;
  const courseId = parseInt(id);

  if (isNaN(courseId)) {
    redirect('/admin/courses');
  }

  const [course, chapters] = await Promise.all([
    getCourse(courseId),
    getChapters(courseId),
  ]);

  if (!course) {
    redirect('/admin/courses');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ChapterManagement course={course} initialChapters={chapters} />
    </div>
  );
}
