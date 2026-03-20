// 检查数据库中工具的脚本
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const tools = await prisma.tool.findMany({
    select: { id: true, name: true, slug: true, status: true },
    take: 20,
  });

  console.log('数据库中的工具列表：');
  tools.forEach(t => {
    const status = t.status === 1 ? '已发布' : t.status === 0 ? '待审' : '已拒绝';
    console.log(`  ${t.id}: ${t.name} (${t.slug}) - ${status}`);
  });

  // 查找 huajing-ai
  const huajing = await prisma.tool.findUnique({
    where: { slug: 'huajing-ai' },
    include: { aiContent: true },
  });

  if (huajing) {
    console.log('\n找到 huajing-ai：');
    console.log(JSON.stringify(huajing, null, 2));
  } else {
    console.log('\n未找到 slug 为 "huajing-ai" 的工具');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
