'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Newspaper, Loader2, Image as ImageIcon } from 'lucide-react';
import SimpleEditor from '@/components/simple-editor';

interface News {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  category: string;
  tags: string | null;
  author: string;
  source: string | null;
  sourceUrl: string | null;
  coverImage: string | null;
  status: number;
  isHot: boolean;
  views: number;
  likes: number;
}

// 生成 slug
function generateSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);

  // 如果处理后的 slug 为空（全是中文等情况），使用时间戳
  if (!slug) {
    return 'news-' + Date.now().toString(36);
  }

  return slug;
}

// 从 HTML 内容中提取纯文本摘要
function extractSummary(htmlContent: string, maxLength: number = 150): string {
  // 去除 HTML 标签
  const text = htmlContent.replace(/<[^>]*>/g, '');
  // 去除多余空白
  const cleanText = text.replace(/\s+/g, ' ').trim();
  // 截取指定长度
  if (cleanText.length <= maxLength) {
    return cleanText;
  }
  return cleanText.substring(0, maxLength) + '...';
}

// 图片上传组件
function ImageUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(value);

  useEffect(() => {
    setPreview(value);
  }, [value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 显示预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 上传到服务器
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'news');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('上传失败');

      const data = await res.json();
      onChange(data.url);
    } catch (err) {
      alert('图片上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/uploads/news/xxx.jpg 或输入URL"
          className="flex-1"
        />
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          <Button type="button" variant="outline" disabled={isUploading}>
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
            上传
          </Button>
        </div>
      </div>
      {preview && (
        <div className="relative w-40 h-24 rounded-lg overflow-hidden border">
          <img
            src={preview}
            alt="封面预览"
            className="w-full h-full object-cover"
            onError={() => setPreview('')}
          />
        </div>
      )}
    </div>
  );
}

export default function NewsEditForm({ news }: { news: News }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState(news.title);
  const [slug, setSlug] = useState(news.slug);
  const [content, setContent] = useState(news.content);
  const [coverImage, setCoverImage] = useState(news.coverImage || '');

  // 自动生成 slug
  const handleTitleChange = (value: string) => {
    setTitle(value);
    // 如果 slug 是空的或者是根据原标题生成的，则自动更新
    if (!slug || slug === generateSlug(news.title)) {
      setSlug(generateSlug(value));
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    // 使用当前状态值
    formData.set('title', title);
    formData.set('slug', slug);
    formData.set('content', content);
    formData.set('coverImage', coverImage);

    // 如果摘要为空，自动从正文截取
    const summary = formData.get('summary') as string;
    if (!summary.trim() && content) {
      formData.set('summary', extractSummary(content, 150));
    }

    try {
      const res = await fetch(`/api/news/${news.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '更新失败');
      }

      router.push('/admin/news');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  }

  const tags = news.tags ? JSON.parse(news.tags).join(', ') : '';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin/news">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                返回列表
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Newspaper className="h-8 w-8 text-primary" />
            编辑资讯
          </h1>
          <p className="text-muted-foreground mt-1">编辑资讯文章</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">
                  标题 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="请输入资讯标题"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="slug">
                  URL 标识 <span className="text-destructive">*</span>
                  <span className="text-xs text-muted-foreground ml-2">（根据标题自动生成，可手动修改）</span>
                </Label>
                <Input
                  id="slug"
                  name="slug"
                  placeholder="例如：openai-gpt5-release"
                  required
                  pattern="^[a-z0-9-]+$"
                  title="只能使用小写字母、数字和连字符"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  只能使用小写字母、数字和连字符，将用于生成 URL: /news/{slug}.html
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="summary">摘要</Label>
                <Textarea
                  id="summary"
                  name="summary"
                  placeholder="请输入资讯摘要（可选，用于列表展示）"
                  rows={3}
                  defaultValue={news.summary || ''}
                />
              </div>

              <div className="grid gap-2">
                <Label>
                  正文内容 <span className="text-destructive">*</span>
                </Label>
                <SimpleEditor
                  value={content}
                  onChange={setContent}
                  placeholder="请输入资讯正文内容..."
                />
              </div>
            </CardContent>
          </Card>

          {/* 发布设置 */}
          <Card>
            <CardHeader>
              <CardTitle>发布设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">
                    分类 <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="category"
                    name="category"
                    required
                    className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                    defaultValue={news.category}
                  >
                    <option value="AI资讯">AI资讯</option>
                    <option value="AI动态">AI动态</option>
                    <option value="产品发布">产品发布</option>
                    <option value="技术教程">技术教程</option>
                    <option value="行业分析">行业分析</option>
                    <option value="工具推荐">工具推荐</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="author">作者</Label>
                  <Input
                    id="author"
                    name="author"
                    placeholder="编辑团队"
                    defaultValue={news.author}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tags">标签</Label>
                <Input
                  id="tags"
                  name="tags"
                  placeholder="AI, ChatGPT, 大模型（用逗号分隔）"
                  defaultValue={tags}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="source">来源</Label>
                  <Input
                    id="source"
                    name="source"
                    placeholder="例如：TechCrunch"
                    defaultValue={news.source || ''}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="sourceUrl">原文链接</Label>
                  <Input
                    id="sourceUrl"
                    name="sourceUrl"
                    type="url"
                    placeholder="https://..."
                    defaultValue={news.sourceUrl || ''}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="coverImage">封面图片</Label>
                <ImageUploader
                  value={coverImage}
                  onChange={setCoverImage}
                />
              </div>

              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="isHot"
                    name="isHot"
                    value="true"
                    defaultChecked={news.isHot}
                  />
                  <Label htmlFor="isHot" className="cursor-pointer">
                    <Badge variant="destructive">热门</Badge>
                  </Label>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">发布状态</Label>
                <select
                  id="status"
                  name="status"
                  className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                  defaultValue={news.status}
                >
                  <option value="1">已发布</option>
                  <option value="0">草稿</option>
                  <option value="2">置顶</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link href="/admin/news">
              <Button type="button" variant="outline">
                取消
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存修改'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
