import { prisma } from '@/lib/db';

export interface Sponsor {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconBg: string;
  link: string;
}

const SPONSOR_SETTING_KEY = 'news_sponsors';

// 获取赞助商列表
export async function getSponsors(): Promise<Sponsor[]> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: SPONSOR_SETTING_KEY },
    });

    if (setting?.value) {
      return JSON.parse(setting.value) as Sponsor[];
    }
  } catch {
    // 如果解析失败，返回默认数据
  }

  // 默认数据
  return [
    {
      id: '1',
      name: 'ChatGPT Plus',
      description: '智能对话助手',
      icon: 'AI',
      iconBg: 'from-primary to-primary-dark',
      link: '/tools',
    },
    {
      id: '2',
      name: 'Midjourney',
      description: 'AI绘画神器',
      icon: 'MJ',
      iconBg: 'from-purple-500 to-pink-500',
      link: '/tools',
    },
  ];
}

// 保存赞助商列表
export async function saveSponsors(sponsors: Sponsor[]): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: SPONSOR_SETTING_KEY },
    update: { value: JSON.stringify(sponsors) },
    create: {
      key: SPONSOR_SETTING_KEY,
      value: JSON.stringify(sponsors),
      description: '资讯页侧边栏赞助商推荐列表',
    },
  });
}
