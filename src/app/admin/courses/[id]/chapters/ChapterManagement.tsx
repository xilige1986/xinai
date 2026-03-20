'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Plus,
  GripVertical,
  Edit,
  Trash2,
  BookOpen,
  ChevronRight,
  Save,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface Chapter {
  id: number;
  title: string;
  description: string | null;
  sortOrder: number;
  status: number;
  lessons: Lesson[];
  _count: {
    lessons: number;
  };
}

interface Lesson {
  id: number;
  title: string;
  duration: number;
  contentType: string;
  isFree: boolean;
  sortOrder: number;
}

interface Course {
  id: number;
  title: string;
  slug: string;
}

interface ChapterManagementProps {
  course: Course;
  initialChapters: Chapter[];
}

export default function ChapterManagement({ course, initialChapters }: ChapterManagementProps) {
  const router = useRouter();
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sortOrder: 0,
  });

  const handleCreateChapter = async () => {
    if (!formData.title.trim()) {
      toast.error('请输入章节标题');
      return;
    }

    try {
      const response = await fetch(`/api/courses/${course.id}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('章节创建成功');
        setChapters([...chapters, { ...data.chapter, lessons: [], _count: { lessons: 0 } }]);
        setFormData({ title: '', description: '', sortOrder: 0 });
        setIsCreateDialogOpen(false);
      } else {
        toast.error(data.error || '创建失败');
      }
    } catch (error) {
      toast.error('网络错误，请稍后重试');
    }
  };

  const handleUpdateChapter = async () => {
    if (!editingChapter || !formData.title.trim()) {
      toast.error('请输入章节标题');
      return;
    }

    try {
      const response = await fetch(`/api/chapters/${editingChapter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('章节更新成功');
        setChapters(chapters.map(ch =>
          ch.id === editingChapter.id ? { ...ch, ...data.chapter } : ch
        ));
        setIsEditDialogOpen(false);
        setEditingChapter(null);
      } else {
        toast.error(data.error || '更新失败');
      }
    } catch (error) {
      toast.error('网络错误，请稍后重试');
    }
  };

  const handleDeleteChapter = async (chapterId: number) => {
    if (!confirm('确定要删除这个章节吗？该章节下的所有课时也将被删除。')) {
      return;
    }

    setIsDeleting(chapterId);

    try {
      const response = await fetch(`/api/chapters/${chapterId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('章节已删除');
        setChapters(chapters.filter(ch => ch.id !== chapterId));
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

  const openEditDialog = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setFormData({
      title: chapter.title,
      description: chapter.description || '',
      sortOrder: chapter.sortOrder,
    });
    setIsEditDialogOpen(true);
  };

  const openCreateDialog = () => {
    setFormData({
      title: '',
      description: '',
      sortOrder: chapters.length,
    });
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/courses">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              返回
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">章节管理</h1>
            <p className="text-muted-foreground">课程：{course.title}</p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-1" />
              添加章节
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加新章节</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">章节标题 *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="请输入章节标题"
                />
              </div>
              <div>
                <label className="text-sm font-medium">章节描述</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入章节描述（可选）"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">排序</label>
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  placeholder="数字越小越靠前"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreateChapter}>
                <Save className="h-4 w-4 mr-1" />
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑章节</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">章节标题 *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="请输入章节标题"
              />
            </div>
            <div>
              <label className="text-sm font-medium">章节描述</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请输入章节描述（可选）"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">排序</label>
              <Input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                placeholder="数字越小越靠前"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdateChapter}>
              <Save className="h-4 w-4 mr-1" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 章节列表 */}
      <div className="space-y-4">
        {chapters.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">暂无章节</p>
              <p className="text-sm text-muted-foreground mt-1">
                点击"添加章节"开始创建课程章节
              </p>
            </CardContent>
          </Card>
        ) : (
          chapters
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((chapter, index) => (
            <Card key={chapter.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{chapter.title}</CardTitle>
                      {chapter.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {chapter.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {chapter._count.lessons} 个课时
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(chapter)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteChapter(chapter.id)}
                      disabled={isDeleting === chapter.id}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Link href={`/admin/chapters/${chapter.id}/lessons`}>
                      <Button size="sm">
                        管理课时
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              {chapter.lessons.length > 0 && (
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    {chapter.lessons.map((lesson, lessonIndex) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground w-6">
                            {lessonIndex + 1}
                          </span>
                          <span className="font-medium">{lesson.title}</span>
                          {lesson.isFree && (
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                              免费
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {lesson.contentType === 'video' ? '视频' : '文字'}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {lesson.duration} 分钟
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
