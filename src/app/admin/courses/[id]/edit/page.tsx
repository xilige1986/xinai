import { getServerSession } from 'next-auth/next';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { CourseEditForm } from './CourseEditForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getCourse(id: number) {
  return await prisma.course.findUnique({
    where: { id },
    include: {
      tools: {
        select: { id: true, name: true },
      },
    },
  });
}

async function getTools() {
  return await prisma.tool.findMany({
    where: { status: 1 },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
}

export default async function EditCoursePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const { id } = await params;
  const courseId = parseInt(id);
  if (isNaN(courseId)) {
    notFound();
  }

  const [course, tools] = await Promise.all([
    getCourse(courseId),
    getTools(),
  ]);

  if (!course) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/courses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">编辑课程</h1>
          <p className="text-sm text-muted-foreground">修改 {course.title} 的信息</p>
        </div>
      </div>

      <CourseEditForm course={course} tools={tools} />
    </div>
  );
}
