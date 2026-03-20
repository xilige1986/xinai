import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始填充资讯数据...');

  const newsData = [
    {
      title: 'OpenAI GPT-5 即将发布：多模态能力大幅提升',
      slug: 'openai-gpt5-release',
      summary: '据内部消息，OpenAI 计划在下季度发布 GPT-5，新版本在多模态理解和推理能力上将有质的飞跃。',
      content: `<p>据可靠消息来源，OpenAI 正在紧锣密鼓地准备 GPT-5 的发布工作。这款备受期待的下一代大语言模型预计将在下个季度正式亮相。</p>

<h2>主要升级亮点</h2>
<p>GPT-5 将原生支持文本、图像、音频和视频的综合理解。用户可以直接上传一段视频，模型能够理解视频内容并进行深度分析。</p>
<p>在复杂的数学推理和逻辑推理任务上，GPT-5 的表现预计将比 GPT-4 提升 40% 以上。</p>`,
      category: 'AI资讯',
      tags: JSON.stringify(['OpenAI', 'GPT-5', '大模型', '多模态']),
      author: 'AI观察员',
      source: 'TechCrunch',
      sourceUrl: 'https://techcrunch.com',
      status: 1,
      isHot: true,
      views: 12580,
      likes: 342,
    },
    {
      title: 'Google DeepMind 发布 Gemini 2.0：挑战 GPT-4',
      slug: 'google-gemini-2-release',
      summary: 'Google 推出 Gemini 2.0 系列模型，在多个基准测试中超越了 GPT-4。',
      content: `<p>Google DeepMind 今日正式发布了 Gemini 2.0 系列模型。新模型在多项基准测试中表现优异。</p>

<h2>三种版本</h2>
<p>Gemini 2.0 Ultra - 最强大的版本</p>
<p>Gemini 2.0 Pro - 平衡性能和成本</p>
<p>Gemini 2.0 Nano - 轻量级版本</p>`,
      category: 'AI资讯',
      tags: JSON.stringify(['Google', 'Gemini', 'DeepMind']),
      author: '科技前沿',
      source: 'The Verge',
      sourceUrl: 'https://theverge.com',
      status: 1,
      isHot: true,
      views: 8960,
      likes: 256,
    },
    {
      title: 'Midjourney V7 发布：AI 绘画进入照片级时代',
      slug: 'midjourney-v7-release',
      summary: 'Midjourney 推出 V7 版本，图像生成质量达到新高度。',
      content: `<p>Midjourney 今日发布了 V7 版本。新版本支持直接生成 4K 分辨率的图像。</p>

<h2>核心技术升级</h2>
<p>超分辨率生成、智能构图、风格迁移等功能大幅增强。</p>`,
      category: 'AI绘画',
      tags: JSON.stringify(['Midjourney', 'AI绘画', '图像生成']),
      author: 'AI艺术观察',
      source: 'Midjourney Blog',
      sourceUrl: 'https://midjourney.com',
      status: 1,
      isHot: true,
      views: 15230,
      likes: 521,
    },
  ];

  for (const newsItem of newsData) {
    const news = await prisma.news.upsert({
      where: { slug: newsItem.slug },
      update: {},
      create: {
        ...newsItem,
        publishedAt: new Date(),
      },
    });
    console.log(`✅ 资讯创建: ${news.title}`);
  }

  console.log(`\n🎉 共创建 ${newsData.length} 条资讯！`);
}

main()
  .catch((e) => {
    console.error('❌ Seed失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
