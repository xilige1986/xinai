const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportData() {
  const data = {};

  // 1. 分类数据
  console.log('导出 Category...');
  data.categories = await prisma.category.findMany();

  // 2. 子分类数据
  console.log('导出 SubCategory...');
  data.subCategories = await prisma.subCategory.findMany();

  // 3. 使用场景
  console.log('导出 UseCase...');
  data.useCases = await prisma.useCase.findMany();

  // 4. 工具数据
  console.log('导出 Tool...');
  data.tools = await prisma.tool.findMany();

  // 5. 课程数据
  console.log('导出 Course...');
  data.courses = await prisma.course.findMany();

  // 6. 章节数据
  console.log('导出 Chapter...');
  data.chapters = await prisma.chapter.findMany();

  // 7. 课时数据
  console.log('导出 Lesson...');
  data.lessons = await prisma.lesson.findMany();

  // 8. 资讯数据
  console.log('导出 News...');
  data.news = await prisma.news.findMany();

  // 9. 快捷入口
  console.log('导出 QuickLink...');
  data.quickLinks = await prisma.quickLink.findMany();

  // 10. 网站设置
  console.log('导出 SiteSetting...');
  data.siteSettings = await prisma.siteSetting.findMany();

  // 11. 赞助商
  console.log('导出 Sponsor...');
  data.sponsors = await prisma.sponsor.findMany();

  // 12. AI内容
  console.log('导出 ToolAIContent...');
  data.toolAIContents = await prisma.toolAIContent.findMany();

  // 保存到文件
  fs.writeFileSync('/tmp/ai_tools_export.json', JSON.stringify(data, null, 2));

  console.log('\n✅ 导出完成！');
  console.log('文件位置: /tmp/ai_tools_export.json');
  console.log('\n数据量统计:');
  console.log(`  分类: ${data.categories.length}`);
  console.log(`  子分类: ${data.subCategories.length}`);
  console.log(`  使用场景: ${data.useCases.length}`);
  console.log(`  工具: ${data.tools.length}`);
  console.log(`  课程: ${data.courses.length}`);
  console.log(`  章节: ${data.chapters.length}`);
  console.log(`  课时: ${data.lessons.length}`);
  console.log(`  资讯: ${data.news.length}`);
  console.log(`  快捷入口: ${data.quickLinks.length}`);
  console.log(`  网站设置: ${data.siteSettings.length}`);
  console.log(`  赞助商: ${data.sponsors.length}`);
  console.log(`  AI内容: ${data.toolAIContents.length}`);
}

exportData().catch(console.error).finally(() => prisma.$disconnect());
