import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { slugify } from '@/lib/slugify';

// 贡献积分配置
const CONTRIBUTION_POINTS = {
  NEWS: 5,    // 发布资讯 +5 积分
  TOOL: 3,    // 提交工具 +3 积分
  REVIEW: 1,  // 评论/点评 +1 积分
};

// 提交资讯（创始股东）
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const userMembership = (session.user as any).membership || 'MEMBER';

    const body = await request.json();
    const { type } = body;

    if (!type || !['NEWS', 'TOOL', 'REVIEW'].includes(type)) {
      return NextResponse.json({ error: '无效的提交类型' }, { status: 400 });
    }

    // 根据类型处理不同的提交
    switch (type) {
      case 'NEWS':
        return await submitNews(userId, userMembership, body);
      case 'TOOL':
        return await submitTool(userId, userMembership, body);
      case 'REVIEW':
        return await submitReview(userId, userMembership, body);
      default:
        return NextResponse.json({ error: '无效的提交类型' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Submit contribution error:', error);
    return NextResponse.json({ error: '提交失败' }, { status: 500 });
  }
}

// 提交资讯
async function submitNews(userId: number, userMembership: string, data: any) {
  const { title, slug: providedSlug, summary, content, coverImage, category, tags, source, sourceUrl } = data;

  if (!title || !content) {
    return NextResponse.json({ error: '标题和内容不能为空' }, { status: 400 });
  }

  // 使用前端提供的slug或生成slug
  let slug: string;
  if (providedSlug) {
    slug = await generateUniqueSlug(providedSlug, 'news', true);
  } else {
    slug = await generateUniqueSlug(title, 'news');
  }

  // 创建资讯（状态为待审核）
  const news = await prisma.news.create({
    data: {
      title,
      slug,
      summary,
      content,
      coverImage,
      category: category || 'AI资讯',
      tags: tags ? JSON.stringify(tags) : null,
      source,
      sourceUrl,
      status: 0, // 待审核
    },
  });

  // 只有创始股东创建贡献记录
  if (userMembership === 'FOUNDER') {
    await prisma.founderContribution.create({
      data: {
        userId,
        type: 'NEWS',
        title: `提交资讯: ${title}`,
        description: summary || content.substring(0, 100) + '...',
        status: 0, // 待审核
        points: CONTRIBUTION_POINTS.NEWS,
        newsId: news.id,
      },
    });
  }

  return NextResponse.json({
    success: true,
    message: '资讯提交成功，等待管理员审核',
    newsId: news.id,
  });
}

// 提交工具
async function submitTool(userId: number, userMembership: string, data: any) {
  const { name, slug: providedSlug, shortDesc, description, websiteUrl, categoryId, subCategoryId, useCaseId, pricingType, imageUrl } = data;

  if (!name || !shortDesc || !description || !websiteUrl) {
    return NextResponse.json({ error: '请填写完整的工具信息' }, { status: 400 });
  }

  // 使用前端提供的slug或生成slug
  let slug: string;
  if (providedSlug) {
    slug = await generateUniqueSlug(providedSlug, 'tool', true);
  } else {
    slug = await generateUniqueSlug(name, 'tool');
  }

  // 创建工具（状态为待审核）
  const tool = await prisma.tool.create({
    data: {
      name,
      slug,
      shortDesc,
      description,
      websiteUrl,
      imageUrl,
      categoryId: parseInt(categoryId) || 1,
      subCategoryId: subCategoryId ? parseInt(subCategoryId) : null,
      useCaseId: parseInt(useCaseId) || 1,
      pricingType: pricingType || 'Free',
      status: 0, // 待审核
    },
  });

  // 只有创始股东创建贡献记录
  if (userMembership === 'FOUNDER') {
    await prisma.founderContribution.create({
      data: {
        userId,
        type: 'TOOL',
        title: `提交工具: ${name}`,
        description: shortDesc,
        status: 0, // 待审核
        points: CONTRIBUTION_POINTS.TOOL,
        toolId: tool.id,
      },
    });
  }

  return NextResponse.json({
    success: true,
    message: '工具提交成功，等待管理员审核',
    toolId: tool.id,
  });
}

// 提交点评/评论
async function submitReview(userId: number, userMembership: string, data: any) {
  const { toolId, newsId, rating, content, type } = data;

  if (!content) {
    return NextResponse.json({ error: '内容不能为空' }, { status: 400 });
  }

  // 判断是工具点评还是资讯评论
  if (type === 'TOOL_REVIEW' && toolId) {
    // 检查是否已提交过
    const existingReview = await prisma.review.findFirst({
      where: { userId, toolId: parseInt(toolId) },
    });

    if (existingReview) {
      return NextResponse.json({ error: '您已经对该工具提交过点评' }, { status: 400 });
    }

    // 创建工具点评
    const review = await prisma.review.create({
      data: {
        userId,
        toolId: parseInt(toolId),
        rating: rating || 5,
        content,
        status: 0, // 待审核
      },
    });

    // 只有创始股东创建贡献记录
    if (userMembership === 'FOUNDER') {
      await prisma.founderContribution.create({
        data: {
          userId,
          type: 'REVIEW',
          title: '提交工具点评',
          description: content.substring(0, 100) + '...',
          status: 0,
          points: CONTRIBUTION_POINTS.REVIEW,
          reviewId: review.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: '点评提交成功，等待管理员审核',
      reviewId: review.id,
    });
  } else if (type === 'NEWS_COMMENT' && newsId) {
    // 创建资讯评论
    const comment = await prisma.comment.create({
      data: {
        userId,
        newsId: parseInt(newsId),
        content,
        status: 0, // 待审核
      },
    });

    // 只有创始股东创建贡献记录
    if (userMembership === 'FOUNDER') {
      await prisma.founderContribution.create({
        data: {
          userId,
          type: 'REVIEW',
          title: '提交资讯评论',
          description: content.substring(0, 100) + '...',
          status: 0,
          points: CONTRIBUTION_POINTS.REVIEW,
          reviewId: comment.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: '评论提交成功，等待管理员审核',
      commentId: comment.id,
    });
  }

  return NextResponse.json({ error: '无效的提交类型' }, { status: 400 });
}

// 生成唯一 slug
async function generateUniqueSlug(text: string, type: 'news' | 'tool', useProvided: boolean = false): Promise<string> {
  const baseSlug = useProvided ? text : slugify(text);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = type === 'news'
      ? await prisma.news.findUnique({ where: { slug } })
      : await prisma.tool.findUnique({ where: { slug } });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}
