'use client';

import { useState, useEffect, memo } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Heart, Loader2 } from 'lucide-react';

interface FavoriteButtonProps {
  toolId: number;
  initialIsFavorite?: boolean;
}

export const FavoriteButton = memo(function FavoriteButton({ toolId, initialIsFavorite = false }: FavoriteButtonProps) {
  const { data: session } = useSession();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // 检查是否已收藏
  useEffect(() => {
    const checkFavorite = async () => {
      if (!session?.user?.id) {
        setIsChecking(false);
        return;
      }

      try {
        const response = await fetch(`/api/user/favorites/check?toolId=${toolId}`);
        if (response.ok) {
          const data = await response.json();
          setIsFavorite(data.isFavorite);
        }
      } catch (error) {
        console.error('Failed to check favorite:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkFavorite();
  }, [toolId, session]);

  const handleToggleFavorite = async () => {
    if (!session?.user) {
      // 未登录，跳转到登录页
      window.location.href = '/login';
      return;
    }

    setIsLoading(true);

    try {
      if (isFavorite) {
        // 取消收藏
        const response = await fetch(`/api/user/favorites?toolId=${toolId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setIsFavorite(false);
        }
      } else {
        // 添加收藏
        const response = await fetch('/api/user/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolId }),
        });

        if (response.ok) {
          setIsFavorite(true);
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <Button variant="outline" className="w-full" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        加载中
      </Button>
    );
  }

  return (
    <Button
      variant={isFavorite ? 'default' : 'outline'}
      className={`w-full transition-all ${
        isFavorite
          ? 'bg-red-500 hover:bg-red-600 text-white border-red-500'
          : 'border-border hover:border-red-300 hover:text-red-500'
      }`}
      onClick={handleToggleFavorite}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Heart className={`mr-2 h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
      )}
      {isFavorite ? '已收藏' : '收藏工具'}
    </Button>
  );
});
