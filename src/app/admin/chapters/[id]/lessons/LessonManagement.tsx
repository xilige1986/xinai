'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Video,
  FileText,
  Save,
  Eye,
  GripVertical,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

// 动态导入富文本编辑器，避免 SSR 问题
const SimpleEditor = dynamic(() => import('@/components/simple-editor'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] border rounded-lg bg-muted/30 flex items-center justify-center">
      <span className="text-muted-foreground">加载编辑器...</span>
    </div>
  ),
});

interface Lesson {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  contentType: string;
  videoUrl: string | null;
  videoPlatform: string | null;
  textContent: string | null;
  markdownContent: string | null;
  isFree: boolean;
  sortOrder: number;
  status: number;
}

interface Chapter {
  id: number;
  title: string;
  courseId: number;
  course: {
    id: number;
    title: string;
  };
}

interface LessonManagementProps {
  chapter: Chapter;
  initialLessons: Lesson[];
}

const videoPlatforms = [
  { value: 'bilibili', label: '哔哩哔哩' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tencent', label: '腾讯云点播' },
  { value: 'custom', label: '自定义链接' },
];

export default function LessonManagement({ chapter, initialLessons }: LessonManagementProps) {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('video');

  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 10,
    contentType: 'video',
    videoUrl: '',
    videoPlatform: 'bilibili',
    textContent: '',
    markdownContent: '',
    isFree: false,
    sortOrder: 0,
  });

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      duration: 10,
      contentType: 'video',
      videoUrl: '',
      videoPlatform: 'bilibili',
      textContent: '',
      markdownContent: '',
      isFree: false,
      sortOrder: lessons.length,
    });
    setActiveTab('video');
  }, [lessons.length]);

  const handleCreateLesson = async () => {
    if (!formData.title.trim()) {
      toast.error('请输入课时标题');
      return;
    }

    if (formData.contentType === 'video' && !formData.videoUrl.trim()) {
      toast.error('请输入视频链接');
      return;
    }

    if (formData.contentType === 'text' && !formData.markdownContent.trim() && !formData.textContent.trim()) {
      toast.error('请输入文字课件内容（Markdown 或富文本）');
      return;
    }

    try {
      const response = await fetch(`/api/chapters/${chapter.id}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          courseId: chapter.courseId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('课时创建成功');
        setLessons([...lessons, data.lesson]);
        resetForm();
        setIsCreateDialogOpen(false);
      } else {
        toast.error(data.error || '创建失败');
      }
    } catch (error) {
      toast.error('网络错误，请稍后重试');
    }
  };

  const handleUpdateLesson = async () => {
    if (!editingLesson || !formData.title.trim()) {
      toast.error('请输入课时标题');
      return;
    }

    if (formData.contentType === 'video' && !formData.videoUrl.trim()) {
      toast.error('请输入视频链接');
      return;
    }

    if (formData.contentType === 'text' && !formData.markdownContent.trim() && !formData.textContent.trim()) {
      toast.error('请输入文字课件内容（Markdown 或富文本）');
      return;
    }

    try {
      const response = await fetch(`/api/lessons/${editingLesson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('课时更新成功');
        setLessons(lessons.map(l =>
          l.id === editingLesson.id ? { ...l, ...data.lesson } : l
        ));
        setIsEditDialogOpen(false);
        setEditingLesson(null);
      } else {
        toast.error(data.error || '更新失败');
      }
    } catch (error) {
      toast.error('网络错误，请稍后重试');
    }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (!confirm('确定要删除这个课时吗？')) {
      return;
    }

    setIsDeleting(lessonId);

    try {
      const response = await fetch(`/api/lessons/${lessonId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('课时已删除');
        setLessons(lessons.filter(l => l.id !== lessonId));
      } else {
        const data = await response.json();
        toast.error(data.error || '删除失败');
      }
    } catch (error) {
      toast.error('网络错误，请稍后重试');
    } finally {
      setIsDeleting(null);
    }
  };

  const openEditDialog = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title || '',
      description: lesson.description || '',
      duration: lesson.duration || 10,
      contentType: lesson.contentType || 'video',
      videoUrl: lesson.videoUrl || '',
      videoPlatform: lesson.videoPlatform || 'bilibili',
      textContent: lesson.textContent || '',
      markdownContent: lesson.markdownContent || '',
      isFree: lesson.isFree || false,
      sortOrder: lesson.sortOrder || 0,
    });
    setActiveTab(lesson.contentType || 'video');
    setIsEditDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  // 课时表单内容
  const formContent = (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div>
        <Label>课时标题 *</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="请输入课时标题"
        />
      </div>

      <div>
        <Label>课时简介</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="请输入课时简介（可选）"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>预计时长（分钟）</Label>
          <Input
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
          />
        </div>
        <div>
          <Label>排序</Label>
          <Input
            type="number"
            value={formData.sortOrder}
            onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
            placeholder="数字越小越靠前"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isFree"
          checked={formData.isFree}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFree: checked as boolean }))}
        />
        <Label htmlFor="isFree" className="cursor-pointer">
          允许免费试看
        </Label>
      </div>

      <div>
        <Label>内容类型</Label>
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v);
          setFormData(prev => ({ ...prev, contentType: v }));
        }} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="video">
              <Video className="h-4 w-4 mr-1" />
              视频课件
            </TabsTrigger>
            <TabsTrigger value="text">
              <FileText className="h-4 w-4 mr-1" />
              文字课件
            </TabsTrigger>
          </TabsList>

          <TabsContent value="video" className="space-y-4 mt-4">
            <div>
              <Label>视频平台</Label>
              <Select
                value={formData.videoPlatform}
                onValueChange={(v) => setFormData(prev => ({ ...prev, videoPlatform: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {videoPlatforms.map((platform) => (
                    <SelectItem key={platform.value} value={platform.value}>
                      {platform.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>视频链接 *</Label>
              <Input
                value={formData.videoUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                placeholder="请输入视频链接"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.videoPlatform === 'bilibili' && '支持 BV 号或完整链接'}
                {formData.videoPlatform === 'youtube' && '支持 YouTube 视频链接'}
                {formData.videoPlatform === 'tencent' && '支持腾讯云点播链接'}
                {formData.videoPlatform === 'custom' && '支持任意视频直链'}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="text" className="mt-4">
            <Tabs defaultValue="markdown" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="markdown">Markdown 编辑器</TabsTrigger>
                <TabsTrigger value="richtext">富文本编辑器</TabsTrigger>
              </TabsList>

              <TabsContent value="markdown" className="space-y-4">
                <div>
                  <Label>Markdown 内容 *</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    支持标准 Markdown 语法，包括标题、列表、代码块、表格等
                  </p>
                  <Textarea
                    value={formData.markdownContent}
                    onChange={(e) => setFormData(prev => ({ ...prev, markdownContent: e.target.value }))}
                    placeholder={`# 课程标题\n\n## 第一节\n\n这是正文内容，支持 **加粗** 和 *斜体*。\n\n### 代码示例\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n### 列表\n- 第一点\n- 第二点\n- 第三点\n\n> 这是引用块`}
                    rows={20}
                    className="font-mono text-sm"
                  />
                </div>
              </TabsContent>

              <TabsContent value="richtext">
                <div>
                  <Label>文字内容（富文本）*</Label>
                  <div className="mt-2">
                    <SimpleEditor
                      value={formData.textContent}
                      onChange={(content) => setFormData(prev => ({ ...prev, textContent: content }))}
                      placeholder="请输入课件内容..."
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/courses/${chapter.courseId}/chapters`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              返回
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">课时管理</h1>
            <p className="text-muted-foreground">
              章节：{chapter.title} · 课程：{chapter.course.title}
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-1" />
          添加课时
        </Button>
      </div>

      {/* 创建对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>添加新课时</DialogTitle>
          </DialogHeader>
          {formContent}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateLesson}>
              <Save className="h-4 w-4 mr-1" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>编辑课时</DialogTitle>
          </DialogHeader>
          {formContent}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdateLesson}>
              <Save className="h-4 w-4 mr-1" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 课时列表 */}
      <div className="space-y-4">
        {lessons.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">暂无课时</p>
              <p className="text-sm text-muted-foreground mt-1">
                点击"添加课时"开始创建课程内容
              </p>
            </CardContent>
          </Card>
        ) : (
          lessons
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((lesson, index) => (
            <Card key={lesson.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{lesson.title}</h3>
                        {lesson.isFree && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                            免费
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          lesson.contentType === 'video'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {lesson.contentType === 'video' ? '视频' : '文字'}
                        </span>
                      </div>
                      {lesson.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {lesson.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{lesson.duration} 分钟</span>
                        {lesson.contentType === 'video' && lesson.videoPlatform && (
                          <span>
                            {videoPlatforms.find(p => p.value === lesson.videoPlatform)?.label || lesson.videoPlatform}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/learn/lesson/${lesson.id}`} target="_blank">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(lesson)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteLesson(lesson.id)}
                      disabled={isDeleting === lesson.id}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
