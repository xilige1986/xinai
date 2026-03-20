import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { QuickLinkForm } from '../QuickLinkForm';

export default async function NewQuickLinkPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/admin/login');
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">添加快捷入口</h1>
        <p className="text-muted-foreground">添加首页显示的快捷入口链接</p>
      </div>

      <QuickLinkForm />
    </div>
  );
}
