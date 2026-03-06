const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('=== 检查数据库中的工具数据 ===\n');

  // 获取所有工具
  const tools = await prisma.tool.findMany({
    where: { status: 1 },
    include: {
      category: true,
      useCase: true,
    },
    orderBy: { id: 'asc' },
  });

  console.log(`总计 ${tools.length} 个工具:\n`);

  // 显示前20个工具的详细信息
  tools.slice(0, 20).forEach((tool) => {
    console.log(`ID: ${tool.id} | ${tool.name}`);
    console.log(`  - categoryId: ${tool.categoryId} (${tool.category?.name || 'N/A'})`);
    console.log(`  - useCaseId: ${tool.useCaseId} (${tool.useCase?.name || 'N/A'})`);
    console.log(`  - pricingType: ${tool.pricingType}`);
    console.log(`  - likes: ${tool.likes}, views: ${tool.views}`);
    console.log('');
  });

  // 按分类统计
  console.log('\n=== 按分类统计 ===');
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { tools: true } },
    },
  });
  categories.forEach((cat) => {
    console.log(`分类 ${cat.id} (${cat.name}): ${cat._count.tools} 个工具`);
  });

  // 按使用场景统计
  console.log('\n=== 按使用场景统计 ===');
  const useCases = await prisma.useCase.findMany({
    include: {
      _count: { select: { tools: true } },
    },
  });
  useCases.forEach((uc) => {
    console.log(`场景 ${uc.id} (${uc.name}): ${uc._count.tools} 个工具`);
  });

  // 按定价类型统计
  console.log('\n=== 按定价类型统计 ===');
  const pricingStats = await prisma.tool.groupBy({
    by: ['pricingType'],
    where: { status: 1 },
    _count: { id: true },
  });
  pricingStats.forEach((stat) => {
    console.log(`${stat.pricingType}: ${stat._count.id} 个工具`);
  });

  // 测试筛选查询
  console.log('\n=== 测试筛选查询 ===');

  // 测试分类筛选
  const categoryId = 1;
  const filteredByCategory = await prisma.tool.findMany({
    where: { status: 1, categoryId },
    select: { id: true, name: true },
  });
  console.log(`\n筛选 categoryId=${categoryId}: 找到 ${filteredByCategory.length} 个工具`);
  filteredByCategory.slice(0, 5).forEach(t => console.log(`  - ${t.name}`));

  // 测试使用场景筛选
  const useCaseId = 1;
  const filteredByUseCase = await prisma.tool.findMany({
    where: { status: 1, useCaseId },
    select: { id: true, name: true },
  });
  console.log(`\n筛选 useCaseId=${useCaseId}: 找到 ${filteredByUseCase.length} 个工具`);
  filteredByUseCase.slice(0, 5).forEach(t => console.log(`  - ${t.name}`));

  // 测试定价筛选
  const pricingType = 'Free';
  const filteredByPricing = await prisma.tool.findMany({
    where: { status: 1, pricingType },
    select: { id: true, name: true },
  });
  console.log(`\n筛选 pricingType=${pricingType}: 找到 ${filteredByPricing.length} 个工具`);
  filteredByPricing.slice(0, 5).forEach(t => console.log(`  - ${t.name}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
