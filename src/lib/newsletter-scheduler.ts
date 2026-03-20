import cron, { ScheduledTask } from 'node-cron';
import { prisma } from './db';
import { resend, FROM_EMAIL, isEmailServiceEnabled } from './email';
import { renderNewsletterEmail } from './email-templates';

// 全局变量存储定时任务
const tasks = new Map<string, ScheduledTask>();
let isInitialized = false;

// 创建 cron 表达式
function createCronExpression(schedule: any): string | null {
  switch (schedule.frequency) {
    case 'daily':
      const [dailyHour, dailyMinute] = schedule.time.split(':');
      return `${dailyMinute} ${dailyHour} * * *`;

    case 'weekly':
      const [weeklyHour, weeklyMinute] = schedule.time.split(':');
      const dayOfWeek = schedule.dayOfWeek ?? 1;
      return `${weeklyMinute} ${weeklyHour} * * ${dayOfWeek}`;

    case 'monthly':
      const [monthlyHour, monthlyMinute] = schedule.time.split(':');
      const dayOfMonth = schedule.dayOfMonth ?? 1;
      return `${monthlyMinute} ${monthlyHour} ${dayOfMonth} * *`;

    default:
      return null;
  }
}

// 执行定时推送
async function executeSchedule(scheduleId: number) {
  try {
    console.log(`[NewsletterScheduler] Executing schedule #${scheduleId}`);

    if (!isEmailServiceEnabled()) {
      console.error('[NewsletterScheduler] Email service not enabled');
      return;
    }

    const schedule = await prisma.newsletterSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule || !schedule.enabled) {
      console.log(`[NewsletterScheduler] Schedule #${scheduleId} not found or disabled`);
      return;
    }

    // 获取最新资讯
    let newsIds: number[] = [];
    if (schedule.autoSelectNews) {
      const recentNews = await prisma.news.findMany({
        where: { status: 1 },
        orderBy: { publishedAt: 'desc' },
        take: schedule.maxNewsCount,
        select: { id: true },
      });
      newsIds = recentNews.map((n) => n.id);
    }

    if (newsIds.length === 0) {
      console.log(`[NewsletterScheduler] No news to send for schedule #${scheduleId}`);
      return;
    }

    // 创建发送历史
    const history = await prisma.newsletterHistory.create({
      data: {
        scheduleId,
        subject: schedule.subject,
        content: schedule.content,
        newsIds: JSON.stringify(newsIds),
        status: 'sending',
      },
    });

    // 执行发送
    await sendNewsletter(history.id, schedule, newsIds);

    // 更新上次发送时间
    await prisma.newsletterSchedule.update({
      where: { id: scheduleId },
      data: { lastSentAt: new Date() },
    });

  } catch (error) {
    console.error(`[NewsletterScheduler] Failed to execute schedule #${scheduleId}:`, error);
  }
}

// 发送邮件
async function sendNewsletter(historyId: number, schedule: any, newsIds: number[]) {
  try {
    const newsItems = await prisma.news.findMany({
      where: { id: { in: newsIds }, status: 1 },
      select: { id: true, title: true, summary: true, slug: true, coverImage: true },
      orderBy: { publishedAt: 'desc' },
    });

    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { status: 1 },
      select: { email: true },
    });

    if (subscribers.length === 0) {
      await prisma.newsletterHistory.update({
        where: { id: historyId },
        data: { status: 'failed', errorMessage: 'No active subscribers' },
      });
      return;
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const newsWithSummary = newsItems.map((news) => ({
      ...news,
      summary: news.summary || '暂无摘要',
    }));

    let sentCount = 0;
    let failedCount = 0;

    // 批量发送
    const batchSize = 10;
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      const promises = batch.map(async (subscriber) => {
        try {
          const unsubscribeUrl = `${siteUrl}/api/subscribe?email=${encodeURIComponent(subscriber.email)}`;
          const html = renderNewsletterEmail({
            subject: schedule.subject,
            content: schedule.content || '',
            newsItems: newsWithSummary,
            unsubscribeUrl,
          });

          await resend!.emails.send({
            from: FROM_EMAIL,
            to: subscriber.email,
            subject: schedule.subject,
            html: html,
          });
          sentCount++;
        } catch (error) {
          console.error(`Failed to send to ${subscriber.email}:`, error);
          failedCount++;
        }
      });

      await Promise.all(promises);
    }

    await prisma.newsletterHistory.update({
      where: { id: historyId },
      data: { sentCount, failedCount, totalSubscribers: subscribers.length, status: 'completed' },
    });

    console.log(`[NewsletterScheduler] Newsletter sent: ${sentCount} success, ${failedCount} failed`);

  } catch (error: any) {
    await prisma.newsletterHistory.update({
      where: { id: historyId },
      data: { status: 'failed', errorMessage: error.message },
    });
    console.error('[NewsletterScheduler] Failed to send newsletter:', error);
  }
}

// 调度单个任务
export function scheduleTask(schedule: any) {
  // 停止已存在的任务
  stopTask(schedule.id);

  const cronExpression = createCronExpression(schedule);
  if (!cronExpression) {
    console.error(`[NewsletterScheduler] Cannot create cron expression for schedule #${schedule.id}`);
    return;
  }

  if (!cron.validate(cronExpression)) {
    console.error(`[NewsletterScheduler] Invalid cron expression: ${cronExpression}`);
    return;
  }

  const task = cron.schedule(cronExpression, async () => {
    await executeSchedule(schedule.id);
  }, {
    scheduled: true,
    timezone: 'Asia/Shanghai',
  } as any);

  tasks.set(String(schedule.id), task);
  console.log(`[NewsletterScheduler] Scheduled task #${schedule.id}: ${cronExpression}`);
}

// 停止单个任务
export function stopTask(scheduleId: number) {
  const task = tasks.get(String(scheduleId));
  if (task) {
    task.stop();
    tasks.delete(String(scheduleId));
    console.log(`[NewsletterScheduler] Stopped task #${scheduleId}`);
  }
}

// 重新调度任务
export async function reschedule(scheduleId: number) {
  try {
    const schedule = await prisma.newsletterSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (schedule && schedule.enabled) {
      scheduleTask(schedule);
    } else {
      stopTask(scheduleId);
    }
  } catch (error) {
    console.error(`[NewsletterScheduler] Failed to reschedule #${scheduleId}:`, error);
  }
}

// 立即执行
export async function runNow(scheduleId: number) {
  console.log(`[NewsletterScheduler] Manual trigger for schedule #${scheduleId}`);
  await executeSchedule(scheduleId);
}

// 初始化所有任务
export async function initializeAll() {
  if (isInitialized) return;

  try {
    const schedules = await prisma.newsletterSchedule.findMany({
      where: { enabled: true },
    });

    for (const schedule of schedules) {
      scheduleTask(schedule);
    }

    isInitialized = true;
    console.log(`[NewsletterScheduler] Initialized ${schedules.length} schedule(s)`);
  } catch (error) {
    console.error('[NewsletterScheduler] Failed to initialize:', error);
  }
}

// 停止所有任务
export function stopAll() {
  for (const [id, task] of tasks) {
    task.stop();
    console.log(`[NewsletterScheduler] Stopped task #${id}`);
  }
  tasks.clear();
  isInitialized = false;
}

// 获取状态
export function getStatus() {
  return {
    isInitialized,
    activeTasks: Array.from(tasks.keys()),
  };
}
