const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setSortOrder() {
  // 设置一些工具为高排序值（运营推荐）
  const highPriorityTools = [
    { name: '画境AI', sortOrder: 100 },           // AI图像类，高优先级
    { name: '墨写AI', sortOrder: 90 },            // AI文本类，高优先级
    { name: 'CodePilot', sortOrder: 80 },         // AI编程类，高优先级
    { name: 'VideoCraft', sortOrder: 70 },        // AI视频类，高优先级
    { name: 'LogoMaster', sortOrder: 60 },        // AI设计类，中优先级
    { name: '会议助手AI', sortOrder: 50 },         // AI生产力类，中优先级
    { name: '流程机器人', sortOrder: 40 },         // AI自动化类，中优先级
  ];

  // 其他工具保持默认 0 或设置低优先级
  const lowPriorityTools = [
    { name: 'AI健身教练', sortOrder: -10 },       // 低优先级
    { name: '智搜AI', sortOrder: -5 },            // 低优先级
  ];

  console.log('=== 设置高优先级工具 ===');
  for (const tool of highPriorityTools) {
    const updated = await prisma.tool.updateMany({
      where: { name: tool.name },
      data: { sortOrder: tool.sortOrder },
    });
    if (updated.count > 0) {
      console.log(`✓ ${tool.name}: sortOrder = ${tool.sortOrder}`);
    } else {
      console.log(`✗ ${tool.name}: 未找到`);
    }
  }

  console.log('\n=== 设置低优先级工具 ===');
  for (const tool of lowPriorityTools) {
    const updated = await prisma.tool.updateMany({
      where: { name: tool.name },
      data: { sortOrder: tool.sortOrder },
    });
    if (updated.count > 0) {
      console.log(`✓ ${tool.name}: sortOrder = ${tool.sortOrder}`);
    } else {
      console.log(`✗ ${tool.name}: 未找到`);
    }
  }

  console.log('\n=== 验证结果 ===');
  const tools = await prisma.tool.findMany({
    orderBy: { sortOrder: 'desc' },
    select: {
      name: true,
      sortOrder: true,
      likes: true,
      views: true,
    },
  });

  console.log('工具按 sortOrder 排序:');
  tools.forEach((tool, index) => {
    console.log(`${index + 1}. ${tool.name} (sortOrder: ${tool.sortOrder}, likes: ${tool.likes}, views: ${tool.views})`);
  });
}

setSortOrder()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
