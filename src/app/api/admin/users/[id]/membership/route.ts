import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// 更新用户会员分组
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
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const body = await request.json();
    const { membership } = body;

    // 验证会员类型
    const validMemberships = ['MEMBER', 'VIP', 'FOUNDER'];
    if (!membership || !validMemberships.includes(membership)) {
      return NextResponse.json(
        { error: 'Invalid membership type' },
        { status: 400 }
      );
    }

    // 更新用户会员分组
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { membership },
      select: {
        id: true,
        username: true,
        membership: true,
      },
    });

    return NextResponse.json({
      message: '会员分组更新成功',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Failed to update user membership:', error);
    return NextResponse.json(
      { error: 'Failed to update user membership' },
      { status: 500 }
    );
  }
}
