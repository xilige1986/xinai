import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// 获取章节的所有课时
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const chapterId = parseInt(id);
    if (isNaN(chapterId)) {
      return NextResponse.json({ error: 'Invalid chapter ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const lessons = await prisma.lesson.findMany({
      where: {
        chapterId,
        ...(status && { status: parseInt(status) }),
      },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        contentType: true,
        isFree: true,
        sortOrder: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ lessons });
  } catch (error: any) {
    console.error('Failed to fetch lessons:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}

// 创建新课时
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const chapterId = parseInt(id);
    if (isNaN(chapterId)) {
      return NextResponse.json({ error: 'Invalid chapter ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      title,
      description,
      duration = 0,
      contentType = 'text',
      videoUrl,
      videoPlatform,
      textContent,
      markdownContent,
      isFree = false,
      sortOrder = 0,
    } = body;

    if (!title) {
      return NextResponse.json({ error: '课时标题不能为空' }, { status: 400 });
    }

    if (contentType === 'video' && !videoUrl) {
      return NextResponse.json({ error: '视频链接不能为空' }, { status: 400 });
    }

    // 获取章节信息
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { courseId: true },
    });

    if (!chapter) {
      return NextResponse.json({ error: '章节不存在' }, { status: 404 });
    }

    const lesson = await prisma.lesson.create({
      data: {
        title,
        description,
        duration,
        contentType,
        videoUrl,
        videoPlatform,
        textContent,
        markdownContent,
        isFree,
        sortOrder,
        chapterId,
        courseId: chapter.courseId,
        status: 1,
      },
    });

    return NextResponse.json({ lesson, message: '课时创建成功' });
  } catch (error: any) {
    console.error('Failed to create lesson:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create lesson' },
      { status: 500 }
    );
  }
}
