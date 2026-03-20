import { getServerSession } from 'next-auth/next';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { QuickLinkForm } from '../../QuickLinkForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditQuickLinkPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const { id } = await params;
  const quickLinkId = parseInt(id);
  if (isNaN(quickLinkId)) {
    notFound();
  }

  const quickLink = await prisma.quickLink.findUnique({
    where: { id: quickLinkId },
  });

  if (!quickLink) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">编辑快捷入口</h1>
        <p className="text-muted-foreground">修改快捷入口信息</p>
      </div>

      <QuickLinkForm quickLink={quickLink} />
    </div>
  );
}
