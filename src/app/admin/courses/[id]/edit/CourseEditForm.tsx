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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Save, X, BookOpen, Trash2, Eye } from 'lucide-react';

interface CourseEditFormProps {
  course: {
    id: number;
    title: string;
    slug: string;
    description: string;
    coverImage: string | null;
    price: number;
    buyUrl: string;
    level: string;
    studentCount: number;
    status: number;
    tools: { id: number; name: string }[];
  };
  tools: { id: number; name: string }[];
}

export function CourseEditForm({ course, tools }: CourseEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTools, setSelectedTools] = useState<number[]>(
    course.tools.map((t) => t.id)
  );

  const [formData, setFormData] = useState({
    title: course.title,
    slug: course.slug,
    description: course.description,
    coverImage: course.coverImage || '',
    price: course.price,
    buyUrl: course.buyUrl,
    level: course.level,
    status: course.status,
  });

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTool = (toolId: number) => {
    setSelectedTools((prev) =>
      prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price.toString()) || 0,
          toolIds: selectedTools,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '保存失败');
      }

      setSuccess('课程已更新');
      router.refresh();
    } catch (err: any) {
      setError(err.message || '保存失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这个课程吗？')) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '删除失败');
      }

      router.push('/admin/courses');
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">课程标题 *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
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
                <Label htmlFor="description">课程描述 *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverImage">封面图片 URL</Label>
                <Input
                  id="coverImage"
                  value={formData.coverImage}
                  onChange={(e) => handleChange('coverImage', e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyUrl">购买链接 *</Label>
                <Input
                  id="buyUrl"
                  type="url"
                  value={formData.buyUrl}
                  onChange={(e) => handleChange('buyUrl', e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>关联工具</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedTools.map((toolId) => {
                  const tool = tools.find((t) => t.id === toolId);
                  return tool ? (
                    <Badge key={toolId} variant="secondary" className="gap-1">
                      {tool.name}
                      <button
                        type="button"
                        onClick={() => toggleTool(toolId)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null;
                })}
              </div>
              <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                {tools.map((tool) => (
                  <label
                    key={tool.id}
                    className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTools.includes(tool.id)}
                      onChange={() => toggleTool(tool.id)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{tool.name}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>课程设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">价格 (元)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">难度等级</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => handleChange('level', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">入门</SelectItem>
                    <SelectItem value="Intermediate">进阶</SelectItem>
                    <SelectItem value="Advanced">高级</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">发布状态</Label>
                <Select
                  value={formData.status.toString()}
                  onValueChange={(value) => handleChange('status', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">草稿</SelectItem>
                    <SelectItem value="1">已发布</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Stats */}
              <div className="p-3 bg-muted rounded-md">
                <div className="text-sm text-muted-foreground">
                  学员数：<span className="font-medium text-foreground">{course.studentCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <Link href="/admin/courses">
          <Button type="button" variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/course/${formData.slug}`} target="_blank">
            <Button type="button" variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              预览
            </Button>
          </Link>
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
    </form>
  );
}
