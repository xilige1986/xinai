import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// 会员等级数字转字符串映射
const membershipMap: Record<number, string> = {
  1: 'MEMBER',
  2: 'VIP',
  3: 'FOUNDER',
};

// 获取推广奖励积分
async function getReferralRewardPoints(level: 1 | 2 | 3 = 1): Promise<number> {
  try {
    const key = level === 1 ? 'referralRewardPoints' : `referralLevel${level}Reward`;
    const setting = await prisma.siteSetting.findUnique({
      where: { key },
    });
    const defaultValue = level === 1 ? 10 : level === 2 ? 5 : 3;
    return setting ? parseInt(setting.value, 10) || defaultValue : defaultValue;
  } catch {
    return level === 1 ? 10 : level === 2 ? 5 : 3;
  }
}

// 获取多级推广是否启用
async function isMultiLevelReferralEnabled(level: 2 | 3): Promise<boolean> {
  try {
    const key = `referralLevel${level}Enabled`;
    const setting = await prisma.siteSetting.findUnique({
      where: { key },
    });
    return setting ? setting.value === 'true' : true;
  } catch {
    return true;
  }
}

// 获取推广是否启用
async function isReferralEnabled(): Promise<boolean> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'referralEnabled' },
    });
    return setting ? setting.value === 'true' : true;
  } catch {
    return true;
  }
}

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

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        referralCode: true,
        referralCount: true,
        points: true,
        membership: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 如果用户还没有推广码，生成一个
    let referralCode = user.referralCode;
    if (!referralCode) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let newCode = '';
      for (let i = 0; i < 6; i++) {
        newCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // 检查是否重复
      let codeExists = true;
      let attempts = 0;
      while (codeExists && attempts < 10) {
        const existing = await prisma.user.findUnique({
          where: { referralCode: newCode },
        });
        if (!existing) {
          codeExists = false;
        } else {
          newCode = '';
          for (let i = 0; i < 6; i++) {
            newCode += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          attempts++;
        }
      }

      // 更新用户推广码
      await prisma.user.update({
        where: { id: userId },
        data: { referralCode: newCode },
      });
      referralCode = newCode;
    }

    // 获取推广记录
    const referralRecords = await prisma.referralRecord.findMany({
      where: { referrerId: userId },
      include: {
        referred: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // 获取多级推广收益记录（2级、3级）
    const multiLevelRecords = await prisma.multiLevelReferralRecord.findMany({
      where: {
        earnerId: userId,
        level: { in: [2, 3] },
      },
      include: {
        newUser: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // 统计多级推广数据
    const level2Count = await prisma.multiLevelReferralRecord.count({
      where: { earnerId: userId, level: 2 },
    });
    const level3Count = await prisma.multiLevelReferralRecord.count({
      where: { earnerId: userId, level: 3 },
    });
    const level2Points = await prisma.multiLevelReferralRecord.aggregate({
      where: { earnerId: userId, level: 2 },
      _sum: { points: true },
    });
    const level3Points = await prisma.multiLevelReferralRecord.aggregate({
      where: { earnerId: userId, level: 3 },
      _sum: { points: true },
    });

    // 获取系统设置
    const rewardPoints = await getReferralRewardPoints(1);
    const level2Reward = await getReferralRewardPoints(2);
    const level3Reward = await getReferralRewardPoints(3);
    const level2Enabled = await isMultiLevelReferralEnabled(2);
    const level3Enabled = await isMultiLevelReferralEnabled(3);
    const enabled = await isReferralEnabled();

    // 构建推广链接
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const referralLink = `${baseUrl}/register?ref=${referralCode}`;

    // 计算创始股东专属的多级收益
    const membershipStr = membershipMap[user.membership] || 'MEMBER';
    const isFounder = membershipStr === 'FOUNDER';
    const totalLevel2Points = level2Points._sum?.points || 0;
    const totalLevel3Points = level3Points._sum?.points || 0;

    return NextResponse.json({
      enabled,
      referralCode,
      referralLink,
      isFounder,
      level2Enabled,
      level3Enabled,
      stats: {
        totalReferrals: user.referralCount,
        totalPoints: user.points,
        rewardPoints,
        // 多级推广统计（仅创始股东显示）
        level2: isFounder ? {
          enabled: level2Enabled,
          count: level2Count,
          points: totalLevel2Points,
          rewardPerReferral: level2Reward,
        } : null,
        level3: isFounder ? {
          enabled: level3Enabled,
          count: level3Count,
          points: totalLevel3Points,
          rewardPerReferral: level3Reward,
        } : null,
      },
      records: referralRecords.map((record) => ({
        id: record.id,
        level: 1,
        referredUser: {
          id: record.referred.id,
          username: record.referred.username,
          name: record.referred.name,
          avatar: record.referred.avatar,
        },
        points: record.points,
        status: record.status,
        createdAt: record.createdAt,
      })),
      // 多级推广记录（仅创始股东显示）
      multiLevelRecords: isFounder ? multiLevelRecords.map((record) => ({
        id: record.id,
        level: record.level,
        referredUser: {
          id: record.newUser.id,
          username: record.newUser.username,
          name: record.newUser.name,
          avatar: record.newUser.avatar,
        },
        points: record.points,
        status: record.status,
        createdAt: record.createdAt,
      })) : [],
    });
  } catch (error) {
    console.error('Get referral info error:', error);
    return NextResponse.json(
      { error: '获取推广信息失败' },
      { status: 500 }
    );
  }
}
