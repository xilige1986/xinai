import { prisma } from '@/lib/db';
import { Flame, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';

/**
 * 获取24小时热门资讯
 * 基于浏览量、点赞数综合计算热度
 */
async function getHotNews24h() {
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const news = await prisma.news.findMany({
    where: {
      status: 1, // 已发布
      publishedAt: {
        gte: twentyFourHoursAgo,
      },
    },
    orderBy: [
      { views: 'desc' },
      { likes: 'desc' },
      { publishedAt: 'desc' },
    ],
    take: 5,
    select: {
      id: true,
      title: true,
      slug: true,
      views: true,
      likes: true,
      publishedAt: true,
    },
  });

  return news;
}

/**
 * 获取最新资讯（当24小时内无数据时的 fallback）
 */
async function getLatestNews() {
  return await prisma.news.findMany({
    where: {
      status: 1, // 已发布
    },
    orderBy: { publishedAt: 'desc' },
    take: 5,
    select: {
      id: true,
      title: true,
      slug: true,
      views: true,
      likes: true,
      publishedAt: true,
    },
  });
}

/**
 * 格式化时间显示
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (hours >= 24) {
    return `${Math.floor(hours / 24)}天前`;
  } else if (hours >= 1) {
    return `${hours}小时前`;
  } else if (minutes >= 1) {
    return `${minutes}分钟前`;
  } else {
    return '刚刚';
  }
}

/**
 * 计算热度值
 */
function getHeatScore(views: number, likes: number): number {
  return views + likes * 5; // 点赞权重更高
}

/**
 * 24h 热议组件 - 服务端组件
 */
export async function HotNews24h() {
  // 先尝试获取24小时内的热门资讯
  let hotNews = await getHotNews24h().catch(() => []);

  // 如果24小时内没有数据，则显示最新资讯
  if (hotNews.length === 0) {
    hotNews = await getLatestNews().catch(() => []);
  }

  if (hotNews.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
      {/* 头部 */}
      <div className="px-4 py-3 border-b border-border/50 bg-gradient-to-r from-orange-500/10 to-red-500/10">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Flame className="h-5 w-5 text-orange-500" />
            <div className="absolute inset-0 animate-pulse">
              <Flame className="h-5 w-5 text-orange-500/50" />
            </div>
          </div>
          <h3 className="font-semibold text-foreground">24h 热议</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            实时
          </span>
        </div>
      </div>

      {/* 列表 */}
      <div className="p-2">
        {hotNews.map((item, index) => {
          const heatScore = getHeatScore(item.views, item.likes);
          const rank = index + 1;

          return (
            <Link
              key={item.id}
              href={`/news/${item.slug}.html`}
              className="group flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
            >
              {/* 排名 */}
              <div
                className={`
                  flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-sm font-bold
                  ${rank === 1 ? 'bg-red-500 text-white' : ''}
                  ${rank === 2 ? 'bg-orange-500 text-white' : ''}
                  ${rank === 3 ? 'bg-yellow-500 text-white' : ''}
                  ${rank > 3 ? 'bg-muted text-muted-foreground' : ''}
                `}
              >
                {rank}
              </div>

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h4>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimeAgo(item.publishedAt!)}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {heatScore.toLocaleString()} 热度
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 底部 */}
      <div className="px-4 py-2 border-t border-border/50 bg-muted/30">
        <Link
          href="/news"
          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1"
        >
          查看更多资讯
          <TrendingUp className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

/**
 * 24h 热议组件 - 骨架屏
 */
export function HotNews24hSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50 bg-gradient-to-r from-orange-500/10 to-red-500/10">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-muted rounded animate-pulse" />
          <div className="w-20 h-5 bg-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="p-2 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-2.5">
            <div className="w-6 h-6 bg-muted rounded animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
