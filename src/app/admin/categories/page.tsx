import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Folder,
  Plus,
  ArrowLeft,
  Edit,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { SubCategoryList } from './SubCategoryList';

async function getCategories() {
  return await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      subCategories: true,
      _count: { select: { tools: true } },
    },
  });
}

export default async function CategoriesPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const categories = await getCategories();

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
            <h1 className="text-2xl font-bold">分类管理</h1>
            <p className="text-sm text-muted-foreground">管理工具分类和子分类</p>
          </div>
        </div>
        <Link href="/admin/categories/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            添加分类
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              主分类
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>排序</TableHead>
                  <TableHead>分类名称</TableHead>
                  <TableHead>标识</TableHead>
                  <TableHead>工具数</TableHead>
                  <TableHead>子分类</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.sortOrder}</TableCell>
                    <TableCell>
                      <div className="font-medium">{category.name}</div>
                      {category.description && (
                        <div className="text-sm text-muted-foreground">
                          {category.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{category.slug}</Badge>
                    </TableCell>
                    <TableCell>{category._count.tools}</TableCell>
                    <TableCell>{category.subCategories.length}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Link href={`/admin/categories/${category.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <form
                          action={`/api/categories/${category.id}/delete`}
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

        {/* SubCategories */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ChevronRight className="h-5 w-5" />
              子分类管理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SubCategoryList categories={categories} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
