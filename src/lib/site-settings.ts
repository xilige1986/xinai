import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db';

export const SITE_SETTINGS_CACHE_TAG = 'site-settings';
const SITE_SETTINGS_REVALIDATE_SECONDS = 300; // 5 分钟，减轻 DB 压力

// 默认网站设置
export const defaultSettings = {
  siteName: 'AI工具库',
  siteDomain: 'localhost:3000',
  siteLogo: '/logo.svg',
  siteFavicon: '/favicon.ico',
  siteDescription: '发现优质AI工具，提升工作效率',
  siteKeywords: 'AI工具,人工智能,AI应用,AI软件',
  siteIcp: '',
  siteIcpLink: '',
  siteEmail: '',
  siteCopyright: '',
  footerText: '',
  // 推广设置
  referralEnabled: 'true',
  referralRewardPoints: '10',
  // 多级推广设置
  referralLevel2Enabled: 'true',
  referralLevel3Enabled: 'true',
  referralLevel2Reward: '5',
  referralLevel3Reward: '3',
  referralFounderOnly: 'true',
  // 注册验证设置
  registerEmailVerify: 'false',
  registerPhoneVerify: 'false',
};

async function getSiteSettingsUncached(): Promise<Record<string, string>> {
  const settings = await prisma.siteSetting.findMany();
  const settingsMap: Record<string, string> = {};
  settings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });
  return {
    ...defaultSettings,
    ...settingsMap,
  };
}

// 获取所有网站设置（带缓存，避免 layout 每次请求都查库）
export async function getSiteSettings(): Promise<Record<string, string>> {
  try {
    return await unstable_cache(
      getSiteSettingsUncached,
      [SITE_SETTINGS_CACHE_TAG],
      { revalidate: SITE_SETTINGS_REVALIDATE_SECONDS, tags: [SITE_SETTINGS_CACHE_TAG] }
    )();
  } catch (error) {
    console.error('Failed to get site settings:', error);
    return defaultSettings;
  }
}

// 获取单个设置项
export async function getSiteSetting(key: string): Promise<string> {
  const settings = await getSiteSettings();
  return settings[key] || defaultSettings[key as keyof typeof defaultSettings] || '';
}
