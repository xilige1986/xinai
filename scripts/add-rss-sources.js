const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const newSources = [
    {
      name: '量子位',
      type: 'rss',
      category: 'AI资讯',
      rssUrl: 'https://www.qbitai.com/feed',
      fetchInterval: 60,
      isActive: true,
    },
    {
      name: '雷锋网',
      type: 'rss',
      category: '科技资讯',
      rssUrl: 'https://www.leiphone.com/feed',
      fetchInterval: 60,
      isActive: true,
    },
    {
      name: '爱范儿',
      type: 'rss',
      category: '科技产品',
      rssUrl: 'https://www.ifanr.com/feed',
      fetchInterval: 60,
      isActive: true,
    },
  ];

  for (const source of newSources) {
    // 检查是否已存在
    const existing = await prisma.newsSource.findFirst({
      where: {
        rssUrl: source.rssUrl,
      },
    });

    if (existing) {
      console.log(`已存在: ${source.name}`);
      continue;
    }

    await prisma.newsSource.create({
      data: source,
    });
    console.log(`已添加: ${source.name}`);
  }

  // 显示所有活跃的新闻源
  const activeSources = await prisma.newsSource.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  console.log('\n当前活跃的新闻源:');
  activeSources.forEach(s => {
    console.log(`- ${s.name} (${s.category}): ${s.rssUrl || s.apiUrl}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
