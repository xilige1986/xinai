import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// 获取课程的所有章节
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const courseId = parseInt(id);
    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    const chapters = await prisma.chapter.findMany({
      where: {
        courseId,
        status: 1,
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        lessons: {
          where: { status: 1 },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            duration: true,
            contentType: true,
            isFree: true,
            sortOrder: true,
          },
        },
        _count: {
          select: { lessons: true },
        },
      },
    });

    return NextResponse.json({ chapters });
  } catch (error: any) {
    console.error('Failed to fetch chapters:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chapters' },
      { status: 500 }
    );
  }
}

// 创建新章节
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
    const courseId = parseInt(id);
    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, sortOrder = 0 } = body;

    if (!title) {
      return NextResponse.json({ error: '章节标题不能为空' }, { status: 400 });
    }

    // 检查课程是否存在
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: '课程不存在' }, { status: 404 });
    }

    const chapter = await prisma.chapter.create({
      data: {
        title,
        description,
        sortOrder,
        courseId,
        status: 1,
      },
    });

    return NextResponse.json({ chapter, message: '章节创建成功' });
  } catch (error: any) {
    console.error('Failed to create chapter:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create chapter' },
      { status: 500 }
    );
  }
}
