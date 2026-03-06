const { prisma } = require('./src/lib/db');

async function checkSubCategories() {
  console.log('=== 子分类列表 ===');
  const subCategories = await prisma.subCategory.findMany({
    include: {
      category: true,
      _count: { select: { tools: true } },
    },
  });

  subCategories.forEach((sub) => {
    console.log(`${sub.id}: ${sub.name} (所属分类: ${sub.category.name}, 工具数: ${sub._count.tools})`);
  });

  console.log('\n=== 各分类下的子分类 ===');
  const categories = await prisma.category.findMany({
    include: {
      subCategories: true,
    },
  });

  categories.forEach((cat) => {
    console.log(`\n${cat.name}:`);
    cat.subCategories.forEach((sub) => {
      console.log(`  - ${sub.name}`);
    });
  });
}

checkSubCategories()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
