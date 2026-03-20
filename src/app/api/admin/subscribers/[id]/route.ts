import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// 删除订阅者
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const subscriberId = parseInt(id);
    if (isNaN(subscriberId)) {
      return NextResponse.json({ error: 'Invalid subscriber ID' }, { status: 400 });
    }

    await prisma.newsletterSubscriber.delete({
      where: { id: subscriberId },
    });

    return NextResponse.json({
      success: true,
      message: '订阅者已删除',
    });
  } catch (error: any) {
    console.error('Failed to delete subscriber:', error);
    return NextResponse.json(
      { error: '删除失败' },
      { status: 500 }
    );
  }
}
