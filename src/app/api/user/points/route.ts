import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// 获取当前用户的积分记录
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // 获取用户实际积分余额
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });

    const currentPoints = user?.points || 0;

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');

    // 构建查询条件
    const where: any = { userId };
    if (type && type !== 'all') {
      where.type = type;
    }

    // 获取总数
    const total = await prisma.pointsLog.count({ where });

    // 获取积分记录
    const logs = await prisma.pointsLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // 获取积分统计
    const stats = await prisma.pointsLog.groupBy({
      by: ['type'],
      where: { userId },
      _sum: { points: true },
      _count: { id: true },
    });

    // 计算总收入和支出
    let totalIncome = 0;
    let totalExpense = 0;
    stats.forEach((stat) => {
      if (stat._sum.points && stat._sum.points > 0) {
        totalIncome += stat._sum.points;
      } else if (stat._sum.points && stat._sum.points < 0) {
        totalExpense += Math.abs(stat._sum.points);
      }
    });

    // 类型标签映射
    const typeLabels: Record<string, { label: string; color: string; icon: string }> = {
      ADMIN_ADD: { label: '管理员奖励', color: 'text-green-600', icon: 'gift' },
      ADMIN_DEDUCT: { label: '管理员扣除', color: 'text-red-600', icon: 'minus' },
      REFERRAL: { label: '推广奖励', color: 'text-blue-600', icon: 'users' },
      MULTI_LEVEL_REFERRAL: { label: '多级推广奖励', color: 'text-purple-600', icon: 'share' },
      COURSE_UNLOCK: { label: '课程解锁', color: 'text-amber-600', icon: 'book-open' },
      CONTRIBUTION: { label: '贡献奖励', color: 'text-green-600', icon: 'award' },
    };

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        points: log.points,
        type: log.type,
        typeLabel: typeLabels[log.type] || { label: log.type, color: 'text-gray-600', icon: 'circle' },
        description: log.description,
        createdAt: log.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        totalIncome,
        totalExpense,
        balance: currentPoints, // 使用用户表中的实际积分
      },
    });
  } catch (error) {
    console.error('Get points logs error:', error);
    return NextResponse.json(
      { error: '获取积分记录失败' },
      { status: 500 }
    );
  }
}
