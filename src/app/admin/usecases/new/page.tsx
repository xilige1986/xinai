import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Target } from 'lucide-react';

export default async function NewUseCasePage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/admin/login');
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/usecases">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">添加使用场景</h1>
          <p className="text-sm text-muted-foreground">创建新的工具使用场景</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            场景信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/api/usecases" method="POST" className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">场景名称 *</Label>
              <Input
                id="name"
                name="name"
                placeholder="例如：内容营销"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL 标识 *</Label>
              <Input
                id="slug"
                name="slug"
                placeholder="例如：content-marketing"
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
                placeholder="场景的简要描述..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adoptionRate">采用率 (%)</Label>
              <Input
                id="adoptionRate"
                name="adoptionRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                defaultValue="0"
              />
              <p className="text-xs text-muted-foreground">
                该场景在行业中的采用率，用于排序展示
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Link href="/admin/usecases">
                <Button type="button" variant="ghost">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回列表
                </Button>
              </Link>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                创建场景
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
