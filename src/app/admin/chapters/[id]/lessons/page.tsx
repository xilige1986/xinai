import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import LessonManagement from './LessonManagement';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getChapter(id: number) {
  const chapter = await prisma.chapter.findUnique({
    where: { id },
    include: {
      course: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
  return chapter;
}

async function getLessons(chapterId: number) {
  const lessons = await prisma.lesson.findMany({
    where: {
      chapterId,
    },
    orderBy: { sortOrder: 'asc' },
  });
  return lessons;
}

export default async function LessonsPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const { id } = await params;
  const chapterId = parseInt(id);

  if (isNaN(chapterId)) {
    redirect('/admin/courses');
  }

  const [chapter, lessons] = await Promise.all([
    getChapter(chapterId),
    getLessons(chapterId),
  ]);

  if (!chapter) {
    redirect('/admin/courses');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <LessonManagement chapter={chapter} initialLessons={lessons} />
    </div>
  );
}
