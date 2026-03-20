const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sources = await prisma.newsSource.findMany();
  console.log('News Sources:');
  console.log(JSON.stringify(sources, null, 2));

  const logs = await prisma.newsCrawlLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  console.log('\nRecent Crawl Logs:');
  console.log(JSON.stringify(logs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
