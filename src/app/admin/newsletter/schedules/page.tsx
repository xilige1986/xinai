'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Clock, Play, Trash2, Plus, History, Mail } from 'lucide-react';
import Link from 'next/link';

interface Schedule {
  id: number;
  name: string;
  enabled: boolean;
  frequency: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  time: string;
  subject: string;
  content: string | null;
  autoSelectNews: boolean;
  maxNewsCount: number;
  lastSentAt: string | null;
  createdAt: string;
  _count: {
    history: number;
  };
}

interface HistoryItem {
  id: number;
  scheduleId: number;
  subject: string;
  sentCount: number;
  failedCount: number;
  totalSubscribers: number;
  status: string;
  createdAt: string;
  schedule?: {
    name: string;
  };
}

export default function NewsletterSchedulesPage() {
  const [activeTab, setActiveTab] = useState('schedules');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    enabled: false,
    frequency: 'weekly',
    dayOfWeek: 1,
    dayOfMonth: 1,
    time: '09:00',
    subject: 'AI资讯精选',
    content: '',
    autoSelectNews: true,
    maxNewsCount: 5,
  });

  const fetchSchedules = async () => {
    try {
      const res = await fetch('/api/admin/newsletter/schedules');
      if (res.ok) {
        const data = await res.json();
        setSchedules(data.schedules);
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/admin/newsletter/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchSchedules(), fetchHistory()]);
      setLoading(false);
    };
    load();
  }, []);

  const handleSubmit = async () => {
    // 客户端验证必填字段
    if (!formData.name.trim()) {
      alert('请填写任务名称');
      return;
    }
    if (!formData.frequency) {
      alert('请选择推送频率');
      return;
    }
    if (!formData.time) {
      alert('请选择时间');
      return;
    }
    if (!formData.subject.trim()) {
      alert('请填写邮件主题');
      return;
    }

    try {
      const url = editingSchedule
        ? `/api/admin/newsletter/schedules/${editingSchedule.id}`
        : '/api/admin/newsletter/schedules';
      const method = editingSchedule ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setDialogOpen(false);
        setEditingSchedule(null);
        fetchSchedules();
      } else {
        const data = await res.json();
        alert(data.error || '保存失败');
      }
    } catch (error) {
      alert('网络错误');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个定时任务吗？')) return;

    try {
      const res = await fetch(`/api/admin/newsletter/schedules/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchSchedules();
      }
    } catch (error) {
      alert('删除失败');
    }
  };

  const handleRunNow = async (id: number) => {
    if (!confirm('确定要立即执行这个定时任务吗？')) return;

    try {
      const res = await fetch(`/api/admin/newsletter/schedules/${id}`, {
        method: 'POST',
      });

      if (res.ok) {
        alert('已开始执行');
        fetchHistory();
      } else {
        alert('执行失败');
      }
    } catch (error) {
      alert('网络错误');
    }
  };

  const openEditDialog = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name,
      enabled: schedule.enabled,
      frequency: schedule.frequency,
      dayOfWeek: schedule.dayOfWeek ?? 1,
      dayOfMonth: schedule.dayOfMonth ?? 1,
      time: schedule.time,
      subject: schedule.subject,
      content: schedule.content || '',
      autoSelectNews: schedule.autoSelectNews,
      maxNewsCount: schedule.maxNewsCount,
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingSchedule(null);
    setFormData({
      name: '',
      enabled: false,
      frequency: 'weekly',
      dayOfWeek: 1,
      dayOfMonth: 1,
      time: '09:00',
      subject: 'AI资讯精选',
      content: '',
      autoSelectNews: true,
      maxNewsCount: 5,
    });
    setDialogOpen(true);
  };

  const getFrequencyText = (schedule: Schedule) => {
    switch (schedule.frequency) {
      case 'daily':
        return `每天 ${schedule.time}`;
      case 'weekly':
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return `每周${days[schedule.dayOfWeek ?? 1]} ${schedule.time}`;
      case 'monthly':
        return `每月${schedule.dayOfMonth ?? 1}日 ${schedule.time}`;
      default:
        return schedule.time;
    }
  };

  const getStatusBadge = (schedule: Schedule) => {
    if (schedule.enabled) {
      return <Badge className="bg-green-500">运行中</Badge>;
    }
    return <Badge variant="secondary">已停用</Badge>;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Clock className="h-8 w-8 text-primary" />
            定时自动推送
          </h1>
          <p className="text-muted-foreground mt-1">配置自动发送资讯邮件的时间规则</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/newsletter/send">
            <Button variant="outline">
              <Mail className="mr-2 h-4 w-4" />
              手动发送
            </Button>
          </Link>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            新建定时任务
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="schedules">
            <Clock className="mr-2 h-4 w-4" />
            定时任务
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            发送历史
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedules">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : schedules.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="text-muted-foreground mb-4">暂无定时任务</p>
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  创建第一个定时任务
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <Card key={schedule.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{schedule.name}</h3>
                          {getStatusBadge(schedule)}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>
                            <span className="font-medium">执行时间：</span>
                            {getFrequencyText(schedule)}
                          </p>
                          <p>
                            <span className="font-medium">邮件主题：</span>
                            {schedule.subject}
                          </p>
                          <p>
                            <span className="font-medium">自动选择资讯：</span>
                            {schedule.autoSelectNews ? `是（最多${schedule.maxNewsCount}篇）` : '否'}
                          </p>
                          {schedule.lastSentAt && (
                            <p>
                              <span className="font-medium">上次发送：</span>
                              {new Date(schedule.lastSentAt).toLocaleString('zh-CN')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRunNow(schedule.id)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          立即执行
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(schedule)}
                        >
                          编辑
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handleDelete(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>暂无发送记录</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {history.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{item.subject}</span>
                          {item.status === 'completed' ? (
                            <Badge className="bg-green-500">完成</Badge>
                          ) : item.status === 'sending' ? (
                            <Badge variant="secondary">发送中</Badge>
                          ) : (
                            <Badge variant="destructive">失败</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(item.createdAt).toLocaleString('zh-CN')}
                          {item.schedule && ` · ${item.schedule.name}`}
                        </p>
                      </div>
                      <div className="text-sm text-right">
                        <p className="text-green-600">成功: {item.sentCount}</p>
                        <p className="text-red-600">失败: {item.failedCount}</p>
                        <p className="text-muted-foreground">总计: {item.totalSubscribers}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* 创建/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSchedule ? '编辑定时任务' : '新建定时任务'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                任务名称 <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="例如：每周资讯推送"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  推送频率 <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.frequency}
                  onValueChange={(v) => setFormData({ ...formData, frequency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">每天</SelectItem>
                    <SelectItem value="weekly">每周</SelectItem>
                    <SelectItem value="monthly">每月</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  时间 <span className="text-red-500">*</span>
                </label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>

            {formData.frequency === 'weekly' && (
              <div>
                <label className="text-sm font-medium mb-2 block">星期几</label>
                <Select
                  value={String(formData.dayOfWeek)}
                  onValueChange={(v) => setFormData({ ...formData, dayOfWeek: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">周日</SelectItem>
                    <SelectItem value="1">周一</SelectItem>
                    <SelectItem value="2">周二</SelectItem>
                    <SelectItem value="3">周三</SelectItem>
                    <SelectItem value="4">周四</SelectItem>
                    <SelectItem value="5">周五</SelectItem>
                    <SelectItem value="6">周六</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.frequency === 'monthly' && (
              <div>
                <label className="text-sm font-medium mb-2 block">每月几号</label>
                <Select
                  value={String(formData.dayOfMonth)}
                  onValueChange={(v) => setFormData({ ...formData, dayOfMonth: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={String(day)}>
                        {day}日
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">
                邮件主题 <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="AI资讯精选"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">邮件开头内容（可选）</label>
              <Textarea
                placeholder="输入邮件正文开头的内容..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">自动选择最新资讯</label>
                <p className="text-xs text-muted-foreground">自动获取最新的资讯</p>
              </div>
              <Switch
                checked={formData.autoSelectNews}
                onCheckedChange={(v) => setFormData({ ...formData, autoSelectNews: v })}
              />
            </div>

            {formData.autoSelectNews && (
              <div>
                <label className="text-sm font-medium mb-2 block">最多选择几篇</label>
                <Select
                  value={String(formData.maxNewsCount)}
                  onValueChange={(v) => setFormData({ ...formData, maxNewsCount: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 5, 7, 10].map((num) => (
                      <SelectItem key={num} value={String(num)}>
                        {num}篇
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <label className="text-sm font-medium">启用任务</label>
                <p className="text-xs text-muted-foreground">启用后将按照设置自动发送</p>
              </div>
              <Switch
                checked={formData.enabled}
                onCheckedChange={(v) => setFormData({ ...formData, enabled: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingSchedule ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
