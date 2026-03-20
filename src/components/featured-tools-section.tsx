'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import type { Tool, Category } from '@/types';

interface FeaturedToolsSectionProps {
  tools: Tool[];
  categories: Category[];
}

export function FeaturedToolsSection({ tools, categories }: FeaturedToolsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 按分类分组工具
  const toolsByCategory = useMemo(() => {
    const grouped: Record<string, Tool[]> = {};
    tools.forEach((tool) => {
      const categoryId = tool.category?.id?.toString() || 'other';
      if (!grouped[categoryId]) {
        grouped[categoryId] = [];
      }
      grouped[categoryId].push(tool);
    });
    return grouped;
  }, [tools]);

  // 当前显示的工具
  const displayedTools = useMemo(() => {
    if (selectedCategory === 'all') {
      return tools;
    }
    return toolsByCategory[selectedCategory] || [];
  }, [selectedCategory, tools, toolsByCategory]);

  // 获取有工具的分类
  const categoriesWithTools = useMemo(() => {
    return categories.filter((cat) => toolsByCategory[cat.id.toString()]?.length > 0);
  }, [categories, toolsByCategory]);

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
      {/* 分类标签 - 横向滑动 */}
      <div className="relative mb-6">
        {/* 左侧渐变遮罩 */}
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none sm:hidden" />
        {/* 右侧渐变遮罩 */}
        <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none sm:hidden" />

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-primary text-white shadow-md'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            全部
          </button>
          {categoriesWithTools.map((category) => {
            const count = toolsByCategory[category.id.toString()]?.length || 0;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id.toString())}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
                  selectedCategory === category.id.toString()
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {category.name}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    selectedCategory === category.id.toString()
                      ? 'bg-white/20 text-white'
                      : 'bg-background text-muted-foreground'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 工具列表 */}
      {displayedTools.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {displayedTools.map((tool) => (
            <Card key={tool.id} className="group hover:shadow-lg transition-all border-border/50 hover:border-primary/30 h-[90px] overflow-hidden relative">
              {/* Logo 背景效果 */}
              {tool.imageUrl && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-bl from-white/90 via-white/70 to-white/30 dark:from-slate-900/90 dark:via-slate-900/70 dark:to-slate-900/30 z-[1]" />
                  <img
                    src={tool.imageUrl}
                    alt=""
                    className="absolute -right-6 -top-6 w-28 h-30 object-contain opacity-[0.20] blur-[0px] group-hover:opacity-[0.35] group-hover:blur-0 group-hover:scale-110 transition-all duration-500"
                  />
                </div>
              )}
              <CardContent className="p-2 sm:p-3 h-full flex items-center gap-2 sm:gap-3 relative z-10">
                {/* Logo - 点击直达详情 */}
                <a
                  href={`/tool/${tool.slug}`}
                  target="_blank"
                  className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-muted shrink-0 cursor-pointer group/logo"
                  title="查看详情"
                >
                  {tool.imageUrl ? (
                    <img
                      src={tool.imageUrl}
                      alt={tool.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold text-xs sm:text-sm">
                      {tool.name[0]}
                    </div>
                  )}
                  {/* 悬停时显示"直达"提示 */}
                  <div className="absolute inset-0 bg-primary/80 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity">
                    <span className="text-white text-[10px] sm:text-xs font-medium">详情</span>
                  </div>
                </a>
                {/* 文字区域 - 点击打开详情页 */}
                <Link href={`${tool.websiteUrl}${tool.websiteUrl.includes('?') ? '&' : '?'}utm_source=okrvv`}
  target="_blank"
  rel="noopener nofollow" className="min-w-0 flex-1">
                  <p className="font-medium text-xs sm:text-sm truncate group-hover:text-primary transition-colors">
                    {tool.name}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {tool.shortDesc}
                  </p>
                </Link>
              </CardContent>
            </Card>
          ))}
          {/* 查看全部按钮 */}
          <Link href="/tools?sort=popular">
            <Card className="group hover:shadow-lg transition-all border-border/50 hover:border-primary/30 h-[90px] overflow-hidden cursor-pointer bg-muted/50 hover:bg-muted">
              <CardContent className="p-2 sm:p-3 h-full flex items-center justify-center gap-2 sm:gap-3">
                <div className="text-center">
                  <p className="font-medium text-xs sm:text-sm text-primary group-hover:text-primary transition-colors">
                    查看全部
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                    更多 AI 工具
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
          <p className="text-muted-foreground">该分类暂无工具</p>
        </div>
      )}
    </section>
  );
}
