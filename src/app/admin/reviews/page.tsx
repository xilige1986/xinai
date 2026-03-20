'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, XCircle, Trash2, Loader2, Star, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Review {
  id: number;
  rating: number;
  content: string;
  status: number;
  createdAt: string;
  user: {
    id: number;
    name: string | null;
    email: string;
    avatar: string | null;
  };
  tool: {
    id: number;
    name: string;
    slug: string;
  };
}

export default function ReviewsModerationPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  const fetchReviews = async (status: string) => {
    setLoading(true);
    try {
      const statusMap: Record<string, number> = {
        pending: 0,
        approved: 1,
        rejected: 2,
      };
      const res = await fetch(`/api/admin/reviews?status=${statusMap[status]}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        fetch('/api/admin/reviews?status=0'),
        fetch('/api/admin/reviews?status=1'),
        fetch('/api/admin/reviews?status=2'),
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
    fetchReviews(activeTab);
    fetchStats();
  }, [activeTab]);

  const handleModerate = async (reviewId: number, action: 'approve' | 'reject') => {
    setProcessing(reviewId);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to moderate review:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (reviewId: number) => {
    if (!confirm('确定要删除这条点评吗？')) return;
    setProcessing(reviewId);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to delete review:', error);
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

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              rating >= star
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Star className="h-8 w-8 text-primary" />
            点评审核
          </h1>
          <p className="text-muted-foreground mt-1">管理工具的点评和评分</p>
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
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>暂无{activeTab === 'pending' ? '待审核' : activeTab === 'approved' ? '已通过' : '已拒绝'}的点评</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={review.user?.avatar || ''} />
                        <AvatarFallback>
                          {review.user?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{review.user?.name || '匿名用户'}</span>
                          <span className="text-sm text-muted-foreground">
                            {review.user?.email}
                          </span>
                          {renderStars(review.rating)}
                          {getStatusBadge(review.status)}
                          <span className="text-sm text-muted-foreground ml-auto">
                            {new Date(review.createdAt).toLocaleString('zh-CN')}
                          </span>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-3 mb-3">
                          <p className="text-sm">{review.content}</p>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <span>点评工具:</span>
                          <Link
                            href={`/tool/${review.tool?.slug}`}
                            target="_blank"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            {review.tool?.name}
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
                                onClick={() => handleModerate(review.id, 'approve')}
                                disabled={processing === review.id}
                              >
                                {processing === review.id ? (
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
                                onClick={() => handleModerate(review.id, 'reject')}
                                disabled={processing === review.id}
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
                              onClick={() => handleModerate(review.id, 'reject')}
                              disabled={processing === review.id}
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
                              onClick={() => handleModerate(review.id, 'approve')}
                              disabled={processing === review.id}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              改为通过
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 ml-auto"
                            onClick={() => handleDelete(review.id)}
                            disabled={processing === review.id}
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
