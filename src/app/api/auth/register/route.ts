import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

// 获取注册验证码开关状态
async function getVerificationSettings() {
  try {
    const [emailVerifySetting, phoneVerifySetting] = await Promise.all([
      prisma.siteSetting.findUnique({ where: { key: 'registerEmailVerify' } }),
      prisma.siteSetting.findUnique({ where: { key: 'registerPhoneVerify' } }),
    ]);

    return {
      emailVerify: emailVerifySetting?.value === 'true',
      phoneVerify: phoneVerifySetting?.value === 'true',
    };
  } catch {
    return { emailVerify: false, phoneVerify: false };
  }
}

// 验证验证码
async function verifyCode(
  type: 'email' | 'phone',
  target: string,
  code: string
): Promise<boolean> {
  try {
    const verification = await prisma.verificationCode.findFirst({
      where: {
        type,
        code,
        used: false,
        expiresAt: { gt: new Date() },
        ...(type === 'email' ? { email: target } : { phone: target }),
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      return false;
    }

    // 标记验证码为已使用
    await prisma.verificationCode.update({
      where: { id: verification.id },
      data: { used: true },
    });

    return true;
  } catch (error) {
    console.error('Verify code error:', error);
    return false;
  }
}

// 生成6位推广码
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 排除 0,O,1,I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 获取推广奖励积分（从系统设置）
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
    return setting ? setting.value === 'true' : true; // 默认启用
  } catch {
    return true;
  }
}

// 获取多级推广是否仅限创始股东
async function isReferralFounderOnly(): Promise<boolean> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'referralFounderOnly' },
    });
    return setting ? setting.value === 'true' : true; // 默认仅限创始股东
  } catch {
    return true;
  }
}

// 检查推广码是否存在并返回用户ID和会员等级
async function getReferrerInfo(referralCode: string): Promise<{ id: number; membership: string } | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { referralCode },
      select: { id: true, membership: true },
    });
    return user ? { id: user.id, membership: user.membership } : null;
  } catch {
    return null;
  }
}

// 获取用户的推荐人链（向上追溯）
async function getReferralChain(userId: number, depth: number = 3): Promise<Array<{ id: number; membership: string }>> {
  const chain: Array<{ id: number; membership: string }> = [];
  let currentId: number | null = userId;

  for (let i = 0; i < depth && currentId; i++) {
    const user = await prisma.user.findUnique({
      where: { id: currentId },
      select: { referredBy: true, membership: true },
    });

    if (user?.referredBy) {
      const referrer = await prisma.user.findUnique({
        where: { id: user.referredBy },
        select: { id: true, membership: true },
      });
      if (referrer) {
        chain.push({ id: referrer.id, membership: referrer.membership });
        currentId = referrer.id;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return chain;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      username,
      email,
      password,
      name,
      phone,
      emailCode,
      phoneCode,
      referralCode: inputReferralCode,
    } = body;

    // 验证必填字段
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    // 验证用户名长度
    if (username.length < 3) {
      return NextResponse.json(
        { error: '用户名至少3个字符' },
        { status: 400 }
      );
    }

    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码至少6个字符' },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    // 检查验证码开关
    const { emailVerify, phoneVerify } = await getVerificationSettings();

    // 如果启用了邮箱验证码，验证邮箱验证码
    if (emailVerify) {
      if (!emailCode) {
        return NextResponse.json(
          { error: '请输入邮箱验证码' },
          { status: 400 }
        );
      }

      const isValid = await verifyCode('email', email, emailCode);
      if (!isValid) {
        return NextResponse.json(
          { error: '邮箱验证码错误或已过期' },
          { status: 400 }
        );
      }
    }

    // 如果启用了手机验证码，验证手机验证码
    if (phoneVerify) {
      if (!phone) {
        return NextResponse.json(
          { error: '请输入手机号' },
          { status: 400 }
        );
      }

      // 验证手机号格式
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        return NextResponse.json(
          { error: '请输入有效的手机号' },
          { status: 400 }
        );
      }

      if (!phoneCode) {
        return NextResponse.json(
          { error: '请输入手机验证码' },
          { status: 400 }
        );
      }

      const isValid = await verifyCode('phone', phone, phoneCode);
      if (!isValid) {
        return NextResponse.json(
          { error: '手机验证码错误或已过期' },
          { status: 400 }
        );
      }
    }

    // 检查用户名是否已存在
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: '用户名已被使用' },
        { status: 400 }
      );
    }

    // 检查邮箱是否已存在
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: '邮箱已被注册' },
        { status: 400 }
      );
    }

    // 检查手机号是否已被注册（如果提供了手机号）
    if (phone) {
      const existingPhone = await prisma.user.findFirst({
        where: { phone },
      });

      if (existingPhone) {
        return NextResponse.json(
          { error: '手机号已被注册' },
          { status: 400 }
        );
      }
    }

    // 处理推广码
    let referredBy: number | null = null;
    const levelRewards: { level: number; referrerId: number; points: number; membership: string }[] = [];

    if (inputReferralCode) {
      // 验证推广码是否有效（不能是自己，但目前还没创建用户，所以先查）
      const referrerInfo = await getReferrerInfo(inputReferralCode);
      if (referrerInfo) {
        referredBy = referrerInfo.id;

        // 获取配置
        const level1Reward = await getReferralRewardPoints(1);
        const level2Enabled = await isMultiLevelReferralEnabled(2);
        const level3Enabled = await isMultiLevelReferralEnabled(3);
        const level2Reward = await getReferralRewardPoints(2);
        const level3Reward = await getReferralRewardPoints(3);
        const founderOnly = await isReferralFounderOnly();

        // 1级奖励（直接推荐人）- 总是给奖励
        levelRewards.push({
          level: 1,
          referrerId: referrerInfo.id,
          points: level1Reward,
          membership: referrerInfo.membership,
        });

        // 获取上级推荐链
        const referralChain = await getReferralChain(referrerInfo.id, 2);

        // 2级奖励
        if (level2Enabled && referralChain.length >= 1) {
          const level2Referrer = referralChain[0];
          // 检查是否仅限创始股东
          if (!founderOnly || level2Referrer.membership === 'FOUNDER') {
            levelRewards.push({
              level: 2,
              referrerId: level2Referrer.id,
              points: level2Reward,
              membership: level2Referrer.membership,
            });
          }
        }

        // 3级奖励
        if (level3Enabled && referralChain.length >= 2) {
          const level3Referrer = referralChain[1];
          // 检查是否仅限创始股东
          if (!founderOnly || level3Referrer.membership === 'FOUNDER') {
            levelRewards.push({
              level: 3,
              referrerId: level3Referrer.id,
              points: level3Reward,
              membership: level3Referrer.membership,
            });
          }
        }
      }
    }

    // 生成唯一的推广码
    let newReferralCode = generateReferralCode();
    let codeExists = true;
    let attempts = 0;
    while (codeExists && attempts < 10) {
      const existing = await prisma.user.findUnique({
        where: { referralCode: newReferralCode },
      });
      if (!existing) {
        codeExists = false;
      } else {
        newReferralCode = generateReferralCode();
        attempts++;
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户（事务处理）
    const result = await prisma.$transaction(async (tx) => {
      // 1. 创建新用户
      const user = await tx.user.create({
        data: {
          username,
          email,
          phone: phone || null,
          password: hashedPassword,
          name: name || username,
          role: 'USER',
          status: 1,
          referralCode: newReferralCode,
          referredBy: referredBy,
          points: 0,
          referralCount: 0,
        },
      });

      // 2. 如果有推荐人，处理多级推广奖励
      for (const reward of levelRewards) {
        // 更新推荐人积分和计数（只有1级推荐增加计数）
        if (reward.level === 1) {
          await tx.user.update({
            where: { id: reward.referrerId },
            data: {
              points: { increment: reward.points },
              referralCount: { increment: 1 },
            },
          });
        } else {
          // 2级、3级只增加积分
          await tx.user.update({
            where: { id: reward.referrerId },
            data: {
              points: { increment: reward.points },
            },
          });
        }

        // 创建积分记录
        await tx.pointsLog.create({
          data: {
            userId: reward.referrerId,
            points: reward.points,
            type: reward.level === 1 ? 'REFERRAL' : 'MULTI_LEVEL_REFERRAL',
            description: `${reward.level}级推广奖励：用户 ${username} 注册`,
            relatedId: user.id,
          },
        });

        // 创建推广记录（1级）或多级推广记录（2级、3级）
        if (reward.level === 1) {
          await tx.referralRecord.create({
            data: {
              referrerId: reward.referrerId,
              referredId: user.id,
              points: reward.points,
              status: 1,
            },
          });
        }

        // 创建多级推广记录（用于统计和追踪）
        await tx.multiLevelReferralRecord.create({
          data: {
            newUserId: user.id,
            earnerId: reward.referrerId,
            level: reward.level,
            points: reward.points,
            membershipAtReward: reward.membership,
            status: 1,
          },
        });
      }

      return user;
    });

    return NextResponse.json(
      {
        user: {
          id: result.id,
          username: result.username,
          email: result.email,
          name: result.name,
          referralCode: result.referralCode,
        },
        message: '注册成功',
        referredBy: referredBy ? true : false,
        multiLevelRewards: levelRewards.map(r => ({
          level: r.level,
          points: r.points,
        })),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: '注册失败，请重试' },
      { status: 500 }
    );
  }
}
