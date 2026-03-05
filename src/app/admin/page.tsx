import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
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
} from 'lucide-react';

async function getStats() {
  const [totalTools, pendingTools, publishedTools, totalCourses, totalUsers, totalCategories, totalUseCases] =
    await Promise.all([
      prisma.tool.count(),
      prisma.tool.count({ where: { status: 0 } }),
      prisma.tool.count({ where: { status: 1 } }),
      prisma.course.count(),
      prisma.user.count(),
      prisma.category.count(),
      prisma.useCase.count(),
    ]);

  return {
    totalTools,
    pendingTools,
    publishedTools,
    totalCourses,
    totalUsers,
    totalCategories,
    totalUseCases,
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

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const stats = await getStats();
  const pendingTools = await getPendingTools();

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
        </div>
      </div>

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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Tools */}
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

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>快捷操作</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
