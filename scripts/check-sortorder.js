const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  console.log('=== 检查 sortOrder 数据 ===');

  // 查询所有工具，按 sortOrder 降序
  const tools = await prisma.tool.findMany({
    orderBy: { sortOrder: 'desc' },
    select: {
      id: true,
      name: true,
      sortOrder: true,
      status: true,
    },
  });

  console.log('所有工具的 sortOrder:');
  tools.forEach((tool) => {
    console.log(`  ${tool.name}: sortOrder=${tool.sortOrder}, status=${tool.status}`);
  });

  // 测试 recommended 排序查询
  console.log('\n=== 测试 recommended 排序查询 ===');
  const recommendedTools = await prisma.tool.findMany({
    where: { status: 1 },
    orderBy: [{ sortOrder: 'desc' }, { likes: 'desc' }],
    take: 5,
    select: {
      name: true,
      sortOrder: true,
      likes: true,
    },
  });

  console.log('Recommended 排序前5个工具:');
  recommendedTools.forEach((tool, idx) => {
    console.log(`  ${idx + 1}. ${tool.name} (sortOrder: ${tool.sortOrder}, likes: ${tool.likes})`);
  });
}

checkData()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
