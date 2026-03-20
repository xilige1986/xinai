import { initializeAll, stopAll } from './newsletter-scheduler';

// 是否启用定时任务
const ENABLE_SCHEDULER = process.env.ENABLE_NEWSLETTER_SCHEDULER !== 'false';

export async function initNewsletterScheduler() {
  if (!ENABLE_SCHEDULER) {
    console.log('[NewsletterScheduler] Scheduler is disabled');
    return;
  }

  try {
    await initializeAll();
    console.log('[NewsletterScheduler] Scheduler initialized successfully');
  } catch (error) {
    console.error('[NewsletterScheduler] Failed to initialize:', error);
  }
}

export function shutdownNewsletterScheduler() {
  stopAll();
  console.log('[NewsletterScheduler] Scheduler shut down');
}
