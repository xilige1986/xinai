import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// 获取用户推广详情
export async function GET(
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

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        membership: true,
        referralCode: true,
        referralCount: true,
        points: true,
        referredBy: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 获取推荐人信息
    let referrer = null;
    if (user.referredBy) {
      referrer = await prisma.user.findUnique({
        where: { id: user.referredBy },
        select: {
          id: true,
          username: true,
          name: true,
        },
      });
    }

    // 获取直接推广记录（1级）
    const referralRecords = await prisma.referralRecord.findMany({
      where: { referrerId: userId },
      include: {
        referred: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            membership: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 计算1级推广获得的积分
    const level1Points = referralRecords.reduce((sum, record) => sum + record.points, 0);

    // 获取多级推广收益记录（2级、3级）
    const multiLevelRecords = await prisma.multiLevelReferralRecord.findMany({
      where: { earnerId: userId },
      include: {
        newUser: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            membership: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 计算2级、3级推广获得的积分
    const level2Points = multiLevelRecords
      .filter(r => r.level === 2)
      .reduce((sum, record) => sum + record.points, 0);
    const level3Points = multiLevelRecords
      .filter(r => r.level === 3)
      .reduce((sum, record) => sum + record.points, 0);

    // 统计各级推广人数
    const level2Count = multiLevelRecords.filter(r => r.level === 2).length;
    const level3Count = multiLevelRecords.filter(r => r.level === 3).length;

    // 构建推广链接
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const referralLink = user.referralCode ? `${baseUrl}/register?ref=${user.referralCode}` : null;

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
        membership: user.membership,
        createdAt: user.createdAt,
      },
      referralInfo: {
        referralCode: user.referralCode,
        referralLink,
        referralCount: user.referralCount,
        points: user.points,
        referrer: referrer,
      },
      stats: {
        level1: {
          count: user.referralCount,
          points: level1Points,
        },
        level2: {
          count: level2Count,
          points: level2Points,
        },
        level3: {
          count: level3Count,
          points: level3Points,
        },
        totalPoints: level1Points + level2Points + level3Points,
      },
      records: {
        level1: referralRecords.map(record => ({
          id: record.id,
          referredUser: record.referred,
          points: record.points,
          status: record.status,
          createdAt: record.createdAt,
        })),
        level2: multiLevelRecords
          .filter(r => r.level === 2)
          .map(record => ({
            id: record.id,
            level: 2 as const,
            referredUser: record.newUser,
            points: record.points,
            status: record.status,
            createdAt: record.createdAt,
          })),
        level3: multiLevelRecords
          .filter(r => r.level === 3)
          .map(record => ({
            id: record.id,
            level: 3 as const,
            referredUser: record.newUser,
            points: record.points,
            status: record.status,
            createdAt: record.createdAt,
          })),
      },
    });
  } catch (error) {
    console.error('Failed to fetch user referral info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user referral info' },
      { status: 500 }
    );
  }
}
