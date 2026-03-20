import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getSponsors, saveSponsors } from '@/lib/sponsors';

// 获取赞助商列表
export async function GET() {
  try {
    const sponsors = await getSponsors();
    return NextResponse.json({ sponsors });
  } catch (error) {
    console.error('Get sponsors error:', error);
    return NextResponse.json(
      { error: '获取赞助商列表失败' },
      { status: 500 }
    );
  }
}

// 更新赞助商列表（仅管理员）
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sponsors } = await request.json();
    await saveSponsors(sponsors);

    return NextResponse.json({ success: true, sponsors });
  } catch (error) {
    console.error('Update sponsors error:', error);
    return NextResponse.json(
      { error: '更新赞助商列表失败' },
      { status: 500 }
    );
  }
}
