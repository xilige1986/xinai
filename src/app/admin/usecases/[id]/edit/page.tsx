import { getServerSession } from 'next-auth/next';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { UseCaseEditForm } from './UseCaseEditForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getUseCase(id: number) {
  return await prisma.useCase.findUnique({
    where: { id },
    include: {
      _count: { select: { tools: true } },
    },
  });
}

export default async function EditUseCasePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const { id } = await params;
  const useCaseId = parseInt(id);
  if (isNaN(useCaseId)) {
    notFound();
  }

  const useCase = await getUseCase(useCaseId);

  if (!useCase) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/usecases">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">编辑使用场景</h1>
          <p className="text-sm text-muted-foreground">修改 {useCase.name} 的信息</p>
        </div>
      </div>

      <UseCaseEditForm useCase={useCase} />
    </div>
  );
}
