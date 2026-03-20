const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Adding isAggregated column to News table...');

  try {
    // Try to add isAggregated column (ignore error if already exists)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`News\` ADD COLUMN \`isAggregated\` BOOLEAN NOT NULL DEFAULT false
    `);
    console.log('Added isAggregated column');
  } catch (e) {
    if (e.message?.includes('Duplicate column name')) {
      console.log('isAggregated column already exists, skipping...');
    } else {
      throw e;
    }
  }

  try {
    // Try to add index (ignore error if already exists)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX \`News_isAggregated_idx\` ON \`News\`(\`isAggregated\`)
    `);
    console.log('Added News_isAggregated_idx index');
  } catch (e) {
    if (e.message?.includes('Duplicate key name')) {
      console.log('Index already exists, skipping...');
    } else {
      throw e;
    }
  }

  try {
    // Make content nullable
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`News\` MODIFY COLUMN \`content\` LONGTEXT NULL
    `);
    console.log('Modified content column to nullable');
  } catch (e) {
    console.log('Note: content column modification may have issues:', e.message);
  }

  console.log('Migration completed!');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
