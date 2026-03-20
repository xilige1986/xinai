'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Heart, Loader2 } from 'lucide-react';
import type { Tool } from '@/types';

interface ToolCardProps {
  tool: Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  const { data: session } = useSession();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 检查是否已收藏
  useEffect(() => {
    const checkFavorite = async () => {
      if (!session?.user?.id) return;
      try {
        const response = await fetch(`/api/user/favorites/check?toolId=${tool.id}`);
        if (response.ok) {
          const data = await response.json();
          setIsFavorite(data.isFavorite);
        }
      } catch (error) {
        console.error('Failed to check favorite:', error);
      }
    };
    checkFavorite();
  }, [tool.id, session]);

  // 切换收藏状态
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      window.location.href = '/login';
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorite) {
        const response = await fetch(`/api/user/favorites?toolId=${tool.id}`, {
          method: 'DELETE',
        });
        if (response.ok) setIsFavorite(false);
      } else {
        const response = await fetch('/api/user/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolId: tool.id }),
        });
        if (response.ok) setIsFavorite(true);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 构建官网链接（带utm参数）
  const websiteUrlWithUtm = tool.websiteUrl
    ? tool.websiteUrl.includes('?')
      ? `${tool.websiteUrl}&utm_source=okrvv`
      : `${tool.websiteUrl}?utm_source=okrvv`
    : `/tool/${tool.slug}`;

  // 详情页链接
  const detailUrl = `/tool/${tool.slug}`;

  return (
    <div className="group relative" style={{ width: '100%', height: '95px' }}>
      {/* Logo - 绝对定位，链接到详情页 */}
      <a
        href={detailUrl}
        className="absolute left-4 top-3 z-20 w-12 h-12"
        onClick={(e) => e.stopPropagation()}
      >
        {tool.imageUrl ? (
          <img
            src={tool.imageUrl}
            alt={tool.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg border-2 border-white dark:border-slate-700 shadow-sm">
            {tool.name[0]}
          </div>
        )}
        {/* 悬停提示 */}
        <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <span className="text-white text-[10px] font-medium">详情</span>
        </div>
      </a>

      {/* 主卡片 - A标签直达官网 */}
      <a
        href={websiteUrlWithUtm}
        target="_blank"
        rel="noopener nofollow"
        className="block relative bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-all duration-300 p-4 overflow-hidden h-full pl-[68px]"
      >
        {/* 背景 - Logo彩色淡化效果 */}
        {tool.imageUrl && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* 渐变遮罩 - 右上角到左下角的过渡 */}
            <div className="absolute inset-0 bg-gradient-to-bl from-white/90 via-white/70 to-white/30 dark:from-slate-900/90 dark:via-slate-900/70 dark:to-slate-900/30 z-[1]" />
            <img
              src={tool.imageUrl}
              alt=""
              className="absolute -right-6 -top-6 w-28 h-30 object-contain opacity-[0.40] blur-[0px] group-hover:opacity-[0.55] group-hover:blur-0 group-hover:scale-110 transition-all duration-500"
            />
          </div>
        )}

        <div className="relative z-10 h-full flex flex-col">
          {/* 第一行：名称 */}
          <div className="flex items-center gap-2.5 mb-2">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors pr-8">
              {tool.name}
            </h3>
          </div>

          {/* 第二行：描述 */}
          <div className="flex-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-[18px]">
              {tool.shortDesc}
            </p>
          </div>
        </div>
      </a>

      {/* 右上角收藏按钮 */}
      <button
        onClick={handleToggleFavorite}
        disabled={isLoading}
        className={`absolute top-2 right-2 z-20 p-1.5 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 ${
          isFavorite ? 'opacity-100' : ''
        } ${
          isFavorite
            ? 'bg-red-500 text-white shadow-md'
            : 'bg-white dark:bg-slate-700 text-slate-400 hover:text-red-500 shadow-sm border border-slate-200 dark:border-slate-600'
        }`}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-current' : ''}`} />
        )}
      </button>
    </div>
  );
}
