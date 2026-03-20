'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Upload, X, ImageIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateToolSlug } from '@/lib/slugify';

const pricingOptions = [
  { value: 'Free', label: '免费' },
  { value: 'Freemium', label: '免费增值' },
  { value: 'Paid', label: '付费' },
];

interface Category {
  id: number;
  name: string;
  subCategories: { id: number; name: string }[];
}

interface UseCase {
  id: number;
  name: string;
}

interface SubmitToolFormProps {
  categories: Category[];
  useCases: UseCase[];
}

export default function SubmitToolForm({ categories, useCases }: SubmitToolFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    websiteUrl: '',
    shortDesc: '',
    description: '',
    categoryId: '',
    subCategoryId: '',
    useCaseId: '',
    pricingType: 'Free',
    imageUrl: '',
  });

  // 获取当前选中的分类的子分类
  const selectedCategory = categories.find((cat) => cat.id.toString() === formData.categoryId);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch('/api/user/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '上传失败');
      }

      const data = await response.json();
      setFormData((prev) => ({ ...prev, imageUrl: data.url }));
      setPreviewUrl(URL.createObjectURL(file));
    } catch (err: any) {
      setError(err.message || 'LOGO 上传失败，请重试');
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

    try {
      const response = await fetch('/api/tools/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          categoryId: parseInt(formData.categoryId),
          subCategoryId: formData.subCategoryId ? parseInt(formData.subCategoryId) : undefined,
          useCaseId: parseInt(formData.useCaseId),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '提交失败');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertDescription className="text-green-800">
            工具提交成功！我们会在审核通过后尽快上架。
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">提交AI工具</CardTitle>
          <CardDescription>
            分享您发现或开发的优质AI工具，填写以下信息提交审核
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">工具名称 *</Label>
              <Input
                id="name"
                placeholder="例如：ChatGPT"
                value={formData.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  const newSlug = generateToolSlug(newName);
                  setFormData({ ...formData, name: newName, slug: newSlug });
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">
                URL 标识 *
                <span className="text-xs text-muted-foreground ml-2">（根据名称自动生成，可手动修改）</span>
              </Label>
              <Input
                id="slug"
                placeholder="例如：chatgpt"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                pattern="^[a-z0-9-]+$"
                title="只能使用小写字母、数字和连字符"
              />
              <p className="text-xs text-muted-foreground">
                只能使用小写字母、数字和连字符，将用于生成 URL: /tool/{formData.slug || 'example'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteUrl">官方网站 *</Label>
              <Input
                id="websiteUrl"
                type="url"
                placeholder="https://example.com"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                required
              />
            </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoryId">AI工具分类 *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoryId: value, subCategoryId: '' })
                  }
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
                  onValueChange={(value) =>
                    setFormData({ ...formData, subCategoryId: value })
                  }
                  disabled={!selectedCategory || selectedCategory.subCategories.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedCategory ? '选择子分类' : '请先选择主分类'} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCategory?.subCategories.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id.toString()}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="useCaseId">使用场景 *</Label>
              <Select
                value={formData.useCaseId}
                onValueChange={(value) =>
                  setFormData({ ...formData, useCaseId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择场景" />
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
              <Label htmlFor="pricingType">定价模式 *</Label>
              <Select
                value={formData.pricingType}
                onValueChange={(value) =>
                  setFormData({ ...formData, pricingType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pricingOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDesc">简短描述 *</Label>
              <Textarea
                id="shortDesc"
                placeholder="一句话介绍工具的主要功能（10-200字）"
                value={formData.shortDesc}
                onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
                required
                maxLength={200}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                {formData.shortDesc.length}/200 字
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">详细描述 *</Label>
              <Textarea
                id="description"
                placeholder="详细介绍工具的功能特点、适用场景、使用方法等（50-5000字）"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                minLength={50}
                maxLength={5000}
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/5000 字，至少50字
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? '提交中...' : '提交审核'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
