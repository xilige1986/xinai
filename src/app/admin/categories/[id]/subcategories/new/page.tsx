import { getServerSession } from 'next-auth/next';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Folder, ChevronRight } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getCategory(id: number) {
  return await prisma.category.findUnique({
    where: { id },
  });
}

export default async function NewSubCategoryPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const { id } = await params;
  const categoryId = parseInt(id);
  if (isNaN(categoryId)) {
    notFound();
  }

  const category = await getCategory(categoryId);

  if (!category) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/categories">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/admin/categories" className="hover:text-primary">分类管理</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href={`/admin/categories/${category.id}/edit`} className="hover:text-primary">{category.name}</Link>
            <ChevronRight className="h-4 w-4" />
            <span>添加子分类</span>
          </div>
          <h1 className="text-2xl font-bold">添加子分类</h1>
          <p className="text-sm text-muted-foreground">在 {category.name} 下创建子分类</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            子分类信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={`/api/categories/${category.id}/subcategories`} method="POST" className="space-y-6">
            <div className="p-3 bg-muted rounded-lg mb-4">
              <span className="text-sm text-muted-foreground">所属分类：</span>
              <span className="font-medium">{category.name}</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">子分类名称 *</Label>
              <Input
                id="name"
                name="name"
                placeholder="例如：头像生成"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL 标识 *</Label>
              <Input
                id="slug"
                name="slug"
                placeholder="例如：avatar-generator"
                required
              />
              <p className="text-xs text-muted-foreground">
                用于 URL 中的唯一标识，只能包含字母、数字和横线
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="子分类的简要描述..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Link href="/admin/categories">
                <Button type="button" variant="ghost">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回列表
                </Button>
              </Link>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                创建子分类
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
