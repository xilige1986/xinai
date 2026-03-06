import { getServerSession } from 'next-auth/next';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { SubCategoryEditForm } from './SubCategoryEditForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getSubCategory(id: number) {
  return await prisma.subCategory.findUnique({
    where: { id },
    include: {
      category: true,
      _count: { select: { tools: true } },
    },
  });
}

export default async function EditSubCategoryPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const { id } = await params;
  const subCategoryId = parseInt(id);
  if (isNaN(subCategoryId)) {
    notFound();
  }

  const subCategory = await getSubCategory(subCategoryId);

  if (!subCategory) {
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/admin/categories" className="hover:text-primary">分类管理</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href={`/admin/categories/${subCategory.category.id}/edit`} className="hover:text-primary">{subCategory.category.name}</Link>
            <ChevronRight className="h-4 w-4" />
            <span>编辑子分类</span>
          </div>
          <h1 className="text-2xl font-bold">编辑子分类</h1>
          <p className="text-sm text-muted-foreground">修改 {subCategory.name} 的信息</p>
        </div>
      </div>

      <SubCategoryEditForm subCategory={subCategory} />
    </div>
  );
}
