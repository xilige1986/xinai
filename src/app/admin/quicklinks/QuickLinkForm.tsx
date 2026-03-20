'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

interface QuickLink {
  id: number;
  label: string;
  href: string;
  sortOrder: number;
  isActive: boolean;
}

interface QuickLinkFormProps {
  quickLink?: QuickLink;
}

export function QuickLinkForm({ quickLink }: QuickLinkFormProps) {
  const router = useRouter();
  const isEditing = !!quickLink;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    label: quickLink?.label || '',
    href: quickLink?.href || '',
    sortOrder: quickLink?.sortOrder ?? 0,
    isActive: quickLink?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const url = isEditing
        ? `/api/quicklinks/${quickLink.id}`
        : '/api/quicklinks';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '保存失败');
      }

      setSuccess(isEditing ? '更新成功' : '创建成功');
      if (!isEditing) {
        router.push('/admin/quicklinks');
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || '保存失败，请重试');
    } finally {
      setIsSubmitting(false);
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
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">显示名称 *</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="例如：ChatGPT"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="href">链接地址 *</Label>
            <Input
              id="href"
              value={formData.href}
              onChange={(e) => setFormData({ ...formData, href: e.target.value })}
              placeholder="例如：/tool/chatgpt 或 https://chatgpt.com"
              required
            />
            <p className="text-xs text-muted-foreground">
              可以填写站内链接（如 /tool/chatgpt）或外部链接（如 https://chatgpt.com）
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortOrder">排序值</Label>
            <Input
              id="sortOrder"
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
            />
            <p className="text-xs text-muted-foreground">
              数值越小排序越靠前
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label htmlFor="isActive">显示在首页</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between pt-4 border-t">
        <Link href="/admin/quicklinks">
          <Button type="button" variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Button>
        </Link>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              保存
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
