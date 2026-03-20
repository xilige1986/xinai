import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// 更新用户积分
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
    const { points, reason } = body;

    // 验证积分
    if (typeof points !== 'number' || points < 0) {
      return NextResponse.json(
        { error: '积分必须是大于等于0的数字' },
        { status: 400 }
      );
    }

    // 获取当前用户信息
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, points: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 计算积分变化
    const pointsChange = points - (currentUser.points || 0);

    // 更新用户积分
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { points },
      select: {
        id: true,
        username: true,
        points: true,
      },
    });

    // 尝试创建积分记录（如果表存在）
    if (pointsChange !== 0) {
      try {
        // 使用原始查询检查表是否存在
        const tableExists = await prisma.$queryRaw`
          SELECT name FROM sqlite_master WHERE type='table' AND name='PointsLog'
        `;

        if (tableExists && Array.isArray(tableExists) && tableExists.length > 0) {
          await prisma.$executeRaw`
            INSERT INTO PointsLog (userId, points, type, description, operatorId, createdAt)
            VALUES (${userId}, ${pointsChange}, ${pointsChange > 0 ? 'ADMIN_ADD' : 'ADMIN_DEDUCT'}, ${reason || `管理员${pointsChange > 0 ? '增加' : '扣除'}积分`}, ${parseInt((session.user as any).id)}, datetime('now'))
          `;
        }
      } catch (logError) {
        console.error('Points log creation skipped:', logError);
      }
    }

    return NextResponse.json({
      message: '积分更新成功',
      user: updatedUser,
      previousPoints: currentUser.points || 0,
      change: pointsChange,
    });
  } catch (error: any) {
    console.error('Failed to update user points:', error);
    return NextResponse.json(
      { error: 'Failed to update user points', details: error.message },
      { status: 500 }
    );
  }
}
