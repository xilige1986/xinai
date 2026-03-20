const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 停用 NewsAPI（因为被墙无法访问）
  await prisma.newsSource.update({
    where: { id: 2 },
    data: { isActive: false },
  });

  console.log('已停用 NewsAPI（网络不可达）');

  // 显示当前活跃的新闻源
  const activeSources = await prisma.newsSource.findMany({
    where: { isActive: true },
  });

  console.log('\n当前活跃的新闻源:');
  activeSources.forEach(s => {
    console.log(`- ${s.name} (${s.type}): ${s.rssUrl || s.apiUrl}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
