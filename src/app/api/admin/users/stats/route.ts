import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// 根据数据库类型选择不同的查询方式
const dbProvider = process.env.DATABASE_URL?.startsWith('mysql') ? 'mysql' : 'sqlite';

// 获取用户统计
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // MySQL 用数字，SQLite 用字符串
    const membershipValues = dbProvider === 'mysql'
      ? { member: 1, vip: 2, founder: 3 }
      : { member: 'MEMBER', vip: 'VIP', founder: 'FOUNDER' };

    const [
      total,
      member,
      vip,
      founder,
      admin,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { membership: membershipValues.member as any } }),
      prisma.user.count({ where: { membership: membershipValues.vip as any } }),
      prisma.user.count({ where: { membership: membershipValues.founder as any } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
    ]);

    return NextResponse.json({
      stats: {
        total,
        member,
        vip,
        founder,
        admin,
      },
    });
  } catch (error) {
    console.error('Failed to fetch user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}
