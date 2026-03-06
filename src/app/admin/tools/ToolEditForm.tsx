'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Save, Star, Upload, X, ImageIcon } from 'lucide-react';

interface ToolFormData {
  name: string;
  slug: string;
  shortDesc: string;
  description: string;
  websiteUrl: string;
  pricingType: string;
  status: number;
  categoryId: string;
  subCategoryId: string;
  useCaseId: string;
  sortOrder: number;
  imageUrl: string;
}

interface Category {
  id: number;
  name: string;
  subCategories: { id: number; name: string }[];
}

interface UseCase {
  id: number;
  name: string;
}

interface ToolEditPageProps {
  tool: any;
  categories: Category[];
  useCases: UseCase[];
}

export function ToolEditForm({ tool, categories, useCases }: ToolEditPageProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const [formData, setFormData] = useState<ToolFormData>({
    name: tool?.name || '',
    slug: tool?.slug || '',
    shortDesc: tool?.shortDesc || '',
    description: tool?.description || '',
    websiteUrl: tool?.websiteUrl || '',
    pricingType: tool?.pricingType || 'Freemium',
    status: tool?.status ?? 1,
    categoryId: tool?.categoryId?.toString() || '',
    subCategoryId: tool?.subCategoryId?.toString() || '',
    useCaseId: tool?.useCaseId?.toString() || '',
    sortOrder: tool?.sortOrder ?? 0,
    imageUrl: tool?.imageUrl || '',
  });

  const selectedCategory = categories.find((c) => c.id.toString() === formData.categoryId);

  const handleChange = (field: keyof ToolFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '上传失败');
      }

      const data = await response.json();
      setFormData((prev) => ({ ...prev, imageUrl: data.imageUrl }));
      setPreviewUrl(URL.createObjectURL(file));
      setSuccess('LOGO 上传成功');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err: any) {
      setError(err.message || '上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
    setPreviewUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/tools/${tool.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
          subCategoryId: formData.subCategoryId ? parseInt(formData.subCategoryId) : null,
          useCaseId: formData.useCaseId ? parseInt(formData.useCaseId) : null,
          sortOrder: parseInt(formData.sortOrder.toString()) || 0,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '保存失败');
      }

      setSuccess('工具信息已更新');
      router.refresh();
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* LOGO Upload */}
              <div className="space-y-2">
                <Label>工具 LOGO</Label>
                <div className="flex items-center gap-4">
                  {formData.imageUrl || previewUrl ? (
                    <div className="relative">
                      <div className="w-20 h-20 rounded-lg border overflow-hidden bg-white">
                        <img
                          src={previewUrl || formData.imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted transition-colors w-fit">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">
                        {isUploading ? '上传中...' : '上传 LOGO'}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/svg+xml"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      支持 JPG、PNG、WebP、SVG，最大 2MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">工具名称 *</Label>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDesc">简短描述 *</Label>
                <Input
                  id="shortDesc"
                  value={formData.shortDesc}
                  onChange={(e) => handleChange('shortDesc', e.target.value)}
                  placeholder="一句话介绍工具"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">详细描述 *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="websiteUrl">官网链接 *</Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => handleChange('websiteUrl', e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>分类与状态</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="categoryId">主分类 *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => {
                    handleChange('categoryId', value);
                    handleChange('subCategoryId', '');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subCategoryId">子分类</Label>
                <Select
                  value={formData.subCategoryId}
                  onValueChange={(value) => handleChange('subCategoryId', value)}
                  disabled={!selectedCategory?.subCategories?.length}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择子分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCategory?.subCategories?.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id.toString()}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="useCaseId">使用场景 *</Label>
                <Select
                  value={formData.useCaseId}
                  onValueChange={(value) => handleChange('useCaseId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择使用场景" />
                  </SelectTrigger>
                  <SelectContent>
                    {useCases.map((uc) => (
                      <SelectItem key={uc.id} value={uc.id.toString()}>
                        {uc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricingType">定价类型 *</Label>
                <Select
                  value={formData.pricingType}
                  onValueChange={(value) => handleChange('pricingType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Free">免费</SelectItem>
                    <SelectItem value="Paid">付费</SelectItem>
                    <SelectItem value="Freemium">免费增值</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">发布状态 *</Label>
                <Select
                  value={formData.status.toString()}
                  onValueChange={(value) => handleChange('status', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">待审核</SelectItem>
                    <SelectItem value="1">已发布</SelectItem>
                    <SelectItem value="2">已拒绝</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                运营设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sortOrder">推荐排序值</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => handleChange('sortOrder', parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  数值越大排序越靠前，用于"推荐"排序模式
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Link href="/admin/tools">
          <Button type="button" variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/tool/${formData.slug}`} target="_blank">
            <Button type="button" variant="outline">
              预览
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
                保存修改
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
