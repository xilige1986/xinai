import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  Plus,
  ArrowLeft,
  Edit,
  Trash2,
  TrendingUp,
} from 'lucide-react';

async function getUseCases() {
  return await prisma.useCase.findMany({
    orderBy: { adoptionRate: 'desc' },
    include: {
      _count: { select: { tools: true } },
    },
  });
}

export default async function UseCasesPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const useCases = await getUseCases();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">使用场景管理</h1>
            <p className="text-sm text-muted-foreground">管理工具使用场景和采用率</p>
          </div>
        </div>
        <Link href="/admin/usecases/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            添加场景
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            使用场景列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>场景名称</TableHead>
                <TableHead>标识</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    采用率
                  </div>
                </TableHead>
                <TableHead>工具数</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {useCases.map((useCase) => (
                <TableRow key={useCase.id}>
                  <TableCell>
                    <div className="font-medium">{useCase.name}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{useCase.slug}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate text-muted-foreground">
                      {useCase.description || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${Math.min(useCase.adoptionRate, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm">{Math.round(useCase.adoptionRate)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{useCase._count.tools}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Link href={`/admin/usecases/${useCase.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <form
                        action={`/api/usecases/${useCase.id}/delete`}
                        method="POST"
                        className="inline"
                      >
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
