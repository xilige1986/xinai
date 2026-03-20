import { prisma } from './db';

// 会员等级
export type MembershipLevel = 'MEMBER' | 'VIP' | 'FOUNDER';

// 课程访问检查结果
export interface CourseAccessResult {
  hasAccess: boolean;
  reason?: string;
  // 购买选项
  canPurchaseWithMoney?: boolean;
  canPurchaseWithPoints?: boolean;
  moneyPrice?: number;
  requiredPoints?: number;
  userPoints?: number;
}

// 会员等级配置
export const membershipConfig = {
  MEMBER: {
    label: '普通会员',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    canAccessPaidCourses: false,
    canAccessFreeCourses: true,
    hasEarnings: false,
    hasContributions: false,
  },
  VIP: {
    label: 'VIP会员',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    canAccessPaidCourses: true,
    canAccessFreeCourses: true,
    hasEarnings: false,
    hasContributions: false,
  },
  FOUNDER: {
    label: '创始股东',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    canAccessPaidCourses: false,
    canAccessFreeCourses: true,
    hasEarnings: true,
    hasContributions: true,
  },
};

/**
 * 检查用户是否有权限访问课程
 * @param userId 用户ID
 * @param userMembership 用户会员等级
 * @param courseId 课程ID
 */
export async function checkCourseAccess(
  userId: number,
  userMembership: string,
  courseId: number
): Promise<CourseAccessResult> {
  // 获取课程信息
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    return { hasAccess: false, reason: '课程不存在' };
  }

  // VIP 可以免费访问所有课程（包括积分课程）
  if (userMembership === 'VIP') {
    return { hasAccess: true };
  }

  // 免费课程（价格0且不支持积分购买，或积分要求为0）
  if (course.price === 0 && (!course.allowPointsPurchase || course.pointsRequired === 0)) {
    return { hasAccess: true };
  }

  // 检查是否已购买（资金购买）
  const order = await prisma.order.findFirst({
    where: {
      userId,
      courseId,
      status: 1, // 已支付
    },
  });

  if (order) {
    return { hasAccess: true };
  }

  // 检查是否已用积分解锁
  const pointsAccess = await prisma.coursePointsAccess.findUnique({
    where: {
      userId_courseId: { userId, courseId },
    },
  });

  if (pointsAccess) {
    return { hasAccess: true };
  }

  // 获取用户积分
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { points: true },
  });

  // 返回购买选项
  const result: CourseAccessResult = {
    hasAccess: false,
    reason: '需要购买课程或升级为VIP会员',
    canPurchaseWithMoney: course.allowMoneyPurchase && course.price > 0,
    canPurchaseWithPoints: course.allowPointsPurchase && course.pointsRequired > 0,
    moneyPrice: course.allowMoneyPurchase ? course.price : undefined,
    requiredPoints: course.allowPointsPurchase ? course.pointsRequired : undefined,
    userPoints: user?.points || 0,
  };

  // 如果没有可用的购买方式
  if (!result.canPurchaseWithMoney && !result.canPurchaseWithPoints) {
    result.reason = '该课程暂不可购买';
  }

  return result;
}

/**
 * 获取用户会员信息
 * @param userId 用户ID
 */
export async function getUserMembership(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      membership: true,
      avatar: true,
    },
  });

  if (!user) return null;

  const config = membershipConfig[user.membership as MembershipLevel] || membershipConfig.MEMBER;

  return {
    ...user,
    ...config,
  };
}

/**
 * 检查是否为创始股东
 * @param membership 会员等级
 */
export function isFounder(membership: string): boolean {
  return membership === 'FOUNDER';
}

/**
 * 检查是否为VIP或创始股东
 * @param membership 会员等级
 */
export function isVIPOrAbove(membership: string): boolean {
  return membership === 'VIP' || membership === 'FOUNDER';
}
