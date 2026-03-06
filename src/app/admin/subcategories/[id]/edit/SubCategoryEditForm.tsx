'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, Folder, Trash2, Loader2, ChevronRight } from 'lucide-react';

interface SubCategoryEditFormProps {
  subCategory: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    categoryId: number;
    category: {
      id: number;
      name: string;
    };
    _count?: {
      tools: number;
    };
  };
}

export function SubCategoryEditForm({ subCategory }: SubCategoryEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: subCategory.name,
    slug: subCategory.slug,
    description: subCategory.description || '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/subcategories/${subCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '保存失败');
      }

      setSuccess('子分类已更新');
      router.refresh();
    } catch (err: any) {
      setError(err.message || '保存失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这个子分类吗？相关的工具将失去子分类关联。')) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/subcategories/${subCategory.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '删除失败');
      }

      router.push('/admin/categories');
    } catch (err: any) {
      setError(err.message || '删除失败，请重试');
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            子分类信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">所属分类：</span>
            <Link href={`/admin/categories/${subCategory.category.id}/edit`} className="font-medium hover:text-primary">
              {subCategory.category.name}
            </Link>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">子分类名称 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL 标识 *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => handleChange('slug', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Stats */}
          {subCategory._count && (
            <div className="p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">关联工具数：</span>
              <span className="font-medium">{subCategory._count.tools}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <Link href="/admin/categories">
              <Button type="button" variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回列表
              </Button>
            </Link>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                删除
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                保存修改
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
