import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const courseId = parseInt(id);
    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    const body = await request.json();
    const { title, slug, description, coverImage, price, buyUrl, level, status, toolIds } = body;

    if (!title || !slug || !description || !buyUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingCourse = await prisma.course.findFirst({
      where: {
        slug,
        id: { not: courseId },
      },
    });

    if (existingCourse) {
      return NextResponse.json({ error: 'URL 标识已被使用' }, { status: 400 });
    }

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        title,
        slug,
        description,
        coverImage,
        price: price || 0,
        buyUrl,
        level: level || 'Beginner',
        status: status ?? 1,
        tools: {
          set: toolIds?.length ? toolIds.map((id: number) => ({ id })) : [],
        },
      },
    });

    return NextResponse.json({ course: updatedCourse, message: '课程更新成功' });
  } catch (error: any) {
    console.error('Failed to update course:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update course' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const courseId = parseInt(id);
    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    await prisma.course.delete({
      where: { id: courseId },
    });

    return NextResponse.json({ success: true, message: '课程已删除' });
  } catch (error: any) {
    console.error('Failed to delete course:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete course' },
      { status: 500 }
    );
  }
}
