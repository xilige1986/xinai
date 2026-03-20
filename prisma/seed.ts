import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始填充数据库...');

  // 1. 创建管理员用户
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@aitools.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ 管理员用户创建完成:', admin.username);

  // 2. 创建AI工具主分类（一级分类）
  const categoriesData = [
    {
      name: 'AI生产力',
      slug: 'ai-productivity',
      description: '提升工作效率的AI工具，包括文档处理、任务管理、会议助手等',
      icon: 'Zap',
      sortOrder: 1,
      subCategories: [
        { name: '文档处理', slug: 'document' },
        { name: '任务管理', slug: 'task-management' },
        { name: '会议助手', slug: 'meeting' },
        { name: '笔记工具', slug: 'note-taking' },
        { name: '日程安排', slug: 'scheduling' },
      ],
    },
    {
      name: 'AI视频',
      slug: 'ai-video',
      description: '视频生成、编辑、剪辑等AI视频处理工具',
      icon: 'Video',
      sortOrder: 2,
      subCategories: [
        { name: '视频生成', slug: 'video-generation' },
        { name: '视频编辑', slug: 'video-editing' },
        { name: '数字人', slug: 'digital-human' },
        { name: '视频剪辑', slug: 'video-clipping' },
        { name: '特效制作', slug: 'video-effects' },
      ],
    },
    {
      name: 'AI文本',
      slug: 'ai-text',
      description: '文本生成、写作辅助、内容创作等AI写作工具',
      icon: 'FileText',
      sortOrder: 3,
      subCategories: [
        { name: '写作助手', slug: 'writing' },
        { name: '文案生成', slug: 'copywriting' },
        { name: '论文辅助', slug: 'academic' },
        { name: '翻译工具', slug: 'translation' },
        { name: '内容改写', slug: 'rewriting' },
      ],
    },
    {
      name: 'AI商业',
      slug: 'ai-business',
      description: '商业分析、营销、销售等商业领域AI工具',
      icon: 'Briefcase',
      sortOrder: 4,
      subCategories: [
        { name: '市场分析', slug: 'market-analysis' },
        { name: '广告投放', slug: 'advertising' },
        { name: '客户管理', slug: 'crm' },
        { name: '数据分析', slug: 'data-analysis' },
        { name: '商业智能', slug: 'business-intelligence' },
      ],
    },
    {
      name: 'AI图像',
      slug: 'ai-image',
      description: '图像生成、编辑、设计等AI图像处理工具',
      icon: 'Image',
      sortOrder: 5,
      subCategories: [
        { name: 'AI绘画', slug: 'ai-painting' },
        { name: '图像编辑', slug: 'image-editing' },
        { name: 'Logo设计', slug: 'logo-design' },
        { name: '海报制作', slug: 'poster' },
        { name: '图像修复', slug: 'image-restoration' },
      ],
    },
    {
      name: 'AI自动化',
      slug: 'ai-automation',
      description: '流程自动化、RPA、智能审批等自动化工具',
      icon: 'Settings',
      sortOrder: 6,
      subCategories: [
        { name: '流程自动化', slug: 'workflow' },
        { name: 'RPA机器人', slug: 'rpa' },
        { name: '智能审批', slug: 'approval' },
        { name: '数据同步', slug: 'data-sync' },
        { name: '任务调度', slug: 'task-scheduler' },
      ],
    },
    {
      name: 'AI艺术',
      slug: 'ai-art',
      description: '艺术创作、风格迁移、艺术设计等创意工具',
      icon: 'Palette',
      sortOrder: 7,
      subCategories: [
        { name: '艺术创作', slug: 'art-creation' },
        { name: '风格迁移', slug: 'style-transfer' },
        { name: '插画生成', slug: 'illustration' },
        { name: '3D建模', slug: '3d-modeling' },
        { name: '概念设计', slug: 'concept-design' },
      ],
    },
    {
      name: 'AI音频',
      slug: 'ai-audio',
      description: '音频生成、音乐创作、语音合成等音频AI工具',
      icon: 'Music',
      sortOrder: 8,
      subCategories: [
        { name: '语音合成', slug: 'tts' },
        { name: '音乐生成', slug: 'music-generation' },
        { name: '声音克隆', slug: 'voice-clone' },
        { name: '音频编辑', slug: 'audio-editing' },
        { name: '降噪处理', slug: 'noise-reduction' },
      ],
    },
    {
      name: 'AI编程',
      slug: 'ai-coding',
      description: '代码生成、代码审查、开发辅助等编程AI工具',
      icon: 'Code',
      sortOrder: 9,
      subCategories: [
        { name: '代码生成', slug: 'code-generation' },
        { name: '代码审查', slug: 'code-review' },
        { name: 'Bug修复', slug: 'bug-fix' },
        { name: '自动化测试', slug: 'automation-testing' },
        { name: 'API开发', slug: 'api-development' },
      ],
    },
    {
      name: '其他AI',
      slug: 'ai-other',
      description: '其他未分类的AI工具和创新应用',
      icon: 'Sparkles',
      sortOrder: 10,
      subCategories: [
        { name: 'AI搜索', slug: 'ai-search' },
        { name: 'AI聊天', slug: 'ai-chat' },
        { name: 'AI学习', slug: 'ai-learning' },
        { name: 'AI健康', slug: 'ai-health' },
        { name: 'AI游戏', slug: 'ai-gaming' },
      ],
    },
  ];

  const categories = [];
  for (const catData of categoriesData) {
    const { subCategories, ...catInfo } = catData;

    const category = await prisma.category.upsert({
      where: { slug: catInfo.slug },
      update: {},
      create: catInfo,
    });

    // 创建二级分类
    const subCats = [];
    for (const subCat of subCategories) {
      const subCategory = await prisma.subCategory.upsert({
        where: { categoryId_slug: { categoryId: category.id, slug: subCat.slug } },
        update: {},
        create: {
          ...subCat,
          categoryId: category.id,
        },
      });
      subCats.push(subCategory);
    }

    categories.push({ ...category, subCategories: subCats });
    console.log(`✅ 分类创建: ${category.name} (${subCategories.length}个子分类)`);
  }

  // 3. 创建使用场景（原来的业务职能）
  const useCasesData = [
    { name: '客户服务与支持', slug: 'customer-service', description: '提升客户体验的AI客服工具', adoptionRate: 78.5 },
    { name: '销售', slug: 'sales', description: '智能销售助手与CRM工具', adoptionRate: 65.2 },
    { name: '后勤', slug: 'logistics', description: '供应链与库存管理AI', adoptionRate: 45.8 },
    { name: '运营', slug: 'operations', description: '流程自动化与效率工具', adoptionRate: 72.3 },
    { name: '增长与市场营销', slug: 'marketing', description: '内容创作与广告投放AI', adoptionRate: 85.6 },
    { name: '写作与编辑', slug: 'writing', description: '文案创作与校对工具', adoptionRate: 92.1 },
    { name: '技术', slug: 'technology', description: '代码生成与开发辅助', adoptionRate: 88.4 },
    { name: '设计与创意', slug: 'design', description: 'AI绘画与设计工具', adoptionRate: 76.9 },
    { name: '工作流程自动化', slug: 'automation', description: 'RPA与自动化工作流', adoptionRate: 58.7 },
  ];

  const useCases = [];
  for (const ucData of useCasesData) {
    const useCase = await prisma.useCase.upsert({
      where: { slug: ucData.slug },
      update: {},
      create: ucData,
    });
    useCases.push(useCase);
    console.log(`✅ 使用场景创建: ${useCase.name} (采用率: ${useCase.adoptionRate}%)`);
  }

  // 4. 创建工具（关联新的分类体系）
  const toolsData = [
    // AI文本类工具
    {
      name: '墨写AI',
      slug: 'moxie-ai',
      shortDesc: '中文写作助手，提供写作建议、润色和错别字检查',
      description: '墨写AI是专为中文写作打造的AI助手。它不仅能检查错别字和语法错误，还能理解上下文语境，提供更地道的表达建议。',
      websiteUrl: 'https://moxie-ai.example.com',
      pricingType: 'Freemium',
      categorySlug: 'ai-text',
      subCategorySlug: 'writing',
      useCaseSlug: 'writing',
    },
    {
      name: '文案生成器Pro',
      slug: 'wenan-generator',
      shortDesc: 'AI驱动的营销文案创作，支持多平台',
      description: '文案生成器Pro是专为中国市场打造的营销文案AI工具。可生成小红书、公众号、抖音等平台文案。',
      websiteUrl: 'https://wenan-generator.example.com',
      pricingType: 'Freemium',
      categorySlug: 'ai-text',
      subCategorySlug: 'copywriting',
      useCaseSlug: 'marketing',
    },
    // AI图像类工具
    {
      name: '画境AI',
      slug: 'huajing-ai',
      shortDesc: '中文语义理解的AI绘画工具，支持多种艺术风格',
      description: '画境AI是专为中文用户优化的AI绘画平台。支持水墨画、工笔画、赛博朋克、二次元等数十种艺术风格。',
      websiteUrl: 'https://huajing-ai.example.com',
      pricingType: 'Freemium',
      categorySlug: 'ai-image',
      subCategorySlug: 'ai-painting',
      useCaseSlug: 'design',
    },
    {
      name: 'LogoMaster',
      slug: 'logomaster',
      shortDesc: 'AI Logo设计工具，快速生成专业品牌标识',
      description: 'LogoMaster利用AI技术，根据品牌名称和行业特点自动生成专业Logo设计方案。',
      websiteUrl: 'https://logomaster.example.com',
      pricingType: 'Paid',
      categorySlug: 'ai-image',
      subCategorySlug: 'logo-design',
      useCaseSlug: 'design',
    },
    // AI视频类工具
    {
      name: 'VideoCraft',
      slug: 'videocraft',
      shortDesc: 'AI视频生成与剪辑，文本转视频、智能剪辑',
      description: 'VideoCraft让视频创作变得简单高效。输入文字脚本即可生成完整视频。',
      websiteUrl: 'https://videocraft.example.com',
      pricingType: 'Paid',
      categorySlug: 'ai-video',
      subCategorySlug: 'video-generation',
      useCaseSlug: 'marketing',
    },
    {
      name: '数字人工厂',
      slug: 'digital-human-factory',
      shortDesc: 'AI数字人生成，打造专属虚拟形象',
      description: '数字人工厂可以创建逼真的AI虚拟人，支持自定义形象和声音，适用于直播、客服等场景。',
      websiteUrl: 'https://digital-human.example.com',
      pricingType: 'Paid',
      categorySlug: 'ai-video',
      subCategorySlug: 'digital-human',
      useCaseSlug: 'customer-service',
    },
    // AI编程类工具
    {
      name: 'CodePilot',
      slug: 'codepilot',
      shortDesc: 'AI编程助手，代码补全、Bug修复、代码审查',
      description: 'CodePilot是开发者的AI编程伙伴。提供智能代码补全、自动Bug修复、代码重构建议等功能。',
      websiteUrl: 'https://codepilot.example.com',
      pricingType: 'Freemium',
      categorySlug: 'ai-coding',
      subCategorySlug: 'code-generation',
      useCaseSlug: 'technology',
    },
    {
      name: 'TestGenius',
      slug: 'test-genius',
      shortDesc: '自动化测试生成，智能发现代码问题',
      description: 'TestGenius利用AI技术自动生成全面的测试用例，支持单元测试、集成测试等多种类型。',
      websiteUrl: 'https://test-genius.example.com',
      pricingType: 'Paid',
      categorySlug: 'ai-coding',
      subCategorySlug: 'automation-testing',
      useCaseSlug: 'technology',
    },
    // AI生产力工具
    {
      name: '会议助手AI',
      slug: 'meeting-assistant',
      shortDesc: '智能会议记录、摘要生成、待办提取',
      description: '会议助手AI可以实时转录会议内容，自动生成会议纪要，提取关键决策和行动项。',
      websiteUrl: 'https://meeting-ai.example.com',
      pricingType: 'Freemium',
      categorySlug: 'ai-productivity',
      subCategorySlug: 'meeting',
      useCaseSlug: 'operations',
    },
    {
      name: '智能日程管家',
      slug: 'smart-scheduler',
      shortDesc: 'AI日程管理，智能安排会议和任务时间',
      description: '智能日程管家分析你的工作习惯和优先级，自动安排最优的日程计划。',
      websiteUrl: 'https://smart-scheduler.example.com',
      pricingType: 'Paid',
      categorySlug: 'ai-productivity',
      subCategorySlug: 'scheduling',
      useCaseSlug: 'operations',
    },
    // AI商业工具
    {
      name: 'SalesPredict',
      slug: 'salespredict',
      shortDesc: 'AI销售预测引擎，精准预测成交概率',
      description: 'SalesPredict通过分析历史销售数据和客户行为模式，帮助销售团队预测每笔交易的成交概率。',
      websiteUrl: 'https://salespredict.example.com',
      pricingType: 'Paid',
      categorySlug: 'ai-business',
      subCategorySlug: 'crm',
      useCaseSlug: 'sales',
    },
    {
      name: 'AdOptimizer',
      slug: 'ad-optimizer',
      shortDesc: '智能广告投放优化，自动调整出价和受众',
      description: 'AdOptimizer是一款AI驱动的广告投放优化工具，支持巨量引擎、腾讯广告等平台。',
      websiteUrl: 'https://ad-optimizer.example.com',
      pricingType: 'Paid',
      categorySlug: 'ai-business',
      subCategorySlug: 'advertising',
      useCaseSlug: 'marketing',
    },
    // AI自动化工具
    {
      name: '流程机器人',
      slug: 'liucheng-robot',
      shortDesc: 'RPA+AI智能流程自动化',
      description: '流程机器人结合RPA和AI技术，可自动执行各种重复性办公任务。',
      websiteUrl: 'https://liucheng-robot.example.com',
      pricingType: 'Freemium',
      categorySlug: 'ai-automation',
      subCategorySlug: 'rpa',
      useCaseSlug: 'automation',
    },
    {
      name: '智能审批助手',
      slug: 'shenpi-assistant',
      shortDesc: '智能审批流程，自动审核单据',
      description: '审批助手将AI技术引入企业审批流程，自动识别和提取各类单据的关键信息。',
      websiteUrl: 'https://shenpi-assistant.example.com',
      pricingType: 'Paid',
      categorySlug: 'ai-automation',
      subCategorySlug: 'approval',
      useCaseSlug: 'operations',
    },
    // AI音频工具
    {
      name: '语音合成大师',
      slug: 'tts-master',
      shortDesc: '高质量AI语音合成，多种音色可选',
      description: '语音合成大师提供自然流畅的AI语音，支持多种语言和情感风格。',
      websiteUrl: 'https://tts-master.example.com',
      pricingType: 'Freemium',
      categorySlug: 'ai-audio',
      subCategorySlug: 'tts',
      useCaseSlug: 'customer-service',
    },
    {
      name: 'AI作曲助手',
      slug: 'ai-music-composer',
      shortDesc: 'AI音乐生成，根据情绪风格创作原创音乐',
      description: 'AI作曲助手可以根据你指定的风格、情绪和场景，自动生成原创音乐作品。',
      websiteUrl: 'https://ai-music.example.com',
      pricingType: 'Paid',
      categorySlug: 'ai-audio',
      subCategorySlug: 'music-generation',
      useCaseSlug: 'design',
    },
    // AI艺术工具
    {
      name: '风格迁移大师',
      slug: 'style-transfer-master',
      shortDesc: '艺术风格迁移，将照片转为名画风格',
      description: '风格迁移大师可以将普通照片转换为梵高、毕加索等大师的艺术风格。',
      websiteUrl: 'https://style-transfer.example.com',
      pricingType: 'Freemium',
      categorySlug: 'ai-art',
      subCategorySlug: 'style-transfer',
      useCaseSlug: 'design',
    },
    {
      name: '3D创意工坊',
      slug: '3d-creative-studio',
      shortDesc: 'AI辅助3D建模，快速创建三维模型',
      description: '3D创意工坊利用AI技术，将2D草图或文字描述转换为3D模型。',
      websiteUrl: 'https://3d-studio.example.com',
      pricingType: 'Paid',
      categorySlug: 'ai-art',
      subCategorySlug: '3d-modeling',
      useCaseSlug: 'design',
    },
    // 其他AI工具
    {
      name: '智搜AI',
      slug: 'zhisou-ai',
      shortDesc: '智能搜索引擎，理解意图直接给出答案',
      description: '智搜AI不同于传统搜索引擎，它能理解你的问题直接给出答案。',
      websiteUrl: 'https://zhisou-ai.example.com',
      pricingType: 'Freemium',
      categorySlug: 'ai-other',
      subCategorySlug: 'ai-search',
      useCaseSlug: 'technology',
    },
    {
      name: 'AI健身教练',
      slug: 'ai-fitness-coach',
      shortDesc: '个性化AI健身指导和饮食建议',
      description: 'AI健身教练根据你的身体状况和目标，制定个性化的训练和饮食计划。',
      websiteUrl: 'https://ai-fitness.example.com',
      pricingType: 'Freemium',
      categorySlug: 'ai-other',
      subCategorySlug: 'ai-health',
      useCaseSlug: 'operations',
    },
  ];

  const createdTools = [];
  for (const toolData of toolsData) {
    const { categorySlug, subCategorySlug, useCaseSlug, ...toolInfo } = toolData;

    // 查找关联
    const category = categories.find(c => c.slug === categorySlug);
    const subCategory = category?.subCategories.find(s => s.slug === subCategorySlug);
    const useCase = useCases.find(u => u.slug === useCaseSlug);

    if (!category || !useCase) {
      console.warn(`⚠️ 未找到分类或使用场景: ${toolInfo.name}`);
      continue;
    }

    const tool = await prisma.tool.upsert({
      where: { slug: toolInfo.slug },
      update: {},
      create: {
        ...toolInfo,
        status: 1,
        categoryId: category.id,
        subCategoryId: subCategory?.id || null,
        useCaseId: useCase.id,
        views: Math.floor(Math.random() * 5000) + 100,
        likes: Math.floor(Math.random() * 500) + 10,
      },
    });
    createdTools.push(tool);
    console.log(`✅ 工具创建: ${tool.name} (${category.name} / ${useCase.name})`);
  }

  // 5. 创建课程并关联工具
  const courseData = {
    title: 'AI工具赋能职场：从入门到精通实战课',
    slug: 'ai-tools-masterclass',
    description: `这是一门系统性的AI工具应用课程，专为希望提升工作效率的职场人士设计。

课程内容涵盖：
• AI写作工具实战：掌握文案生成、内容优化
• AI设计工具应用：快速产出高质量视觉内容
• 智能办公自动化：RPA流程搭建与数据处理
• AI辅助决策：数据分析与商业洞察

通过本课程，你将学会如何将AI工具融入日常工作流程，实现10倍效率提升。`,
    coverImage: '/uploads/courses/ai-masterclass-cover.jpg',
    price: 299.00,
    buyUrl: 'https://example.com/buy/ai-masterclass',
    level: 'Beginner',
    studentCount: 1258,
    status: 1,
  };

  // 关联墨写AI和文案生成器Pro
  const relatedTools = createdTools.filter(t =>
    ['moxie-ai', 'wenan-generator'].includes(t.slug)
  );

  const course = await prisma.course.upsert({
    where: { slug: courseData.slug },
    update: {},
    create: {
      ...courseData,
      tools: {
        connect: relatedTools.map(t => ({ id: t.id })),
      },
    },
  });

  console.log(`✅ 课程创建: ${course.title}`);
  console.log(`   关联工具: ${relatedTools.map(t => t.name).join(', ')}`);

  console.log('\n🎉 数据库填充完成！');
  console.log(`📊 统计: ${categories.length}个主分类, ${useCases.length}个使用场景, ${createdTools.length}个工具, 1个课程`);
}

main()
  .catch((e) => {
    console.error('❌ Seed失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
