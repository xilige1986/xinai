import cron from 'node-cron';
import { prisma } from './db';
import { getOrCreateFingerprint, reportHeartbeat } from './deployment-fingerprint';

let isInitialized = false;
let crawlTask: cron.ScheduledTask | null = null;

// 新闻源自动抓取服务
export class NewsCrawlScheduler {
  // 启动自动抓取任务（每小时运行一次）
  static start() {
    if (isInitialized) {
      console.log('[NewsCrawlScheduler] Already initialized');
      return;
    }

    console.log('[NewsCrawlScheduler] Starting auto crawl scheduler...');

    // 初始化部署指纹
    this.initFingerprint();

    // 每小时检查一次需要抓取的新闻源
    crawlTask = cron.schedule('0 * * * *', async () => {
      console.log('[NewsCrawlScheduler] Running scheduled crawl check...');
      await this.crawlAllSources();
    }, {
      scheduled: true,
      timezone: 'Asia/Shanghai',
    });

    isInitialized = true;
    console.log('[NewsCrawlScheduler] Scheduler started, will run every hour');

    // 启动时立即执行一次（延迟10秒，确保应用已完全启动）
    setTimeout(() => {
      this.crawlAllSources().catch(console.error);
    }, 10000);
  }

  // 初始化部署指纹并上报
  static async initFingerprint() {
    // 检查是否禁用追踪
    if (process.env.DISABLE_TRACKING === 'true') {
      console.log('[NewsCrawlScheduler] Tracking disabled');
      return;
    }

    try {
      const fingerprint = await getOrCreateFingerprint();
      if (fingerprint) {
        console.log('[NewsCrawlScheduler] Deployment fingerprint:', fingerprint.slice(0, 16) + '...');
      }

      // 定期上报心跳（每6小时）
      cron.schedule('0 */6 * * *', async () => {
        await reportHeartbeat();
      }, {
        scheduled: true,
        timezone: 'Asia/Shanghai',
      });

      // 立即上报一次
      await reportHeartbeat();
    } catch (error) {
      console.error('[NewsCrawlScheduler] Fingerprint init error:', error);
    }
  }

  // 停止自动抓取任务
  static stop() {
    if (crawlTask) {
      crawlTask.stop();
      crawlTask = null;
      isInitialized = false;
      console.log('[NewsCrawlScheduler] Scheduler stopped');
    }
  }

  // 抓取所有新闻源
  static async crawlAllSources() {
    try {
      // 获取需要抓取的新闻源（超过 fetchInterval 时间未抓取且已启用的源）
      const sources = await prisma.newsSource.findMany({
        where: {
          isActive: true,
          OR: [
            { lastFetchedAt: null },
            {
              lastFetchedAt: {
                lt: new Date(Date.now() - 60 * 60 * 1000), // 1小时前
              },
            },
          ],
        },
      });

      if (sources.length === 0) {
        console.log('[NewsCrawlScheduler] No sources need crawling');
        return;
      }

      console.log(`[NewsCrawlScheduler] Found ${sources.length} sources to crawl`);

      // 逐个抓取
      for (const source of sources) {
        try {
          console.log(`[NewsCrawlScheduler] Crawling source: ${source.name}`);

          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/news/crawl`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sourceId: source.id }),
          });

          const result = await response.json();

          if (result.success) {
            console.log(`[NewsCrawlScheduler] ✓ ${source.name}: fetched ${result.result?.count || 0} articles`);
          } else {
            console.error(`[NewsCrawlScheduler] ✗ ${source.name}: ${result.error}`);
          }
        } catch (error: any) {
          console.error(`[NewsCrawlScheduler] ✗ ${source.name}: ${error.message}`);
        }

        // 每个源之间延迟 2 秒，避免请求过快
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      console.log('[NewsCrawlScheduler] Crawl check completed');
    } catch (error) {
      console.error('[NewsCrawlScheduler] Error during crawl:', error);
    }
  }
}

// 初始化函数（在应用启动时调用）
export function initNewsCrawlScheduler() {
  // 只在生产环境或设置了环境变量时启用自动抓取
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_NEWS_CRAWL === 'true') {
    NewsCrawlScheduler.start();
  } else {
    console.log('[NewsCrawlScheduler] Auto crawl disabled in development mode');
    console.log('[NewsCrawlScheduler] Set ENABLE_NEWS_CRAWL=true to enable');
  }
}
