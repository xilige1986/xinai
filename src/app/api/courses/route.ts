import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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
    const { title, slug, description, coverImage, price, buyUrl, level, status, toolIds } = body;

    if (!title || !slug || !description || !buyUrl) {
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
        buyUrl,
        level: level || 'Beginner',
        status: status ?? 1,
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
