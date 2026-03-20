import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import AdminToolsPageClient from './page-client';

interface AdminToolsPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

async function getTools({
  status,
  search,
  categoryId,
  page = 1,
  pageSize = 50,
}: {
  status?: number;
  search?: string;
  categoryId?: number;
  page?: number;
  pageSize?: number;
}) {
  const where: any = {};

  if (status !== undefined) {
    where.status = status;
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { shortDesc: { contains: search, mode: 'insensitive' } },
    ];
  }

  const total = await prisma.tool.count({ where });

  const tools = await prisma.tool.findMany({
    where,
    orderBy: [{ sortOrder: 'desc' }, { createdAt: 'desc' }],
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      category: true,
      subCategory: true,
    },
  });

  return {
    tools,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

async function getCategories() {
  return await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
  });
}

export default async function AdminToolsPage({ searchParams }: AdminToolsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const status = searchParams.status ? parseInt(searchParams.status as string) : undefined;
  const search = searchParams.search as string | undefined;
  const categoryId = searchParams.category ? parseInt(searchParams.category as string) : undefined;
  const page = searchParams.page ? parseInt(searchParams.page as string) : 1;

  const [toolsData, categories] = await Promise.all([
    getTools({ status, search, categoryId, page }),
    getCategories(),
  ]);

  return <AdminToolsPageClient
    tools={toolsData.tools}
    categories={categories}
    total={toolsData.pagination.total}
    totalPages={toolsData.pagination.totalPages}
    page={toolsData.pagination.page}
    pageSize={toolsData.pagination.pageSize}
  />;
}
