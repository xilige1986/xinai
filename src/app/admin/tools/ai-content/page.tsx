'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Sparkles,
  Play,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Bot,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ToolAIStatus {
  id: number;
  name: string;
  slug: string;
  hasAIContent: boolean;
  generatedAt: string | null;
  generatedBy: string | null;
}

interface AIStats {
  total: number;
  withAI: number;
  withoutAI: number;
  completionRate: number;
}

export default function AdminAIContentPage() {
  const [stats, setStats] = useState<AIStats | null>(null);
  const [pendingTools, setPendingTools] = useState<ToolAIStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // 加载统计信息
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/cron/generate-ai-content');
      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
        setPendingTools(data.pendingTools || []);
      }
    } catch (error) {
      toast.error('获取统计信息失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // 手动触发批量生成
  const handleBatchGenerate = async () => {
    if (generating) return;

    const count = prompt('请输入要生成的数量（1-10）：', '5');
    if (!count) return;

    const limit = parseInt(count);
    if (isNaN(limit) || limit < 1 || limit > 10) {
      toast.error('请输入 1-10 之间的数字');
      return;
    }

    setGenerating(true);
    setProgress(0);

    try {
      const res = await fetch(`/api/cron/generate-ai-content?limit=${limit}`, {
        method: 'POST',
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        fetchStats();
      } else {
        throw new Error(data.error || '生成失败');
      }
    } catch (error: any) {
      toast.error(error.message || '生成失败');
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  // 为单个工具生成 AI 内容
  const handleGenerateSingle = async (toolId: number, toolName: string) => {
    try {
      toast.info(`正在为 "${toolName}" 生成 AI 内容...`);

      const res = await fetch(`/api/admin/tools/${toolId}/generate-ai-content`, {
        method: 'POST',
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`"${toolName}" AI 内容生成成功`);
        fetchStats();
      } else {
        throw new Error(data.error || '生成失败');
      }
    } catch (error: any) {
      toast.error(error.message || '生成失败');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/tools">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              AI 内容管理
            </h1>
            <p className="text-sm text-muted-foreground">
              管理工具 AI 介绍内容的生成状态
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchStats}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button
            onClick={handleBatchGenerate}
            disabled={generating || (stats?.withoutAI === 0)}
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                批量生成
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>工具总数</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>已有 AI 内容</CardDescription>
              <CardTitle className="text-3xl text-green-600">{stats.withAI}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>待生成</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">{stats.withoutAI}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>完成率</CardDescription>
              <CardTitle className="text-3xl">{stats.completionRate}%</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={stats.completionRate} className="h-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress Bar for Batch Generation */}
      {generating && progress > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>生成进度</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Tools Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            待生成 AI 内容的工具
          </CardTitle>
          <CardDescription>
            以下工具还没有 AI 介绍内容，点击右侧按钮生成
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingTools.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>工具名称</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTools.map((tool) => (
                  <TableRow key={tool.id}>
                    <TableCell className="font-medium">{tool.id}</TableCell>
                    <TableCell>
                      <Link
                        href={`/tool/${tool.slug}`}
                        target="_blank"
                        className="hover:text-primary hover:underline"
                      >
                        {tool.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-yellow-600">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        待生成
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/tools/${tool.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            编辑
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          onClick={() => handleGenerateSingle(tool.id, tool.name)}
                        >
                          <Sparkles className="h-4 w-4 mr-1" />
                          生成 AI
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium">所有工具都已生成 AI 内容</p>
              <p className="text-muted-foreground">太棒了！所有工具都有 AI 介绍了</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Play className="h-4 w-4" />
              手动生成
            </h4>
            <p className="text-sm text-muted-foreground">
              点击"批量生成"按钮可以一次性为多个工具生成 AI 内容，每次最多 10 个。
              也可以点击单个工具右侧的"生成 AI"按钮单独生成。
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Bot className="h-4 w-4" />
              自动生成（Vercel）
            </h4>
            <p className="text-sm text-muted-foreground">
              如果部署在 Vercel 上，系统会在每天凌晨 2 点自动为最多 3 个未生成 AI 内容的工具生成介绍。
              如需调整频率，请修改 <code className="bg-muted px-1 py-0.5 rounded">vercel.json</code> 文件。
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              外部定时任务
            </h4>
            <p className="text-sm text-muted-foreground">
              也可以使用 cron-job.org 等外部服务定时调用 API：
              <code className="bg-muted px-1 py-0.5 rounded ml-1">
                POST /api/cron/generate-ai-content?limit=5
              </code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
