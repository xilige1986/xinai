import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { defaultSettings, SITE_SETTINGS_CACHE_TAG } from '@/lib/site-settings';

// ??????
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.siteSetting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({
      settings: {
        ...defaultSettings,
        ...settingsMap,
      },
    });
  } catch (error) {
    console.error('Failed to get settings:', error);
    return NextResponse.json(
      { error: '??????' },
      { status: 500 }
    );
  }
}

// ????
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: '????' },
        { status: 400 }
      );
    }

    // ???????
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: {
        key,
        value: String(value),
        description: getSettingDescription(key),
      },
    });
    revalidateTag(SITE_SETTINGS_CACHE_TAG);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update setting:', error);
    return NextResponse.json(
      { error: '??????' },
      { status: 500 }
    );
  }
}

// ??????
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const settings = body.settings as Record<string, string>;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: '????' },
        { status: 400 }
      );
    }

    // ????
    for (const [key, value] of Object.entries(settings)) {
      await prisma.siteSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: {
          key,
          value: String(value),
          description: getSettingDescription(key),
        },
      });
    }
    revalidateTag(SITE_SETTINGS_CACHE_TAG);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json(
      { error: '??????' },
      { status: 500 }
    );
  }
}

// ???????
function getSettingDescription(key: string): string {
  const descriptions: Record<string, string> = {
    siteName: '????',
    siteDomain: '????',
    siteLogo: '??Logo',
    siteFavicon: '??Favicon',
    siteDescription: '????',
    siteKeywords: '?????',
    siteIcp: 'ICP???',
    siteIcpLink: 'ICP????',
    siteEmail: '????',
    siteCopyright: '????',
    footerText: '????',
    referralEnabled: '????????',
    referralRewardPoints: '1???????',
    referralLevel2Enabled: '????2???',
    referralLevel3Enabled: '????3???',
    referralLevel2Reward: '2???????',
    referralLevel3Reward: '3???????',
    referralFounderOnly: '????????????',
    registerEmailVerify: '????????????',
    registerPhoneVerify: '????????????',
  };
  return descriptions[key] || '';
}
