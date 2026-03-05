'use client';

import { useState, useEffect } from 'react';
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
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const pricingOptions = [
  { value: 'Free', label: '免费' },
  { value: 'Freemium', label: '免费增值' },
  { value: 'Paid', label: '付费' },
];

// AI工具主分类
const categories = [
  { id: 1, name: 'AI生产力' },
  { id: 2, name: 'AI视频' },
  { id: 3, name: 'AI文本' },
  { id: 4, name: 'AI商业' },
  { id: 5, name: 'AI图像' },
  { id: 6, name: 'AI自动化' },
  { id: 7, name: 'AI艺术' },
  { id: 8, name: 'AI音频' },
  { id: 9, name: 'AI编程' },
  { id: 10, name: '其他AI' },
];

// 使用场景
const useCases = [
  { id: 1, name: '客户服务与支持' },
  { id: 2, name: '销售' },
  { id: 3, name: '后勤' },
  { id: 4, name: '运营' },
  { id: 5, name: '增长与市场营销' },
  { id: 6, name: '写作与编辑' },
  { id: 7, name: '技术' },
  { id: 8, name: '设计与创意' },
  { id: 9, name: '工作流程自动化' },
];

export default function SubmitToolPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    websiteUrl: '',
    shortDesc: '',
    description: '',
    categoryId: '',
    subCategoryId: '',
    useCaseId: '',
    pricingType: 'Free',
  });

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
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
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
