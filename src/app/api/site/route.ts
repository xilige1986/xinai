import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { defaultSettings } from '@/lib/site-settings';

// 公开的站点信息 API（无需登录）
export async function GET() {
  try {
    const settings = await prisma.siteSetting.findMany();

    // 将数据库设置转换为键值对
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    // 合并默认值并只返回公开信息
    const publicSettings = {
      siteName: settingsMap.siteName || defaultSettings.siteName,
      siteDomain: settingsMap.siteDomain || defaultSettings.siteDomain,
      siteLogo: settingsMap.siteLogo || defaultSettings.siteLogo,
      siteFavicon: settingsMap.siteFavicon || defaultSettings.siteFavicon,
      siteDescription: settingsMap.siteDescription || defaultSettings.siteDescription,
      siteKeywords: settingsMap.siteKeywords || defaultSettings.siteKeywords,
      siteIcp: settingsMap.siteIcp || defaultSettings.siteIcp,
      siteIcpLink: settingsMap.siteIcpLink || defaultSettings.siteIcpLink,
      siteEmail: settingsMap.siteEmail || defaultSettings.siteEmail,
      siteCopyright: settingsMap.siteCopyright || defaultSettings.siteCopyright,
      footerText: settingsMap.footerText || defaultSettings.footerText,
    };

    return NextResponse.json({ settings: publicSettings });
  } catch (error) {
    console.error('Failed to get site settings:', error);
    // 出错时返回默认值
    return NextResponse.json({ settings: defaultSettings });
  }
}
