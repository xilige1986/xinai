'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, XCircle, Trash2, Loader2, MessageSquare, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Comment {
  id: number;
  content: string;
  status: number;
  createdAt: string;
  user: {
    id: number;
    name: string | null;
    email: string;
    avatar: string | null;
  };
  news: {
    id: number;
    title: string;
    slug: string;
  };
}

export default function CommentsModerationPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  const fetchComments = async (status: string) => {
    setLoading(true);
    try {
      const statusMap: Record<string, number> = {
        pending: 0,
        approved: 1,
        rejected: 2,
      };
      const res = await fetch(`/api/admin/comments?status=${statusMap[status]}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        fetch('/api/admin/comments?status=0'),
        fetch('/api/admin/comments?status=1'),
        fetch('/api/admin/comments?status=2'),
      ]);
      const [pending, approved, rejected] = await Promise.all([
        pendingRes.json(),
        approvedRes.json(),
        rejectedRes.json(),
      ]);
      setStats({
        pending: pending.total,
        approved: approved.total,
        rejected: rejected.total,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchComments(activeTab);
    fetchStats();
  }, [activeTab]);

  const handleModerate = async (commentId: number, action: 'approve' | 'reject') => {
    setProcessing(commentId);
    try {
      const res = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        // 移除已处理的评论
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to moderate comment:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('确定要删除这条评论吗？')) return;
    setProcessing(commentId);
    try {
      const res = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <Badge variant="secondary">待审核</Badge>;
      case 1:
        return <Badge className="bg-green-500">已通过</Badge>;
      case 2:
        return <Badge variant="destructive">已拒绝</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            评论审核
          </h1>
          <p className="text-muted-foreground mt-1">管理资讯文章的评论</p>
        </div>
        <Link href="/admin">
          <Button variant="outline">返回后台</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">待审核</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">已通过</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">已拒绝</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending">
            待审核 ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="approved">
            已通过 ({stats.approved})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            已拒绝 ({stats.rejected})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>暂无{activeTab === 'pending' ? '待审核' : activeTab === 'approved' ? '已通过' : '已拒绝'}的评论</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={comment.user?.avatar || ''} />
                        <AvatarFallback>
                          {comment.user?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{comment.user?.name || '匿名用户'}</span>
                          <span className="text-sm text-muted-foreground">
                            {comment.user?.email}
                          </span>
                          {getStatusBadge(comment.status)}
                          <span className="text-sm text-muted-foreground ml-auto">
                            {new Date(comment.createdAt).toLocaleString('zh-CN')}
                          </span>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-3 mb-3">
                          <p className="text-sm">{comment.content}</p>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <span>评论文章:</span>
                          <Link
                            href={`/news/${comment.news?.slug}.html`}
                            target="_blank"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            {comment.news?.title}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>

                        <div className="flex gap-2">
                          {activeTab === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600"
                                onClick={() => handleModerate(comment.id, 'approve')}
                                disabled={processing === comment.id}
                              >
                                {processing === comment.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                )}
                                通过
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600"
                                onClick={() => handleModerate(comment.id, 'reject')}
                                disabled={processing === comment.id}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                拒绝
                              </Button>
                            </>
                          )}
                          {activeTab === 'approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => handleModerate(comment.id, 'reject')}
                              disabled={processing === comment.id}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              改为拒绝
                            </Button>
                          )}
                          {activeTab === 'rejected' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600"
                              onClick={() => handleModerate(comment.id, 'approve')}
                              disabled={processing === comment.id}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              改为通过
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 ml-auto"
                            onClick={() => handleDelete(comment.id)}
                            disabled={processing === comment.id}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            删除
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
