import { getServerSession } from 'next-auth/next';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import NewsEditForm from './NewsEditForm';

interface EditNewsPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditNewsPage({ params }: EditNewsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const { id } = await params;
  const newsId = parseInt(id);

  const news = await prisma.news.findUnique({
    where: { id: newsId },
  });

  if (!news) {
    notFound();
  }

  return <NewsEditForm news={news} />;
}
