'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star, MessageSquare, User, LogIn } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';

interface Review {
  id: number;
  rating: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    name: string | null;
    avatar: string | null;
  };
}

interface ReviewStats {
  averageRating: string;
  ratingCount: number;
  ratingDistribution: Record<number, number>;
}

interface ReviewsSectionProps {
  toolId: number;
}

export const ReviewsSection = memo(function ReviewsSection({ toolId }: ReviewsSectionProps) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await fetch(`/api/tools/${toolId}/reviews`);
      const data = await response.json();
      if (response.ok) {
        setReviews(data.reviews);
        setStats({
          averageRating: data.averageRating,
          ratingCount: data.ratingCount,
          ratingDistribution: data.ratingDistribution,
        });
        // 检查当前用户是否已点评
        if (session?.user?.id) {
          const userReview = data.reviews.find(
            (r: Review) => r.user.id.toString() === session.user?.id
          );
          if (userReview) {
            setHasReviewed(true);
            setRating(userReview.rating);
            setContent(userReview.content);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [toolId, session]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      setError('请先登录');
      return;
    }
    if (rating === 0) {
      setError('请选择评分');
      return;
    }
    if (content.trim().length < 5) {
      setError('点评内容至少 5 个字符');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/tools/${toolId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, content: content.trim() }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message);
        setHasReviewed(true);
        // 点评需要审核，不立即刷新列表
        // fetchReviews();
      } else {
        setError(data.error || '提交失败');
      }
    } catch (error) {
      setError('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingLabel = (rating: number) => {
    const labels: Record<number, string> = {
      1: '很差',
      2: '较差',
      3: '一般',
      4: '不错',
      5: '推荐',
    };
    return labels[rating] || '';
  };

  const getRatingPercentage = (count: number) => {
    if (!stats || stats.ratingCount === 0) return 0;
    return (count / stats.ratingCount) * 100;
  };

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 评分统计 */}
      {stats && stats.ratingCount > 0 && (
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* 左侧平均分 */}
              <div className="flex-shrink-0 text-center sm:text-left">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-primary">
                    {stats.averageRating}
                  </span>
                  <span className="text-muted-foreground">/5</span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        parseFloat(stats.averageRating) >= star
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  基于 {stats.ratingCount} 条点评
                </p>
              </div>

              {/* 右侧分布 */}
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-sm w-8">{star}星</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full"
                        style={{
                          width: `${getRatingPercentage(stats.ratingDistribution[star])}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-10 text-right">
                      {stats.ratingDistribution[star]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 提交点评 */}
      {session ? (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              {hasReviewed ? '修改点评' : '写点评'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 评分选择 */}
              <div>
                <label className="text-sm font-medium mb-2 block">评分</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          (hoverRating || rating) >= star
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">
                    {(hoverRating || rating) > 0 && getRatingLabel(hoverRating || rating)}
                  </span>
                </div>
              </div>

              {/* 点评内容 */}
              <div>
                <label className="text-sm font-medium mb-2 block">点评内容</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="分享你的使用体验..."
                  rows={4}
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-sm text-green-600 bg-green-50 px-4 py-2 rounded">
                  {success}
                </div>
              )}

              <Button type="submit" disabled={submitting}>
                {submitting ? '提交中...' : hasReviewed ? '更新点评' : '提交点评'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* 未登录提示 */
        <Card className="border-border/50 bg-gradient-to-r from-primary/5 to-background">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">登录后发表点评</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    分享你的使用体验，帮助其他用户做出更好的选择
                  </p>
                </div>
              </div>
              <Button
                onClick={() => signIn()}
                className="shrink-0 gap-2"
              >
                <LogIn className="h-4 w-4" />
                立即登录
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 点评列表 */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            用户点评
            {stats && stats.ratingCount > 0 && (
              <span className="text-sm text-muted-foreground">
                ({stats.ratingCount})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无点评，快来发表第一条点评吧！
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-border/50 last:border-0 pb-6 last:pb-0"
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      {review.user.avatar ? (
                        <img
                          src={review.user.avatar}
                          alt={review.user.name || '用户'}
                        />
                      ) : (
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {review.user.name || '匿名用户'}
                        </span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${
                                review.rating >= star
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {formatDistanceToNow(new Date(review.createdAt))}
                      </p>
                      <p className="text-sm leading-relaxed">{review.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});
