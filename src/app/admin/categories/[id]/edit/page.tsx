import { getServerSession } from 'next-auth/next';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { CategoryEditForm } from './CategoryEditForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getCategory(id: number) {
  return await prisma.category.findUnique({
    where: { id },
    include: {
      subCategories: true,
      _count: { select: { tools: true } },
    },
  });
}

export default async function EditCategoryPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const { id } = await params;
  const categoryId = parseInt(id);
  if (isNaN(categoryId)) {
    notFound();
  }

  const category = await getCategory(categoryId);

  if (!category) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/categories">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">编辑分类</h1>
          <p className="text-sm text-muted-foreground">修改 {category.name} 的信息</p>
        </div>
      </div>

      <CategoryEditForm category={category} />
    </div>
  );
}
