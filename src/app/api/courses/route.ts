import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tools: {
          select: { id: true, name: true },
        },
        _count: {
          select: { tools: true },
        },
      },
    });

    return NextResponse.json({ courses });
  } catch (error: any) {
    console.error('Failed to fetch courses:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title, slug, description, coverImage,
      price, originalPrice, buyUrl, level, status,
      duration, lessonCount, targetAudience,
      whatYouWillLearn, outline, includes,
      instructorName, instructorAvatar, instructorBio,
      toolIds,
      // 购买方式设置
      allowMoneyPurchase, allowPointsPurchase, pointsRequired,
      // 宣传视频
      promoVideoUrl, promoVideoPlatform,
    } = body;

    if (!title || !slug || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingCourse = await prisma.course.findUnique({
      where: { slug },
    });

    if (existingCourse) {
      return NextResponse.json({ error: 'URL 标识已被使用' }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        title,
        slug,
        description,
        coverImage,
        price: price || 0,
        originalPrice: originalPrice || 0,
        buyUrl,
        level: level || 'Beginner',
        status: status ?? 1,
        duration: duration || '6.5',
        lessonCount: lessonCount || 12,
        targetAudience,
        whatYouWillLearn,
        outline,
        includes,
        instructorName: instructorName || 'AI工具库专家团队',
        instructorAvatar,
        instructorBio,
        // 购买方式设置
        allowMoneyPurchase: allowMoneyPurchase ?? true,
        allowPointsPurchase: allowPointsPurchase ?? false,
        pointsRequired: pointsRequired || 0,
        // 宣传视频
        promoVideoUrl,
        promoVideoPlatform,
        tools: toolIds?.length ? {
          connect: toolIds.map((id: number) => ({ id })),
        } : undefined,
      },
    });

    return NextResponse.json({ course, message: '课程创建成功' });
  } catch (error: any) {
    console.error('Failed to create course:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create course' },
      { status: 500 }
    );
  }
}
