/**
 * SQLite 到 MySQL 迁移脚本（Node.js 版本）
 * 使用方法: node scripts/migrate-to-mysql.js
 */

const { PrismaClient } = require('@prisma/client');
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

// 配置
const SQLITE_DB_PATH = process.env.SQLITE_DB || './prisma/dev.db';
const MYSQL_URL = process.env.MYSQL_DATABASE_URL || 'mysql://root@localhost:3306/ai_tools_platform';

// 数据转换映射
const transformers = {
  // Boolean 转换
  boolean: (val) => val ? 1 : 0,

  // JSON 转换
  json: (val) => {
    if (!val) return null;
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
    return val;
  },

  // 日期转换
  datetime: (val) => {
    if (!val) return null;
    return new Date(val);
  },

  // Float 转 Int（金额，单位：分）
  moneyToCents: (val) => {
    if (val === null || val === undefined) return 0;
    return Math.round(parseFloat(val) * 100);
  }
};

// 表迁移顺序（按外键依赖）
const migrationOrder = [
  'Category',
  'SubCategory',
  'UseCase',
  'Tool',
  'User',
  'Course',
  'Chapter',
  'Lesson',
  'News',
  'Review',
  'Comment',
  'QuickLink',
  'SiteSetting',
  'NewsletterSubscriber',
  'NewsletterSchedule',
  'NewsletterHistory',
  'CoursePointsAccess',
  'LessonProgress',
  'Order',
  'ReferralRecord',
  'MultiLevelReferralRecord',
  'PointsLog',
  'VerificationCode',
  'FounderEarning',
  'FounderContribution',
];

// 字段映射和转换规则
const fieldMappings = {
  Tool: {
    // SQLite Float -> MySQL Int（分）
    // pricingType 已经是 String，无需转换
  },
  Course: {
    // SQLite Float price -> MySQL Int（分）
    price: 'moneyToCents',
    originalPrice: 'moneyToCents',
    // JSON 字段
    whatYouWillLearn: 'json',
    outline: 'json',
    includes: 'json',
  },
  News: {
    tags: 'json',
  },
  User: {
    membership: (val) => {
      // String 转 Int
      const map = { MEMBER: 1, VIP: 2, FOUNDER: 3 };
      return map[val] || 1;
    },
  },
  FounderEarning: {
    amount: 'moneyToCents',
  },
  Order: {
    amount: 'moneyToCents',
  },
};

async function migrate() {
  console.log('========================================');
  console.log('  SQLite 到 MySQL 数据迁移');
  console.log('========================================\n');

  // 连接 SQLite
  console.log('[1/4] 连接 SQLite 数据库...');
  const sqliteDb = new sqlite3.Database(SQLITE_DB_PATH);
  const sqliteQuery = promisify(sqliteDb.all.bind(sqliteDb));
  console.log('✓ SQLite 连接成功\n');

  // 连接 MySQL（通过 Prisma）
  console.log('[2/4] 连接 MySQL 数据库...');
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: MYSQL_URL,
      },
    },
  });
  console.log('✓ MySQL 连接成功\n');

  // 清空 MySQL 数据
  console.log('[3/4] 准备 MySQL 数据库...');
  console.log('注意: 这将清空目标数据库的所有数据！');

  // 按相反顺序清空（避免外键冲突）
  const clearOrder = [...migrationOrder].reverse();
  for (const table of clearOrder) {
    try {
      await prisma[table.toLowerCase()].deleteMany();
      console.log(`  ✓ 清空 ${table}`);
    } catch (e) {
      console.log(`  ⚠ ${table} 清空失败（可能不存在或有关联数据）`);
    }
  }
  console.log('');

  // 迁移数据
  console.log('[4/4] 迁移数据...\n');

  const stats = {};

  for (const table of migrationOrder) {
    console.log(`迁移 ${table}...`);

    try {
      // 从 SQLite 读取数据
      const rows = await sqliteQuery(`SELECT * FROM "${table}"`);

      if (rows.length === 0) {
        console.log(`  → 无数据\n`);
        continue;
      }

      // 转换数据
      const mappings = fieldMappings[table] || {};
      const transformedRows = rows.map(row => {
        const newRow = { ...row };

        for (const [field, transformer] of Object.entries(mappings)) {
          if (newRow[field] !== undefined) {
            if (typeof transformer === 'function') {
              newRow[field] = transformer(newRow[field]);
            } else if (transformers[transformer]) {
              newRow[field] = transformers[transformer](newRow[field]);
            }
          }
        }

        // 处理布尔值（SQLite 用 0/1，MySQL 也用 0/1）
        for (const [key, val] of Object.entries(newRow)) {
          if (val === true) newRow[key] = 1;
          if (val === false) newRow[key] = 0;
        }

        return newRow;
      });

      // 批量插入 MySQL
      const batchSize = 100;
      for (let i = 0; i < transformedRows.length; i += batchSize) {
        const batch = transformedRows.slice(i, i + batchSize);

        // 使用 Prisma createMany
        await prisma[table.toLowerCase()].createMany({
          data: batch,
          skipDuplicates: true,
        });
      }

      stats[table] = transformedRows.length;
      console.log(`  ✓ 迁移 ${transformedRows.length} 条记录\n`);

    } catch (error) {
      console.error(`  ✗ 迁移失败: ${error.message}\n`);
      stats[table] = 0;
    }
  }

  // 关闭连接
  sqliteDb.close();
  await prisma.$disconnect();

  // 输出统计
  console.log('========================================');
  console.log('  迁移完成！');
  console.log('========================================\n');

  console.log('迁移统计:');
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  for (const [table, count] of Object.entries(stats)) {
    console.log(`  ${table}: ${count} 条`);
  }
  console.log(`\n总计: ${total} 条记录\n`);

  console.log('下一步:');
  console.log('  1. 验证数据完整性');
  console.log('  2. 更新 .env 中的 DATABASE_URL');
  console.log('  3. 重新生成 Prisma 客户端: npx prisma generate');
  console.log('  4. 测试应用功能\n');
}

migrate().catch(e => {
  console.error('迁移失败:', e);
  process.exit(1);
});
