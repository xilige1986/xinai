const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const rawData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'sqlite_data_export.json'), 'utf8'));
const prisma = new PrismaClient();

// 转换日期和布尔值
function fixData(items) {
  return items.map(item => {
    const newItem = { ...item };
    for (const key of Object.keys(newItem)) {
      // 日期转换
      if ((key.includes('At') || key.includes('Date')) && typeof newItem[key] === 'number') {
        newItem[key] = new Date(newItem[key]).toISOString();
      }
      // 布尔值转换（isActive, status 等）
      if (key === 'isActive' || key === 'isHot') {
        newItem[key] = newItem[key] === 1 || newItem[key] === true;
      }
    }
    return newItem;
  });
}

async function importData() {
  console.log('📥 正在导入到 MySQL...\n');

  // 清理数据
  console.log('1️⃣ 清理现有数据...');
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`;
  await prisma.$executeRaw`TRUNCATE TABLE UseCase;`;
  await prisma.$executeRaw`TRUNCATE TABLE Category;`;
  await prisma.$executeRaw`TRUNCATE TABLE SubCategory;`;
  await prisma.$executeRaw`TRUNCATE TABLE Tool;`;
  await prisma.$executeRaw`TRUNCATE TABLE QuickLink;`;
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`;
  console.log('   ✅ 清理完成\n');

  // 导入数据
  console.log('2️⃣ 导入新数据...');
  
  await prisma.useCase.createMany({ data: fixData(rawData.UseCase) });
  console.log(`   ✅ UseCase: ${rawData.UseCase.length}`);

  await prisma.category.createMany({ data: fixData(rawData.Category) });
  console.log(`   ✅ Category: ${rawData.Category.length}`);

  await prisma.subCategory.createMany({ data: fixData(rawData.SubCategory) });
  console.log(`   ✅ SubCategory: ${rawData.SubCategory.length}`);

  await prisma.tool.createMany({ data: fixData(rawData.Tool) });
  console.log(`   ✅ Tool: ${rawData.Tool.length}`);

  if (rawData.QuickLink?.length) {
    await prisma.quickLink.createMany({ data: fixData(rawData.QuickLink) });
    console.log(`   ✅ QuickLink: ${rawData.QuickLink.length}`);
  }

  if (rawData.SiteSetting?.length) {
    for (const s of rawData.SiteSetting) {
      await prisma.siteSetting.upsert({
        where: { key: s.key },
        update: { value: s.value },
        create: { key: s.key, value: s.value },
      });
    }
    console.log(`   ✅ SiteSetting: ${rawData.SiteSetting.length}`);
  }

  console.log('\n⚠️ 跳过 News 导入（内容格式复杂）\n');

  console.log('🎉 数据导入完成！');
}

importData()
  .catch(e => {
    console.error('❌ 错误:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
