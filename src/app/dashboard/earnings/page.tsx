import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  ChevronLeft,
  Award,
  Wallet,
  ArrowUpRight,
} from 'lucide-react';
import { membershipConfig, MembershipLevel } from '@/lib/membership';

// 获取用户收益记录
async function getUserEarnings(userId: number) {
  const earnings = await prisma.founderEarning.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return earnings;
}

// 获取收益统计
async function getEarningsStats(userId: number) {
  const earnings = await prisma.founderEarning.findMany({
    where: { userId },
  });

  const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
  const pendingEarnings = earnings
    .filter((e) => e.status === 0)
    .reduce((sum, e) => sum + e.amount, 0);
  const settledEarnings = earnings
    .filter((e) => e.status === 1)
    .reduce((sum, e) => sum + e.amount, 0);

  return {
    total: totalEarnings,
    pending: pendingEarnings,
    settled: settledEarnings,
    count: earnings.length,
  };
}

export default async function FounderEarningsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const userMembership = (session.user.membership as MembershipLevel) || 'MEMBER';
  const membershipInfo = membershipConfig[userMembership] || membershipConfig.MEMBER;

  // 只有创始股东可以访问
  if (userMembership !== 'FOUNDER') {
    redirect('/dashboard');
  }

  const userId = parseInt(session.user.id as string);
  const [earnings, stats] = await Promise.all([
    getUserEarnings(userId),
    getEarningsStats(userId),
  ]);

  // 格式化金额
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // 获取收益类型标签
  const getEarningTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PLATFORM_SHARE: '平台分成',
      REFERRAL: '推荐奖励',
      BONUS: '额外奖励',
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              返回个人中心
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">我的收益</h1>
            <p className="text-muted-foreground mt-1">
              查看您的创始股东收益记录
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">累计收益</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatAmount(stats.total)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Wallet className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">待结算</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {formatAmount(stats.pending)}
                  </p>
                </div>
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">已结算</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatAmount(stats.settled)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Earnings List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>收益明细</CardTitle>
            <Badge variant="secondary">共 {stats.count} 笔</Badge>
          </CardHeader>
          <CardContent>
            {earnings.length > 0 ? (
              <div className="space-y-4">
                {earnings.map((earning) => (
                  <div
                    key={earning.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-lg ${
                          earning.status === 1
                            ? 'bg-green-100 text-green-600'
                            : 'bg-amber-100 text-amber-600'
                        }`}
                      >
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {getEarningTypeLabel(earning.type)}
                          </span>
                          {earning.status === 0 ? (
                            <Badge variant="outline" className="text-amber-600 border-amber-600">
                              待结算
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              已结算
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {earning.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(earning.createdAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        +{formatAmount(earning.amount)}
                      </p>
                      {earning.settledAt && (
                        <p className="text-xs text-muted-foreground">
                          结算于 {new Date(earning.settledAt).toLocaleDateString('zh-CN')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">暂无收益记录</p>
                <p className="text-sm text-muted-foreground mt-2">
                  您的收益将在产生后显示在这里
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/dashboard/contributions">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Award className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">我的贡献</p>
                    <p className="text-sm text-muted-foreground">
                      查看和管理您的平台贡献记录
                    </p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
