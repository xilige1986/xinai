import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Wrench,
  BookOpen,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Folder,
  Target,
  Zap,
  Newspaper,
  BadgeDollarSign,
  MessageSquare,
  Star,
  Mail,
  Send,
  CalendarClock,
  Crown,
  Settings,
  Key,
  Fingerprint,
} from 'lucide-react';

// 根据数据库类型选择不同的查询方式
const dbProvider = process.env.DATABASE_URL?.startsWith('mysql') ? 'mysql' : 'sqlite';

async function getStats() {
  const membershipQuery = dbProvider === 'mysql'
    ? { vipUsers: 2, founderUsers: 3 }
    : { vipUsers: 'VIP', founderUsers: 'FOUNDER' };

  const [
    totalTools, pendingTools, publishedTools,
    totalCourses, totalUsers, totalCategories,
    totalUseCases, totalNews, publishedNews,
    pendingComments, pendingReviews, totalSubscribers,
    vipUsers, founderUsers, pendingNewsCount
  ] = await Promise.all([
    prisma.tool.count(),
    prisma.tool.count({ where: { status: 0 } }),
    prisma.tool.count({ where: { status: 1 } }),
    prisma.course.count(),
    prisma.user.count(),
    prisma.category.count(),
    prisma.useCase.count(),
    prisma.news.count(),
    prisma.news.count({ where: { status: 1 } }),
    prisma.comment.count({ where: { status: 0 } }),
    prisma.review.count({ where: { status: 0 } }),
    prisma.newsletterSubscriber.count({ where: { status: 1 } }),
    prisma.user.count({ where: { membership: membershipQuery.vipUsers as any } }),
    prisma.user.count({ where: { membership: membershipQuery.founderUsers as any } }),
    prisma.news.count({ where: { status: 0 } }),
  ]);

  return {
    totalTools,
    pendingTools,
    publishedTools,
    totalCourses,
    totalUsers,
    totalCategories,
    totalUseCases,
    totalNews,
    publishedNews,
    pendingComments,
    pendingReviews,
    totalSubscribers,
    vipUsers,
    founderUsers,
    pendingNewsCount,
  };
}

async function getPendingTools() {
  return await prisma.tool.findMany({
    where: { status: 0 },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      category: true,
      useCase: true,
    },
  });
}

async function getPendingNews() {
  return await prisma.news.findMany({
    where: { status: 0 },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: {
      commentList: {
        select: { id: true },
        take: 0,
      },
    },
  });
}

async function getPendingComments() {
  return await prisma.comment.findMany({
    where: { status: 0 },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      news: {
        select: { id: true, title: true, slug: true },
      },
    },
  });
}

async function getPendingReviews() {
  return await prisma.review.findMany({
    where: { status: 0 },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      tool: {
        select: { id: true, name: true, slug: true },
      },
    },
  });
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const stats = await getStats();
  const pendingTools = await getPendingTools();
  const pendingComments = await getPendingComments();
  const pendingReviews = await getPendingReviews();
  const pendingNews = await getPendingNews();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            管理后台
          </h1>
          <p className="text-muted-foreground mt-1">欢迎回来，{(session.user as any).name}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/tools/new">
            <Button>+ 添加工具</Button>
          </Link>
          <Link href="/admin/courses/new">
            <Button variant="outline">+ 添加课程</Button>
          </Link>
          <Link href="/admin/news/new">
            <Button variant="outline">+ 发布资讯</Button>
          </Link>
        </div>
      </div>

      {/* 快捷操作 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>快捷操作</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Link href="/admin/tools">
              <Button variant="outline" className="w-full justify-start">
                <Wrench className="mr-2 h-4 w-4" />
                工具管理
              </Button>
            </Link>
            <Link href="/admin/courses">
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="mr-2 h-4 w-4" />
                课程管理
              </Button>
            </Link>
            <Link href="/admin/categories">
              <Button variant="outline" className="w-full justify-start">
                <Folder className="mr-2 h-4 w-4" />
                分类管理
              </Button>
            </Link>
            <Link href="/admin/usecases">
              <Button variant="outline" className="w-full justify-start">
                <Target className="mr-2 h-4 w-4" />
                场景管理
              </Button>
            </Link>
            <Link href="/admin/quicklinks">
              <Button variant="outline" className="w-full justify-start">
                <Zap className="mr-2 h-4 w-4" />
                快捷入口
              </Button>
            </Link>
            <Link href="/admin/news">
              <Button variant="outline" className="w-full justify-start">
                <Newspaper className="mr-2 h-4 w-4" />
                资讯管理
                {stats.pendingNewsCount > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {stats.pendingNewsCount}
                  </Badge>
                )}
              </Button>
            </Link>
            <Link href="/admin/sponsors">
              <Button variant="outline" className="w-full justify-start">
                <BadgeDollarSign className="mr-2 h-4 w-4" />
                赞助商管理
              </Button>
            </Link>
            <Link href="/admin/comments">
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="mr-2 h-4 w-4" />
                评论审核
                {stats.pendingComments > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {stats.pendingComments}
                  </Badge>
                )}
              </Button>
            </Link>
            <Link href="/admin/reviews">
              <Button variant="outline" className="w-full justify-start">
                <Star className="mr-2 h-4 w-4" />
                点评审核
                {stats.pendingReviews > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {stats.pendingReviews}
                  </Badge>
                )}
              </Button>
            </Link>
            <Link href="/admin/subscribers">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="mr-2 h-4 w-4" />
                订阅管理
                {stats.totalSubscribers > 0 && (
                  <Badge className="ml-auto bg-green-500">
                    {stats.totalSubscribers}
                  </Badge>
                )}
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                用户管理
                {stats.totalUsers > 0 && (
                  <Badge className="ml-auto bg-blue-500">
                    {stats.totalUsers}
                  </Badge>
                )}
              </Button>
            </Link>
            <Link href="/admin/newsletter/send">
              <Button variant="outline" className="w-full justify-start">
                <Send className="mr-2 h-4 w-4" />
                发送邮件推送
              </Button>
            </Link>
            <Link href="/admin/newsletter/schedules">
              <Button variant="outline" className="w-full justify-start">
                <CalendarClock className="mr-2 h-4 w-4" />
                定时自动推送
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="mr-2 h-4 w-4" />
                网站设置
              </Button>
            </Link>
            <Link href="/admin/deployments">
              <Button variant="outline" className="w-full justify-start">
                <Fingerprint className="mr-2 h-4 w-4" />
                部署统计
              </Button>
            </Link>
            <Link href="/admin/change-password">
              <Button variant="outline" className="w-full justify-start">
                <Key className="mr-2 h-4 w-4" />
                修改密码
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总工具数</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTools}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">待审核</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingTools}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">已发布</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.publishedTools}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">课程总数</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">分类数量</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCategories}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">使用场景</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUseCases}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">用户总数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">资讯总数</CardTitle>
            <Newspaper className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalNews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">待审核资讯</CardTitle>
            <Newspaper className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingNewsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">待审核评论</CardTitle>
            <MessageSquare className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingComments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">待审核点评</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingReviews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">邮件订阅</CardTitle>
            <Mail className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalSubscribers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">VIP会员</CardTitle>
            <Crown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.vipUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">创始股东</CardTitle>
            <Star className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.founderUsers}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Tools & News */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>待审核工具</CardTitle>
            <Link href="/admin/tools?status=pending">
              <Button variant="ghost" size="sm">
                查看全部
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pendingTools.length > 0 ? (
              <div className="space-y-4">
                {pendingTools.map((tool) => (
                  <div
                    key={tool.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{tool.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {tool.category?.name} / {tool.useCase?.name} · {new Date(tool.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <form action={`/api/tools/${tool.id}/approve`} method="POST">
                        <Button type="submit" size="sm" variant="outline">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </Button>
                      </form>
                      <form action={`/api/tools/${tool.id}/reject`} method="POST">
                        <Button type="submit" size="sm" variant="outline">
                          <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">暂无待审核工具</p>
            )}
          </CardContent>
        </Card>

        {/* Pending Comments, Reviews & News */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>待审核内容</CardTitle>
            <div className="flex gap-2">
              <Link href="/admin/news">
                <Button variant="ghost" size="sm">
                  资讯
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/admin/comments">
                <Button variant="ghost" size="sm">
                  评论
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/admin/reviews">
                <Button variant="ghost" size="sm">
                  点评
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {(pendingComments.length > 0 || pendingReviews.length > 0 || pendingNews.length > 0) ? (
              <div className="space-y-4">
                {/* Pending News */}
                {pendingNews.map((news) => (
                  <div
                    key={`news-${news.id}`}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Newspaper className="h-4 w-4 text-yellow-500" />
                        <p className="font-medium truncate">{news.title}</p>
                        <span className="text-xs text-muted-foreground">
                          {news.category}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {news.summary || news.content.substring(0, 100)}...
                      </p>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <form action={`/api/news/${news.id}/approve`} method="POST">
                        <Button type="submit" size="sm" variant="outline">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </Button>
                      </form>
                      <form action={`/api/news/${news.id}/reject`} method="POST">
                        <Button type="submit" size="sm" variant="outline">
                          <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}

                {/* Pending Comments */}
                {pendingComments.map((comment) => (
                  <div
                    key={`comment-${comment.id}`}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-yellow-500" />
                        <p className="font-medium truncate">{comment.user?.name || '匿名用户'}</p>
                        <span className="text-xs text-muted-foreground">
                          评论了《{comment.news?.title}》
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {comment.content}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <form action={`/api/admin/comments/${comment.id}`} method="POST">
                        <input type="hidden" name="action" value="approve" />
                        <Button type="submit" size="sm" variant="outline">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </Button>
                      </form>
                      <form action={`/api/admin/comments/${comment.id}`} method="POST">
                        <input type="hidden" name="action" value="reject" />
                        <Button type="submit" size="sm" variant="outline">
                          <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}

                {/* Pending Reviews */}
                {pendingReviews.map((review) => (
                  <div
                    key={`review-${review.id}`}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <p className="font-medium truncate">{review.user?.name || '匿名用户'}</p>
                        <span className="text-xs text-muted-foreground">
                          点评了{review.tool?.name}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {review.content}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <form action={`/api/admin/reviews/${review.id}`} method="POST">
                        <input type="hidden" name="action" value="approve" />
                        <Button type="submit" size="sm" variant="outline">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </Button>
                      </form>
                      <form action={`/api/admin/reviews/${review.id}`} method="POST">
                        <input type="hidden" name="action" value="reject" />
                        <Button type="submit" size="sm" variant="outline">
                          <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">暂无待审核评论或点评</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
