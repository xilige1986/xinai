import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// 更新快捷入口
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const quickLinkId = parseInt(id);
    if (isNaN(quickLinkId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { label, href, sortOrder, isActive } = body;

    const quickLink = await prisma.quickLink.update({
      where: { id: quickLinkId },
      data: {
        label,
        href,
        sortOrder,
        isActive,
      },
    });

    return NextResponse.json({ quickLink });
  } catch (error: any) {
    console.error('Failed to update quick link:', error);
    return NextResponse.json(
      { error: '更新快捷入口失败' },
      { status: 500 }
    );
  }
}

// 删除快捷入口
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const quickLinkId = parseInt(id);
    if (isNaN(quickLinkId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await prisma.quickLink.delete({
      where: { id: quickLinkId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete quick link:', error);
    return NextResponse.json(
      { error: '删除快捷入口失败' },
      { status: 500 }
    );
  }
}
