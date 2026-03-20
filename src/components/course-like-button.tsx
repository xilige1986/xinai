'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';

interface CourseLikeButtonProps {
  courseId: number;
  initialLiked?: boolean;
  variant?: 'default' | 'light';
}

export function CourseLikeButton({ courseId, initialLiked = false, variant = 'default' }: CourseLikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async () => {
    setIsLoading(true);
    try {
      setLiked(!liked);
      toast.success(liked ? '已取消收藏' : '收藏成功');
    } catch (error) {
      toast.error('操作失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // Light variant for dark backgrounds
  if (variant === 'light') {
    return (
      <Button
        variant="outline"
        size="icon"
        className={`h-12 w-12 transition-colors border-white/20 bg-white/10 hover:bg-white/20 ${
          liked ? 'bg-red-500/20 border-red-400/50 hover:bg-red-500/30' : ''
        }`}
        onClick={handleLike}
        disabled={isLoading}
      >
        <Heart
          className={`h-5 w-5 transition-colors ${
            liked ? 'fill-red-400 text-red-400' : 'text-white/70'
          }`}
        />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className={`h-12 w-12 transition-colors ${
        liked ? 'bg-red-50 border-red-200 hover:bg-red-100' : ''
      }`}
      onClick={handleLike}
      disabled={isLoading}
    >
      <Heart
        className={`h-5 w-5 transition-colors ${
          liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
        }`}
      />
    </Button>
  );
}
