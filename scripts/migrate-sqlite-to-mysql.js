const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

// 读取 SQLite 数据库（使用 Prisma 的 queryRaw 方式）
async function exportFromSQLite() {
  console.log('📤 正在从 SQLite 导出数据...\n');

  // 临时设置环境变量为 SQLite
  const originalEnv = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'file:./prisma/dev.db';

  // 清理 require 缓存，重新加载 Prisma
  delete require.cache[require.resolve('@prisma/client')];
  delete require.cache[require.resolve('../node_modules/.prisma/client/index.js')];

  const { PrismaClient: SQLitePrisma } = require('@prisma/client');
  const sqlite = new SQLitePrisma();

  try {
    const data = {
      categories: await sqlite.category.findMany(),
      subCategories: await sqlite.subCategory.findMany(),
      useCases: await sqlite.useCase.findMany(),
      tools: await sqlite.tool.findMany(),
      news: await sqlite.news.findMany(),
      siteSettings: await sqlite.siteSetting.findMany(),
      quickLinks: await sqlite.quickLink.findMany(),
    };

    console.log('SQLite 数据统计:');
    console.log(`  📁 分类: ${data.categories.length}`);
    console.log(`  📂 子分类: ${data.subCategories.length}`);
    console.log(`  🎯 使用场景: ${data.useCases.length}`);
    console.log(`  🛠️ 工具: ${data.tools.length}`);
    console.log(`  📰 资讯: ${data.news.length}`);
    console.log(`  ⚙️ 站点设置: ${data.siteSettings.length}`);
    console.log(`  🔗 快捷链接: ${data.quickLinks.length}`);

    fs.writeFileSync('sqlite_export.json', JSON.stringify(data, null, 2));
    console.log('\n✅ 数据已导出到 sqlite_export.json');

    return data;
  } finally {
    await sqlite.$disconnect();
    process.env.DATABASE_URL = originalEnv;
  }
}

// 导入到 MySQL
async function importToMySQL(data) {
  console.log('\n📥 正在导入到 MySQL...\n');

  // 恢复 MySQL 连接
  process.env.DATABASE_URL = 'mysql://root:123456@localhost:3306/ai_tools';
  delete require.cache[require.resolve('@prisma/client')];

  const { PrismaClient: MySQLPrisma } = require('@prisma/client');
  const mysql = new MySQLPrisma();

  try {
    // 清空现有数据（保留用户数据）
    console.log('清理现有数据...');
    await mysql.$transaction([
      mysql.review.deleteMany(),
      mysql.toolToCourse.deleteMany(),
      mysql.news.deleteMany(),
      mysql.tool.deleteMany(),
      mysql.subCategory.deleteMany(),
      mysql.category.deleteMany(),
      mysql.useCase.deleteMany(),
      mysql.quickLink.deleteMany(),
      mysql.siteSetting.deleteMany(),
    ]);

    console.log('导入新数据...\n');

    // 按顺序导入（注意外键依赖）
    if (data.useCases.length) {
      await mysql.useCase.createMany({ data: data.useCases, skipDuplicates: true });
      console.log(`✅ 使用场景: ${data.useCases.length}`);
    }

    if (data.categories.length) {
      await mysql.category.createMany({ data: data.categories, skipDuplicates: true });
      console.log(`✅ 分类: ${data.categories.length}`);
    }

    if (data.subCategories.length) {
      await mysql.subCategory.createMany({ data: data.subCategories, skipDuplicates: true });
      console.log(`✅ 子分类: ${data.subCategories.length}`);
    }

    if (data.tools.length) {
      await mysql.tool.createMany({ data: data.tools, skipDuplicates: true });
      console.log(`✅ 工具: ${data.tools.length}`);
    }

    if (data.news.length) {
      await mysql.news.createMany({ data: data.news, skipDuplicates: true });
      console.log(`✅ 资讯: ${data.news.length}`);
    }

    if (data.quickLinks.length) {
      await mysql.quickLink.createMany({ data: data.quickLinks, skipDuplicates: true });
      console.log(`✅ 快捷链接: ${data.quickLinks.length}`);
    }

    if (data.siteSettings.length) {
      await mysql.siteSetting.createMany({ data: data.siteSettings, skipDuplicates: true });
      console.log(`✅ 站点设置: ${data.siteSettings.length}`);
    }

    console.log('\n🎉 数据迁移完成！');
  } catch (error) {
    console.error('❌ 导入失败:', error.message);
    throw error;
  } finally {
    await mysql.$disconnect();
  }
}

// 主函数
async function main() {
  console.log('========================================');
  console.log('   SQLite → MySQL 数据迁移工具');
  console.log('========================================\n');

  const data = await exportFromSQLite();

  // 确认差异
  const mysqlTools = 20; // 当前 MySQL 中的工具数
  if (data.tools.length <= mysqlTools) {
    console.log(`\n⚠️ 警告: SQLite 中只有 ${data.tools.length} 个工具`);
    console.log('   可能没有更多测试数据需要迁移\n');
    return;
  }

  console.log(`\n检测到 ${data.tools.length - mysqlTools} 个新增工具`);
  console.log('开始迁移...\n');

  await importToMySQL(data);
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
