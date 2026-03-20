import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Award,
  ChevronLeft,
  TrendingUp,
  FileText,
  Share2,
  Box,
  HelpCircle,
  ArrowUpRight,
  Star,
  Newspaper,
  Wrench,
  MessageSquare,
} from 'lucide-react';
import { membershipConfig, MembershipLevel } from '@/lib/membership';
import ContributionForm from './ContributionForm';

// 获取用户贡献记录
async function getUserContributions(userId: number) {
  const contributions = await prisma.founderContribution.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return contributions;
}

// 获取贡献统计
async function getContributionStats(userId: number) {
  const contributions = await prisma.founderContribution.findMany({
    where: { userId },
  });

  const totalPoints = contributions.reduce((sum, c) => sum + c.points, 0);
  const approvedCount = contributions.filter((c) => c.status === 1).length;
  const pendingCount = contributions.filter((c) => c.status === 0).length;

  return {
    totalPoints,
    totalCount: contributions.length,
    approvedCount,
    pendingCount,
  };
}

export default async function ContributionsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const userMembership = (session.user.membership as MembershipLevel) || 'MEMBER';
  const isFounder = userMembership === 'FOUNDER';

  const userId = parseInt(session.user.id as string);

  // 获取贡献记录和统计（仅创始股东）
  let contributions: any[] = [];
  let stats = { totalPoints: 0, totalCount: 0, approvedCount: 0, pendingCount: 0 };

  if (isFounder) {
    const [userContributions, userStats] = await Promise.all([
      getUserContributions(userId),
      getContributionStats(userId),
    ]);
    contributions = userContributions;
    stats = userStats;
  }

  // 获取贡献类型图标
  const getContributionTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      CONTENT: <FileText className="h-5 w-5" />,
      PROMOTION: <Share2 className="h-5 w-5" />,
      RESOURCE: <Box className="h-5 w-5" />,
      OTHER: <HelpCircle className="h-5 w-5" />,
      NEWS: <Newspaper className="h-5 w-5" />,
      TOOL: <Wrench className="h-5 w-5" />,
      REVIEW: <MessageSquare className="h-5 w-5" />,
    };
    return icons[type] || icons.OTHER;
  };

  // 获取贡献类型标签
  const getContributionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      CONTENT: '内容贡献',
      PROMOTION: '推广贡献',
      RESOURCE: '资源贡献',
      OTHER: '其他贡献',
      NEWS: '资讯贡献',
      TOOL: '工具贡献',
      REVIEW: '点评贡献',
    };
    return labels[type] || type;
  };

  // 获取状态标签
  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-600">
            待审核
          </Badge>
        );
      case 1:
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            已通过
          </Badge>
        );
      case 2:
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            已拒绝
          </Badge>
        );
      default:
        return <Badge variant="outline">未知</Badge>;
    }
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
            <h1 className="text-3xl font-bold">
              {isFounder ? '我的贡献' : '提交贡献'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isFounder
                ? '查看和管理您对平台的贡献记录'
                : '提交资讯、工具，参与平台建设'}
            </p>
          </div>
        </div>

        {/* Stats Cards - 仅创始股东显示 */}
        {isFounder && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">贡献积分</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {stats.totalPoints}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Star className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">总贡献数</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.totalCount}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Award className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">已通过</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.approvedCount}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Award className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">待审核</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {stats.pendingCount}
                    </p>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <Award className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Contribution Form */}
        <ContributionForm isFounder={isFounder} />

        {/* Contributions List - 仅创始股东显示 */}
        {isFounder && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>贡献明细</CardTitle>
              <Badge variant="secondary">共 {stats.totalCount} 笔</Badge>
            </CardHeader>
            <CardContent>
              {contributions.length > 0 ? (
                <div className="space-y-4">
                  {contributions.map((contribution) => (
                    <div
                      key={contribution.id}
                      className="flex items-start justify-between p-4 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 rounded-lg ${
                            contribution.status === 1
                              ? 'bg-green-100 text-green-600'
                              : contribution.status === 2
                              ? 'bg-red-100 text-red-600'
                              : 'bg-amber-100 text-amber-600'
                          }`}
                        >
                          {getContributionTypeIcon(contribution.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {contribution.title}
                            </span>
                            {getStatusBadge(contribution.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {contribution.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-muted-foreground">
                              {getContributionTypeLabel(contribution.type)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(contribution.createdAt).toLocaleString('zh-CN')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-purple-600">
                          +{contribution.points}
                        </p>
                        <p className="text-xs text-muted-foreground">积分</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">暂无贡献记录</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    在上方提交您的贡献，审核通过后积分将自动累计
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Links - 仅创始股东显示收益 */}
        {isFounder && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/dashboard/earnings">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">我的收益</p>
                      <p className="text-sm text-muted-foreground">
                        查看您的收益记录和结算状态
                      </p>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
