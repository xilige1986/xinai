import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

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
    const toolId = parseInt(id);
    if (isNaN(toolId)) {
      return NextResponse.json({ error: 'Invalid tool ID' }, { status: 400 });
    }

    // 获取工具信息
    const tool = await prisma.tool.findUnique({
      where: { id: toolId },
    });

    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    // 更新工具状态并处理贡献积分
    const updatedTool = await prisma.$transaction(async (tx) => {
      // 更新工具状态
      const updated = await tx.tool.update({
        where: { id: toolId },
        data: { status: 1 },
      });

      // 给创始股东添加贡献积分
      const contribution = await tx.founderContribution.findFirst({
        where: {
          toolId: toolId,
          type: 'TOOL',
        },
      });

      if (contribution && contribution.status === 0) {
        await tx.founderContribution.update({
          where: { id: contribution.id },
          data: { status: 1 },
        });
      }

      return updated;
    });

    // 检查是否是 form 提交（来自 admin 页面）
    const contentType = request.headers.get('content-type') || '';
    const isFormSubmit = contentType.includes('application/x-www-form-urlencoded') ||
                         contentType.includes('multipart/form-data');

    if (isFormSubmit) {
      // 重定向回 admin 页面
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    return NextResponse.json({ tool: updatedTool, message: '工具已通过审核' });
  } catch (error: any) {
    console.error('Failed to approve tool:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to approve tool' },
      { status: 500 }
    );
  }
}
