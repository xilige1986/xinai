'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Share2, MessageSquare, Check } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface NewsActionsProps {
  newsId: number;
  initialLikes: number;
  commentsCount: number;
}

export function NewsActions({ newsId, initialLikes, commentsCount }: NewsActionsProps) {
  const { data: session } = useSession();
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check if user has liked this article (from localStorage)
  useEffect(() => {
    const likedNews = JSON.parse(localStorage.getItem('likedNews') || '[]');
    setIsLiked(likedNews.includes(newsId));
  }, [newsId]);

  // Handle like/unlike
  const handleLike = async () => {
    if (!session) {
      toast.error('请先登录后再点赞');
      return;
    }

    setIsLoading(true);
    try {
      const action = isLiked ? 'unlike' : 'like';
      const res = await fetch(`/api/news/${newsId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '操作失败');
      }

      const data = await res.json();
      setLikes(data.likes);
      setIsLiked(!isLiked);

      // Update localStorage
      const likedNews = JSON.parse(localStorage.getItem('likedNews') || '[]');
      if (isLiked) {
        const updated = likedNews.filter((id: number) => id !== newsId);
        localStorage.setItem('likedNews', JSON.stringify(updated));
      } else {
        likedNews.push(newsId);
        localStorage.setItem('likedNews', JSON.stringify(likedNews));
      }

      toast.success(isLiked ? '已取消点赞' : '点赞成功');
    } catch (error: any) {
      toast.error(error.message || '操作失败');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle share
  const handleShare = async () => {
    const url = window.location.href;
    const title = document.title;

    // Try Web Share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
        return;
      } catch {
        // User cancelled or API failed, fall back to clipboard
      }
    }

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('链接已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('复制失败，请手动复制链接');
    }
  };

  // Scroll to comments section
  const scrollToComments = () => {
    const commentsSection = document.getElementById('comments-section');
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant={isLiked ? 'default' : 'outline'}
        size="sm"
        className="gap-1 w-full"
        onClick={handleLike}
        disabled={isLoading}
      >
        <Heart
          className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`}
        />
        {isLiked ? '已点赞' : '点赞'} ({likes})
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="gap-1 w-full"
        onClick={scrollToComments}
      >
        <MessageSquare className="h-4 w-4" />
        评论 ({commentsCount})
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="gap-1 w-full"
        onClick={handleShare}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        {copied ? '已复制' : '分享'}
      </Button>
    </div>
  );
}
