import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ToolCreateForm } from './ToolCreateForm';

async function getCategories() {
  return await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      subCategories: true,
    },
  });
}

async function getUseCases() {
  return await prisma.useCase.findMany({
    orderBy: { adoptionRate: 'desc' },
  });
}

export default async function NewToolPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const [categories, useCases] = await Promise.all([
    getCategories(),
    getUseCases(),
  ]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">添加新工具</h1>
        <p className="text-muted-foreground">添加一个新的 AI 工具到平台</p>
      </div>

      <ToolCreateForm categories={categories} useCases={useCases} />
    </div>
  );
}
