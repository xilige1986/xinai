import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToolCard } from '@/components/tool-card';
import { LogoutButton } from '@/components/logout-button';
import {
  User,
  Heart,
  BookOpen,
  ChevronRight,
  MessageSquare,
  Star,
  ShoppingBag,
  Crown,
  TrendingUp,
  Award,
  Share2,
  Gift,
  Coins,
} from 'lucide-react';
import { membershipConfig, MembershipLevel } from '@/lib/membership';

async function getUserFavorites(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      favorites: {
        where: { status: 1 },
        include: {
          category: true,
          subCategory: true,
          useCase: true,
        },
        take: 6,
      },
    },
  });
  return user?.favorites || [];
}

// 获取用户评论
async function getUserReviews(userId: number) {
  const reviews = await prisma.review.findMany({
    where: { userId },
    include: {
      tool: {
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  return reviews;
}

// 获取用户评论数量（工具点评 + 资讯评论）
async function getUserReviewCount(userId: number) {
  const [toolReviewCount, newsCommentCount] = await Promise.all([
    prisma.review.count({
      where: { userId },
    }),
    prisma.comment.count({
      where: { userId },
    }),
  ]);
  return toolReviewCount + newsCommentCount;
}

// 获取用户学习的课程数量（包括免费课程和已购买的付费课程）
async function getUserLearningCoursesCount(userId: number) {
  // 获取用户已购买的付费课程
  const paidCourses = await prisma.order.count({
    where: {
      userId,
      status: 1, // 已支付
    },
  });

  // 获取用户有学习进度的免费课程（通过 LessonProgress 关联查询）
  const freeCourseProgress = await prisma.lessonProgress.findMany({
    where: { userId },
    include: {
      lesson: {
        select: {
          courseId: true,
        },
      },
    },
    distinct: ['courseId'],
  });

  // 获取这些课程ID对应的课程，筛选出免费的
  const courseIds = freeCourseProgress.map(p => p.courseId);
  const freeCourses = await prisma.course.count({
    where: {
      id: { in: courseIds },
      price: 0,
    },
  });

  return paidCourses + freeCourses;
}

// 获取用户推广信息
async function getUserReferralInfo(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      referralCode: true,
      referralCount: true,
      points: true,
    },
  });

  if (!user || !user.referralCode) {
    // 生成推广码
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

    return {
      referralCode: newCode,
      referralCount: 0,
      points: 0,
    };
  }

  return {
    referralCode: user.referralCode,
    referralCount: user.referralCount,
    points: user.points,
  };
}

// 获取推广奖励积分
async function getReferralRewardPoints(): Promise<number> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'referralRewardPoints' },
    });
    return setting ? parseInt(setting.value, 10) || 10 : 10;
  } catch {
    return 10;
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  // 管理员重定向到后台
  if (session.user.role === 'ADMIN') {
    redirect('/admin');
  }

  const userId = parseInt(session.user.id as string);
  const userMembership = (session.user.membership as MembershipLevel) || 'MEMBER';
  const membershipInfo = membershipConfig[userMembership] || membershipConfig.MEMBER;
  const isFounder = userMembership === 'FOUNDER';
  const isVIP = userMembership === 'VIP' || userMembership === 'FOUNDER';
  const [favorites, reviews, reviewCount, learningCoursesCount, referralInfo, rewardPoints] = await Promise.all([
    getUserFavorites(userId),
    getUserReviews(userId),
    getUserReviewCount(userId),
    getUserLearningCoursesCount(userId),
    getUserReferralInfo(userId),
    getReferralRewardPoints(),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">个人中心</h1>
            <p className="text-muted-foreground mt-1">
              欢迎回来，{session.user.name || session.user.username}
            </p>
          </div>
          <div className="flex gap-3">
            <LogoutButton variant="outline" size="sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* User Info Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold mb-4">
                    {(session.user.name || session.user.username || 'U').slice(0, 2)}
                  </div>
                  <h3 className="font-semibold text-lg">{session.user.name || session.user.username}</h3>
                  <p className="text-sm text-muted-foreground">{session.user.email}</p>
                  <div className="mt-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full ${membershipInfo.bgColor} ${membershipInfo.color}`}>
                      {isVIP && <Crown className="h-3 w-3" />}
                      {membershipInfo.label}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">快捷导航</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 text-primary"
                >
                  <User className="h-5 w-5" />
                  <span>个人中心</span>
                </Link>
                <Link
                  href="/dashboard/favorites"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <Heart className="h-5 w-5" />
                  <span>我的收藏</span>
                </Link>
                <Link
                  href="/dashboard/courses"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <BookOpen className="h-5 w-5" />
                  <span>我的课程</span>
                </Link>
                <Link
                  href="/orders"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <ShoppingBag className="h-5 w-5" />
                  <span>我的订单</span>
                </Link>
                <Link
                  href="/dashboard/reviews"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>我的评论</span>
                </Link>
                <Link
                  href="/dashboard/referral"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <Share2 className="h-5 w-5" />
                  <span>我的推广</span>
                  {referralInfo.points > 0 && (
                    <span className="ml-auto bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                      {referralInfo.points}积分
                    </span>
                  )}
                </Link>
                <Link
                  href="/dashboard/points"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <Coins className="h-5 w-5" />
                  <span>积分记录</span>
                  {referralInfo.points > 0 && (
                    <span className="ml-auto bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
                      {referralInfo.points}
                    </span>
                  )}
                </Link>
                {isFounder && (
                  <>
                    <Link
                      href="/dashboard/earnings"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <TrendingUp className="h-5 w-5" />
                      <span>我的收益</span>
                    </Link>
                    <Link
                      href="/dashboard/contributions"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Award className="h-5 w-5" />
                      <span>我的贡献</span>
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">我的收藏</p>
                      <p className="text-2xl font-bold">{favorites.length}</p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-lg">
                      <Heart className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">我的评论</p>
                      <p className="text-2xl font-bold">{reviewCount}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">在学课程</p>
                      <p className="text-2xl font-bold">{learningCoursesCount}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <BookOpen className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Referral Invitation Card */}
            <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="h-5 w-5 text-purple-600" />
                      <h3 className="font-semibold text-lg">邀请好友，赚取积分</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      每成功邀请一位好友注册，您将获得 <span className="font-bold text-purple-600">{rewardPoints} 积分</span> 奖励！
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-white rounded-lg px-4 py-2 border border-purple-200">
                        <p className="text-xs text-muted-foreground mb-1">您的专属推广码</p>
                        <p className="font-mono font-bold text-lg text-purple-700">{referralInfo.referralCode}</p>
                      </div>
                      <div className="flex-1 bg-white rounded-lg px-4 py-2 border border-purple-200">
                        <p className="text-xs text-muted-foreground mb-1">已成功邀请</p>
                        <p className="font-bold text-lg text-green-600">{referralInfo.referralCount} 人</p>
                      </div>
                      <div className="flex-1 bg-white rounded-lg px-4 py-2 border border-purple-200">
                        <p className="text-xs text-muted-foreground mb-1">累计获得积分</p>
                        <p className="font-bold text-lg text-amber-600">{referralInfo.points}</p>
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:block ml-6">
                    <Link href="/dashboard/referral">
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        <Share2 className="h-4 w-4 mr-2" />
                        去推广
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Favorites - iOS 风格图标展示 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>我的收藏</CardTitle>
                <Link href="/dashboard/favorites">
                  <Button variant="ghost" size="sm">
                    查看全部
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {favorites.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
                    {favorites.slice(0, 12).map((tool) => (
                      <Link
                        key={tool.id}
                        href={`/tool/${tool.slug}`}
                        className="flex flex-col items-center gap-2 group"
                      >
                        {/* iOS 风格圆角图标 */}
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-white shadow-md group-hover:shadow-lg transition-shadow border border-gray-100">
                          {tool.imageUrl ? (
                            <img
                              src={tool.imageUrl}
                              alt={tool.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold text-lg">
                              {tool.name[0]}
                            </div>
                          )}
                        </div>
                        {/* 应用名称 */}
                        <span className="text-xs text-center text-muted-foreground group-hover:text-primary transition-colors line-clamp-1 max-w-[72px]">
                          {tool.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">暂无收藏的工具</p>
                    <Link href="/tools">
                      <Button className="mt-4" variant="outline">
                        去浏览工具
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>我的评论</CardTitle>
                <Link href="/dashboard/reviews">
                  <Button variant="ghost" size="sm">
                    查看全部
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="flex items-start gap-4 p-4 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-colors"
                      >
                        <Link href={`/tool/${review.tool.slug}`}>
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                            {review.tool.imageUrl ? (
                              <img
                                src={review.tool.imageUrl}
                                alt={review.tool.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold text-sm">
                                {review.tool.name[0]}
                              </div>
                            )}
                          </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Link href={`/tool/${review.tool.slug}`}>
                              <span className="font-medium hover:text-primary transition-colors">
                                {review.tool.name}
                              </span>
                            </Link>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm text-muted-foreground">{review.rating}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {review.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(review.createdAt).toLocaleDateString('zh-CN')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">暂无评论</p>
                    <Link href="/tools">
                      <Button className="mt-4" variant="outline">
                        去浏览工具
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
