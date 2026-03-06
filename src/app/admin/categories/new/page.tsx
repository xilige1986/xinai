import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Folder } from 'lucide-react';

export default async function NewCategoryPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/admin/login');
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
          <h1 className="text-2xl font-bold">添加分类</h1>
          <p className="text-sm text-muted-foreground">创建新的工具主分类</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            分类信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/api/categories" method="POST" className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">分类名称 *</Label>
              <Input
                id="name"
                name="name"
                placeholder="例如：AI 写作工具"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL 标识 *</Label>
              <Input
                id="slug"
                name="slug"
                placeholder="例如：ai-writing"
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
                placeholder="分类的简要描述..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">图标</Label>
              <Input
                id="icon"
                name="icon"
                placeholder="图标名称或路径"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">排序值</Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                defaultValue="0"
              />
              <p className="text-xs text-muted-foreground">
                数值越小排序越靠前
              </p>
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
                创建分类
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
