import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getSponsors } from '@/lib/sponsors';
import Link from 'next/link';
import { SponsorsForm } from './SponsorsForm';

export default async function AdminSponsorsPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const sponsors = await getSponsors();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">赞助商管理</h1>
          <p className="text-muted-foreground mt-1">
            管理资讯页侧边栏的推荐工具赞助商
          </p>
        </div>
        <Link
          href="/admin"
          className="text-muted-foreground hover:text-foreground"
        >
          返回后台
        </Link>
      </div>

      <SponsorsForm initialSponsors={sponsors} />
    </div>
  );
}
