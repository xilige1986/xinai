import { getServerSession } from 'next-auth/next';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ToolEditForm } from '../../ToolEditForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getTool(id: number) {
  return await prisma.tool.findUnique({
    where: { id },
    include: {
      category: true,
      subCategory: true,
      useCase: true,
    },
  });
}

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

export default async function EditToolPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const { id } = await params;
  const toolId = parseInt(id);
  if (isNaN(toolId)) {
    notFound();
  }

  const [tool, categories, useCases] = await Promise.all([
    getTool(toolId),
    getCategories(),
    getUseCases(),
  ]);

  if (!tool) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">编辑工具</h1>
        <p className="text-muted-foreground">修改 {tool.name} 的信息</p>
      </div>

      <ToolEditForm tool={tool} categories={categories} useCases={useCases} />
    </div>
  );
}
