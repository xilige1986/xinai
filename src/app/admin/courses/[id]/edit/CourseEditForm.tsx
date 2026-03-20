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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2, Save, X, BookOpen, Plus, Trash2, Clock, Users, GraduationCap, Upload, ImageIcon, Search, Eye, DollarSign, Coins } from 'lucide-react';
import { slugify } from '@/lib/slugify';

interface CourseEditFormProps {
  course: {
    id: number;
    title: string;
    slug: string;
    description: string;
    coverImage: string | null;
    price: number;
    originalPrice: number;
    buyUrl: string;
    level: string;
    status: number;
    studentCount: number;
    duration: string;
    lessonCount: number;
    targetAudience: string | null;
    whatYouWillLearn: string | null;
    includes: string | null;
    instructorName: string | null;
    instructorAvatar: string | null;
    instructorBio: string | null;
    tools: { id: number; name: string }[];
    // 购买方式设置
    allowMoneyPurchase: boolean;
    allowPointsPurchase: boolean;
    pointsRequired: number;
    // 宣传视频
    promoVideoUrl: string | null;
    promoVideoPlatform: string | null;
  };
  tools: { id: number; name: string }[];
}

export function CourseEditForm({ course, tools }: CourseEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTools, setSelectedTools] = useState<number[]>(
    course.tools.map((t) => t.id)
  );
  const [toolSearchQuery, setToolSearchQuery] = useState('');

  // 解析 JSON 数据
  const [whatYouWillLearn, setWhatYouWillLearn] = useState<string[]>(
    course.whatYouWillLearn ? JSON.parse(course.whatYouWillLearn) : ['']
  );
  const [includes, setIncludes] = useState<string[]>(
    course.includes ? JSON.parse(course.includes) : [
      '视频课程', '配套练习资料', '课程源码下载', '专属学习社群', '结业证书'
    ]
  );

  const [formData, setFormData] = useState({
    title: course.title,
    slug: course.slug,
    description: course.description,
    coverImage: course.coverImage || '',
    price: course.price,
    originalPrice: course.originalPrice || 0,
    buyUrl: course.buyUrl || '',
    level: course.level,
    status: course.status,
    duration: course.duration || '6.5',
    lessonCount: course.lessonCount || 12,
    targetAudience: course.targetAudience || '',
    instructorName: course.instructorName || 'AI工具库专家团队',
    instructorAvatar: course.instructorAvatar || '',
    instructorBio: course.instructorBio || '拥有多年AI工具使用和教学经验，致力于帮助更多人掌握AI技能，提升工作效率。',
    // 购买方式设置
    allowMoneyPurchase: course.allowMoneyPurchase ?? true,
    allowPointsPurchase: course.allowPointsPurchase ?? false,
    pointsRequired: course.pointsRequired || 0,
    // 宣传视频
    promoVideoUrl: course.promoVideoUrl || '',
    promoVideoPlatform: course.promoVideoPlatform || 'youtube',
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

  // 过滤工具列表
  const filteredTools = tools.filter((tool) =>
    tool.name.toLowerCase().includes(toolSearchQuery.toLowerCase())
  );

  // 处理封面图上传
  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
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
      handleChange('coverImage', data.url);
    } catch (err: any) {
      setError(err.message || '封面上传失败，请重试');
    } finally {
      setIsUploadingCover(false);
    }
  };

  // 处理讲师头像上传
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
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
      handleChange('instructorAvatar', data.url);
    } catch (err: any) {
      setError(err.message || '头像上传失败，请重试');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // 移除封面图
  const handleRemoveCoverImage = () => {
    handleChange('coverImage', '');
  };

  // 移除讲师头像
  const handleRemoveAvatar = () => {
    handleChange('instructorAvatar', '');
  };

  // 你将学到的内容操作
  const addLearningItem = () => {
    setWhatYouWillLearn([...whatYouWillLearn, '']);
  };

  const updateLearningItem = (index: number, value: string) => {
    const newItems = [...whatYouWillLearn];
    newItems[index] = value;
    setWhatYouWillLearn(newItems);
  };

  const removeLearningItem = (index: number) => {
    setWhatYouWillLearn(whatYouWillLearn.filter((_, i) => i !== index));
  };

  // 课程包含操作
  const addIncludeItem = () => {
    setIncludes([...includes, '']);
  };

  const updateIncludeItem = (index: number, value: string) => {
    const newItems = [...includes];
    newItems[index] = value;
    setIncludes(newItems);
  };

  const removeIncludeItem = (index: number) => {
    setIncludes(includes.filter((_, i) => i !== index));
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
          originalPrice: parseFloat(formData.originalPrice.toString()) || 0,
          lessonCount: parseInt(formData.lessonCount.toString()) || 0,
          pointsRequired: parseInt(formData.pointsRequired.toString()) || 0,
          toolIds: selectedTools,
          whatYouWillLearn: JSON.stringify(whatYouWillLearn.filter(item => item.trim())),
          includes: JSON.stringify(includes.filter(item => item.trim())),
          // 宣传视频
          promoVideoUrl: formData.promoVideoUrl || null,
          promoVideoPlatform: formData.promoVideoUrl ? formData.promoVideoPlatform : null,
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
          {/* 基本信息 */}
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
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      const newSlug = slugify(newTitle);
                      setFormData((prev) => ({ ...prev, title: newTitle, slug: newSlug }));
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">
                    URL 标识 *
                    <span className="text-xs text-muted-foreground ml-2">（根据标题自动生成，可手动修改）</span>
                  </Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
                    required
                    pattern="^[a-z0-9-]+$"
                    title="只能使用小写字母、数字和连字符"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">课程简介 *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  required
                />
              </div>

              {/* 封面上传 */}
              <div className="space-y-2">
                <Label>封面图片</Label>
                <div className="flex items-start gap-4">
                  {formData.coverImage ? (
                    <div className="relative">
                      <div className="w-32 h-20 rounded-lg border overflow-hidden bg-white">
                        <img
                          src={formData.coverImage}
                          alt="封面预览"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoverImage}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted transition-colors w-fit">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">
                        {isUploadingCover ? '上传中...' : '上传封面'}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleCoverImageUpload}
                        disabled={isUploadingCover}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      建议尺寸 16:9，支持 JPG、PNG、WebP，最大 5MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyUrl">
                  购买链接
                  <span className="text-xs text-muted-foreground ml-2">（选填，用于外部购买跳转）</span>
                </Label>
                <Input
                  id="buyUrl"
                  type="url"
                  value={formData.buyUrl}
                  onChange={(e) => handleChange('buyUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>

              {/* 宣传视频 */}
              <div className="space-y-2">
                <Label htmlFor="promoVideoUrl">
                  宣传视频链接
                  <span className="text-xs text-muted-foreground ml-2">（选填，课程介绍视频）</span>
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-3">
                    <Input
                      id="promoVideoUrl"
                      type="text"
                      value={formData.promoVideoUrl}
                      onChange={(e) => handleChange('promoVideoUrl', e.target.value)}
                      placeholder="https://... 或粘贴 iframe 代码"
                    />
                  </div>
                  <Select
                    value={formData.promoVideoPlatform}
                    onValueChange={(value) => handleChange('promoVideoPlatform', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="平台" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">本地视频</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="bilibili">Bilibili</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  支持 YouTube、Bilibili 或本地视频链接。设置后课程页可预览视频。
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 课程设置 */}
          <Card>
            <CardHeader>
              <CardTitle>课程设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="duration">
                    <Clock className="h-4 w-4 inline mr-1" />
                    课程时长 (小时)
                  </Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => handleChange('duration', e.target.value)}
                    placeholder="例如: 6.5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lessonCount">
                  <BookOpen className="h-4 w-4 inline mr-1" />
                  课时数量
                </Label>
                <Input
                  id="lessonCount"
                  type="number"
                  value={formData.lessonCount}
                  onChange={(e) => handleChange('lessonCount', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 购买方式设置 */}
          <Card>
            <CardHeader>
              <CardTitle>购买方式设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 资金购买 */}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <Label className="text-base font-medium">允许资金购买</Label>
                    <p className="text-sm text-muted-foreground">
                      用户可以使用人民币购买此课程
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.allowMoneyPurchase}
                  onCheckedChange={(checked) =>
                    handleChange('allowMoneyPurchase', checked)
                  }
                />
              </div>

              {formData.allowMoneyPurchase && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">
                      <DollarSign className="h-4 w-4 inline mr-1" />
                      售价 (元)
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => handleChange('price', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="originalPrice">原价 (元)</Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.originalPrice}
                      onChange={(e) => handleChange('originalPrice', e.target.value)}
                      placeholder="用于显示折扣"
                    />
                  </div>
                </div>
              )}

              <Separator />

              {/* 积分购买 */}
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3">
                  <Coins className="h-5 w-5 text-purple-600" />
                  <div>
                    <Label className="text-base font-medium">允许积分兑换</Label>
                    <p className="text-sm text-muted-foreground">
                      用户可以使用积分兑换此课程
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.allowPointsPurchase}
                  onCheckedChange={(checked) =>
                    handleChange('allowPointsPurchase', checked)
                  }
                />
              </div>

              {formData.allowPointsPurchase && (
                <div className="space-y-2">
                  <Label htmlFor="pointsRequired">所需积分</Label>
                  <Input
                    id="pointsRequired"
                    type="number"
                    min="0"
                    value={formData.pointsRequired}
                    onChange={(e) => handleChange('pointsRequired', e.target.value)}
                    placeholder="例如: 100"
                  />
                </div>
              )}

              {!formData.allowMoneyPurchase && !formData.allowPointsPurchase && (
                <Alert variant="destructive" className="bg-amber-50 border-amber-200">
                  <AlertDescription className="text-amber-700">
                    请至少选择一种购买方式，否则用户无法获取课程
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* 讲师信息 */}
          <Card>
            <CardHeader>
              <CardTitle>讲师信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instructorName">讲师姓名</Label>
                  <Input
                    id="instructorName"
                    value={formData.instructorName}
                    onChange={(e) => handleChange('instructorName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>讲师头像</Label>
                  <div className="flex items-center gap-3">
                    {formData.instructorAvatar ? (
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full border overflow-hidden bg-white">
                          <img
                            src={formData.instructorAvatar}
                            alt="头像预览"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <label className="flex items-center gap-2 px-3 py-1.5 border rounded-md cursor-pointer hover:bg-muted transition-colors w-fit">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">
                        {isUploadingAvatar ? '上传中...' : '上传头像'}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleAvatarUpload}
                        disabled={isUploadingAvatar}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructorBio">讲师简介</Label>
                <Textarea
                  id="instructorBio"
                  value={formData.instructorBio}
                  onChange={(e) => handleChange('instructorBio', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* 适合人群 */}
          <Card>
            <CardHeader>
              <CardTitle>适合人群</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Textarea
                  id="targetAudience"
                  value={formData.targetAudience}
                  onChange={(e) => handleChange('targetAudience', e.target.value)}
                  rows={4}
                  placeholder="描述适合学习本课程的人群..."
                />
              </div>
            </CardContent>
          </Card>

          {/* 你将学到的内容 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>你将学到的内容</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addLearningItem}>
                <Plus className="h-4 w-4 mr-1" />
                添加
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {whatYouWillLearn.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => updateLearningItem(index, e.target.value)}
                      placeholder={`学习内容 ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLearningItem(index)}
                      className="text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 课程包含 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>课程包含</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addIncludeItem}>
                <Plus className="h-4 w-4 mr-1" />
                添加
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {includes.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => updateIncludeItem(index, e.target.value)}
                      placeholder={`包含项 ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeIncludeItem(index)}
                      className="text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 关联工具 */}
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

              {/* 搜索框 */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索工具..."
                  value={toolSearchQuery}
                  onChange={(e) => setToolSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                {filteredTools.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    未找到匹配的工具
                  </div>
                ) : (
                  filteredTools.map((tool) => (
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
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                共 {tools.length} 个工具，已选择 {selectedTools.length} 个
                {toolSearchQuery && `，筛选后 ${filteredTools.length} 个`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 右侧设置 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>发布设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

          {/* 预览信息 */}
          <Card>
            <CardHeader>
              <CardTitle>预览</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>时长: {formData.duration} 小时</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span>课时: {formData.lessonCount} 节</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <GraduationCap className="h-4 w-4" />
                <span>等级: {formData.level}</span>
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
          <Link href={`/courses/${formData.slug}`} target="_blank">
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
