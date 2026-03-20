'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Newspaper, Wrench, MessageSquare, Loader2, CheckCircle, ArrowRight, Upload, X, ImageIcon } from 'lucide-react';
import SimpleEditor from '@/components/simple-editor';
import { generateToolSlug, generateNewsSlug } from '@/lib/slugify';

interface ContributionFormProps {
  isFounder: boolean;
}

// 贡献积分配置（仅创始股东显示）
const CONTRIBUTION_POINTS = {
  NEWS: 5,
  TOOL: 3,
  REVIEW: 1,
};

// 资讯分类选项
const NEWS_CATEGORIES = [
  'AI资讯',
  'AI工具',
  '行业动态',
  '技术教程',
  '产品发布',
  '创业故事',
  '其他',
];

interface Category {
  id: number;
  name: string;
  slug: string;
  subCategories?: { id: number; name: string; slug: string }[];
}

interface UseCase {
  id: number;
  name: string;
  slug: string;
}

export default function ContributionForm({ isFounder }: ContributionFormProps) {
  const [activeTab, setActiveTab] = useState('news');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 资讯表单状态
  const [newsForm, setNewsForm] = useState({
    title: '',
    slug: '',
    summary: '',
    content: '',
    category: 'AI资讯',
    source: '',
    sourceUrl: '',
    coverImage: '',
  });
  const [uploadingCover, setUploadingCover] = useState(false);

  // 工具表单状态
  const [toolForm, setToolForm] = useState({
    name: '',
    slug: '',
    shortDesc: '',
    description: '',
    websiteUrl: '',
    pricingType: 'Free',
    categoryId: '',
    subCategoryId: '',
    useCaseId: '',
    imageUrl: '',
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // 分类和使用场景数据
  const [categories, setCategories] = useState<Category[]>([]);
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // 获取分类和使用场景
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [catRes, useCaseRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/usecases'),
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories || []);
        }
        if (useCaseRes.ok) {
          const useCaseData = await useCaseRes.json();
          setUseCases(useCaseData.useCases || []);
        }
      } catch (error) {
        console.error('Failed to fetch options:', error);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, []);

  // 获取当前分类下的子分类
  const currentCategory = categories.find(c => c.id.toString() === toolForm.categoryId);
  const subCategories = currentCategory?.subCategories || [];

  // 生成 slug（前端预览用）- 使用新的拼音 slugify
  const generateSlug = useCallback((title: string) => {
    return generateNewsSlug(title);
  }, []);

  // 生成工具 slug
  const generateToolSlugFn = useCallback((name: string) => {
    return generateToolSlug(name);
  }, []);

  // 上传封面图
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'news');

      const response = await fetch('/api/user/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setNewsForm({ ...newsForm, coverImage: data.url });
      } else {
        setMessage({ type: 'error', text: data.error || '上传失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '上传失败，请重试' });
    } finally {
      setUploadingCover(false);
    }
  };

  // 上传Logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'tools');

      const response = await fetch('/api/user/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setToolForm({ ...toolForm, imageUrl: data.url });
      } else {
        setMessage({ type: 'error', text: data.error || '上传失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '上传失败，请重试' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmitNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/user/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'NEWS',
          ...newsForm,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const pointsText = isFounder ? `获得 +${CONTRIBUTION_POINTS.NEWS} 积分，` : '';
        setMessage({ type: 'success', text: `资讯提交成功！${pointsText}等待管理员审核` });
        setNewsForm({ title: '', summary: '', content: '', category: 'AI资讯', source: '', sourceUrl: '', coverImage: '' });
      } else {
        setMessage({ type: 'error', text: data.error || '提交失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitTool = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/user/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TOOL',
          ...toolForm,
          categoryId: toolForm.categoryId ? parseInt(toolForm.categoryId) : 1,
          subCategoryId: toolForm.subCategoryId ? parseInt(toolForm.subCategoryId) : null,
          useCaseId: toolForm.useCaseId ? parseInt(toolForm.useCaseId) : 1,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const pointsText = isFounder ? `获得 +${CONTRIBUTION_POINTS.TOOL} 积分，` : '';
        setMessage({ type: 'success', text: `工具提交成功！${pointsText}等待管理员审核` });
        setToolForm({
          name: '',
          shortDesc: '',
          description: '',
          websiteUrl: '',
          pricingType: 'Free',
          categoryId: '',
          subCategoryId: '',
          useCaseId: '',
          imageUrl: '',
        });
      } else {
        setMessage({ type: 'error', text: data.error || '提交失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          提交贡献
          {isFounder && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded ml-2">
              创始股东特权
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="news" className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              发布资讯
              {isFounder && (
                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">+{CONTRIBUTION_POINTS.NEWS}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="tool" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              提交工具
              {isFounder && (
                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">+{CONTRIBUTION_POINTS.TOOL}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              提交点评
              {isFounder && (
                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">+{CONTRIBUTION_POINTS.REVIEW}</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* 发布资讯 */}
          <TabsContent value="news">
            <form onSubmit={handleSubmitNews} className="space-y-4 mt-4">
              {/* 标题 */}
              <div>
                <Label htmlFor="news-title">资讯标题 *</Label>
                <Input
                  id="news-title"
                  value={newsForm.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    const newSlug = generateSlug(newTitle);
                    setNewsForm({ ...newsForm, title: newTitle, slug: newSlug });
                  }}
                  placeholder="请输入资讯标题"
                  required
                />
              </div>

              {/* URL标识 */}
              <div>
                <Label htmlFor="news-slug">
                  URL 标识 *
                  <span className="text-xs text-muted-foreground ml-2">（根据标题自动生成）</span>
                </Label>
                <Input
                  id="news-slug"
                  value={newsForm.slug}
                  onChange={(e) => setNewsForm({ ...newsForm, slug: e.target.value })}
                  placeholder="例如：openai-gpt5-release"
                  required
                  pattern="^[a-z0-9-]+$"
                  title="只能使用小写字母、数字和连字符"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  将用于生成 URL: /news/{newsForm.slug || 'example'}.html
                </p>
              </div>

              {/* 摘要 */}
              <div>
                <Label htmlFor="news-summary">摘要</Label>
                <Textarea
                  id="news-summary"
                  value={newsForm.summary}
                  onChange={(e) => setNewsForm({ ...newsForm, summary: e.target.value })}
                  placeholder="请输入资讯摘要（可选，用于列表展示）"
                  rows={2}
                />
              </div>

              {/* 分类选择 */}
              <div>
                <Label htmlFor="news-category">分类 *</Label>
                <select
                  id="news-category"
                  value={newsForm.category}
                  onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  required
                >
                  {NEWS_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* 封面图上传 */}
              <div>
                <Label>封面图</Label>
                <div className="mt-2">
                  {newsForm.coverImage ? (
                    <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                      <img
                        src={newsForm.coverImage}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setNewsForm({ ...newsForm, coverImage: '' })}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-input rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                      <input
                        type="file"
                        id="cover-upload"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="cover-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        {uploadingCover ? (
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          {uploadingCover ? '上传中...' : '点击上传封面图'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          支持 JPG、PNG、WebP，最大 5MB
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* 正文内容（富文本编辑器） */}
              <div>
                <Label htmlFor="news-content">正文内容 *</Label>
                <div className="mt-2">
                  <SimpleEditor
                    value={newsForm.content}
                    onChange={(value) => setNewsForm({ ...newsForm, content: value })}
                    placeholder="请输入资讯正文内容..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="news-source">来源</Label>
                  <Input
                    id="news-source"
                    value={newsForm.source}
                    onChange={(e) => setNewsForm({ ...newsForm, source: e.target.value })}
                    placeholder="来源网站或作者"
                  />
                </div>
                <div>
                  <Label htmlFor="news-sourceUrl">原文链接</Label>
                  <Input
                    id="news-sourceUrl"
                    type="url"
                    value={newsForm.sourceUrl}
                    onChange={(e) => setNewsForm({ ...newsForm, sourceUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting || !newsForm.content} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    提交资讯
                    {isFounder && <> (+{CONTRIBUTION_POINTS.NEWS} 积分)</>}
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          {/* 提交工具 */}
          <TabsContent value="tool">
            <form onSubmit={handleSubmitTool} className="space-y-4 mt-4">
              {/* Logo上传 */}
              <div>
                <Label>工具 Logo</Label>
                <div className="mt-2">
                  {toolForm.imageUrl ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                      <img
                        src={toolForm.imageUrl}
                        alt="Logo"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setToolForm({ ...toolForm, imageUrl: '' })}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-input rounded-lg p-4 text-center hover:bg-muted/50 transition-colors w-24 h-24 flex flex-col items-center justify-center">
                      <input
                        type="file"
                        id="logo-upload"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="cursor-pointer flex flex-col items-center gap-1"
                      >
                        {uploadingLogo ? (
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {uploadingLogo ? '上传中' : 'Logo'}
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="tool-name">工具名称 *</Label>
                <Input
                  id="tool-name"
                  value={toolForm.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    const newSlug = generateToolSlugFn(newName);
                    setToolForm({ ...toolForm, name: newName, slug: newSlug });
                  }}
                  placeholder="例如：ChatGPT"
                  required
                />
              </div>

              <div>
                <Label htmlFor="tool-slug">
                  URL 标识 *
                  <span className="text-xs text-muted-foreground ml-2">（根据名称自动生成）</span>
                </Label>
                <Input
                  id="tool-slug"
                  value={toolForm.slug}
                  onChange={(e) => setToolForm({ ...toolForm, slug: e.target.value })}
                  placeholder="例如：chatgpt"
                  required
                  pattern="^[a-z0-9-]+$"
                  title="只能使用小写字母、数字和连字符"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  将用于生成 URL: /tool/{toolForm.slug || 'example'}
                </p>
              </div>

              <div>
                <Label htmlFor="tool-shortDesc">简短描述 *</Label>
                <Input
                  id="tool-shortDesc"
                  value={toolForm.shortDesc}
                  onChange={(e) => setToolForm({ ...toolForm, shortDesc: e.target.value })}
                  placeholder="一句话描述这个工具的功能"
                  required
                />
              </div>

              {/* 分类选择 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tool-category">分类 *</Label>
                  <select
                    id="tool-category"
                    value={toolForm.categoryId}
                    onChange={(e) => {
                      setToolForm({
                        ...toolForm,
                        categoryId: e.target.value,
                        subCategoryId: '', // 重置子分类
                      });
                    }}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    required
                    disabled={loadingOptions}
                  >
                    <option value="">选择分类</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="tool-useCase">使用场景 *</Label>
                  <select
                    id="tool-useCase"
                    value={toolForm.useCaseId}
                    onChange={(e) => setToolForm({ ...toolForm, useCaseId: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    required
                    disabled={loadingOptions}
                  >
                    <option value="">选择使用场景</option>
                    {useCases.map((uc) => (
                      <option key={uc.id} value={uc.id}>{uc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 子分类（可选） */}
              {subCategories.length > 0 && (
                <div>
                  <Label htmlFor="tool-subCategory">子分类</Label>
                  <select
                    id="tool-subCategory"
                    value={toolForm.subCategoryId}
                    onChange={(e) => setToolForm({ ...toolForm, subCategoryId: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="">选择子分类（可选）</option>
                    {subCategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 详细描述（富文本编辑器） */}
              <div>
                <Label htmlFor="tool-description">详细描述 *</Label>
                <div className="mt-2">
                  <SimpleEditor
                    value={toolForm.description}
                    onChange={(value) => setToolForm({ ...toolForm, description: value })}
                    placeholder="详细描述工具的功能、特点、使用场景等..."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tool-websiteUrl">官网链接 *</Label>
                <Input
                  id="tool-websiteUrl"
                  type="url"
                  value={toolForm.websiteUrl}
                  onChange={(e) => setToolForm({ ...toolForm, websiteUrl: e.target.value })}
                  placeholder="https://..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="tool-pricingType">定价类型</Label>
                <select
                  id="tool-pricingType"
                  value={toolForm.pricingType}
                  onChange={(e) => setToolForm({ ...toolForm, pricingType: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="Free">免费</option>
                  <option value="Freemium">免费增值</option>
                  <option value="Paid">付费</option>
                </select>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !toolForm.description || !toolForm.categoryId || !toolForm.useCaseId}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    提交工具
                    {isFounder && <> (+{CONTRIBUTION_POINTS.TOOL} 积分)</>}
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          {/* 提交点评 - 跳转到工具列表 */}
          <TabsContent value="review">
            <div className="space-y-6 mt-4">
              <div className="bg-muted/50 rounded-lg p-6 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">去工具页面提交点评</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  请到具体的工具详情页面提交您的使用体验和评价
                  {isFounder && '，审核通过后可获得积分奖励'}
                </p>
                <Link href="/tools">
                  <Button className="w-full sm:w-auto">
                    浏览工具列表
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {isFounder && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-purple-700 mb-2">💡 创始股东提示</h4>
                  <ul className="text-sm text-purple-600 space-y-1">
                    <li>• 在工具详情页提交点评，审核通过后可获得 +{CONTRIBUTION_POINTS.REVIEW} 积分</li>
                    <li>• 每个工具的点评仅限一次</li>
                    <li>• 优质点评更容易通过审核</li>
                  </ul>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
