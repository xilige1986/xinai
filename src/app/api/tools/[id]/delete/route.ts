import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const toolId = parseInt(id);
    if (isNaN(toolId)) {
      return NextResponse.json({ error: 'Invalid tool ID' }, { status: 400 });
    }

    await prisma.tool.delete({
      where: { id: toolId },
    });

    return NextResponse.json({ success: true, message: '工具已删除' });
  } catch (error: any) {
    console.error('Failed to delete tool:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete tool' },
      { status: 500 }
    );
  }
}
