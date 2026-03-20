import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { QuickLinkList } from './QuickLinkList';

export default async function QuickLinksPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const quickLinks = await prisma.quickLink.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">快捷入口管理</h1>
        <p className="text-muted-foreground">
          管理首页显示的快捷入口链接
        </p>
      </div>

      <QuickLinkList quickLinks={quickLinks} />
    </div>
  );
}
