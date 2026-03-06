import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { CourseForm } from '../CourseForm';

async function getTools() {
  return await prisma.tool.findMany({
    where: { status: 1 },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
}

export default async function NewCoursePage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const tools = await getTools();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">添加课程</h1>
        <p className="text-muted-foreground">创建新的商业化课程</p>
      </div>

      <CourseForm tools={tools} />
    </div>
  );
}
