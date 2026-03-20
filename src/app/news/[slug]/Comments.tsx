'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    name: string | null;
    avatar: string | null;
  };
}

interface NewsCommentsProps {
  newsId: number;
  initialComments?: number;
}

export function NewsComments({ newsId, initialComments = 0 }: NewsCommentsProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [total, setTotal] = useState(initialComments);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 获取评论列表
  const fetchComments = async (pageNum: number = 1) => {
    try {
      const res = await fetch(`/api/news/${newsId}/comments?page=${pageNum}`);
      if (!res.ok) {
        // 静默处理错误，不抛出异常
        setComments([]);
        setTotal(0);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (pageNum === 1) {
        setComments(data.comments);
      } else {
        setComments((prev) => [...prev, ...data.comments]);
      }
      setTotal(data.total);
      setPage(pageNum);
    } catch (err: any) {
      // 静默处理错误，不影响用户体验
      setComments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [newsId]);

  // 提交评论
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/news/${newsId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '提交失败');
      }

      const data = await res.json();
      // 评论提交成功，显示等待审核的提示，不立即显示评论
      setSuccess(data.message || '评论提交成功，等待审核');
      setContent('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 格式化时间
  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return d.toLocaleDateString('zh-CN');
  };

  return (
    <div className="mt-12 pt-8 border-t border-border/50">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-semibold">评论 ({total})</h3>
      </div>

      {/* 评论输入框 */}
      {session ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={session.user?.image || ''} />
              <AvatarFallback>
                {session.user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="写下你的评论..."
                className="min-h-[80px] resize-none"
              />
              {error && (
                <p className="text-sm text-destructive mt-2">{error}</p>
              )}
              {success && (
                <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded mt-2">{success}</p>
              )}
              <div className="flex justify-end mt-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting || !content.trim()}
                >
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  发表评论
                </Button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-muted/50 rounded-lg p-4 mb-8 text-center">
          <p className="text-muted-foreground mb-2">
            登录后可以发表评论
          </p>
          <Link href="/login">
            <Button variant="outline" size="sm">去登录</Button>
          </Link>
        </div>
      )}

      {/* 评论列表 */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-16 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>暂无评论，来说两句吧~</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={comment.user?.avatar || ''} />
                <AvatarFallback>
                  {comment.user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {comment.user?.name || '匿名用户'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground break-words">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
