import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkCourseAccess } from '@/lib/membership';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { id } = await params;
    const courseId = parseInt(id);
    const userMembership = (session.user as any).membership || 'MEMBER';

    if (isNaN(courseId)) {
      return NextResponse.json({ error: '无效的课程ID' }, { status: 400 });
    }

    const access = await checkCourseAccess(userId, userMembership, courseId);

    return NextResponse.json(access);
  } catch (error) {
    console.error('Check course access error:', error);
    return NextResponse.json({ error: '检查权限失败' }, { status: 500 });
  }
}
