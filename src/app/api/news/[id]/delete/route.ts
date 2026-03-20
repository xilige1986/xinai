import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// 删除资讯（表单提交方式）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr);

    await prisma.news.delete({
      where: { id },
    });

    return NextResponse.redirect(new URL('/admin/news', request.url));
  } catch (error) {
    console.error('Delete news error:', error);
    return NextResponse.json(
      { error: '删除资讯失败' },
      { status: 500 }
    );
  }
}
