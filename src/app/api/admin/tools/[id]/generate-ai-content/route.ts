import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateAndSaveAIContent } from '@/lib/ai-content';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[AI Generate] Request started at:', new Date().toISOString());

  try {
    const { id } = await params;
    const toolId = parseInt(id);

    if (isNaN(toolId)) {
      return NextResponse.json({ error: 'Invalid tool ID' }, { status: 400 });
    }

    // 检查工具是否存在
    const tool = await prisma.tool.findUnique({
      where: { id: toolId },
    });

    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    console.log('[AI Generate] Tool found:', tool.name);

    // 生成AI内容
    const result = await generateAndSaveAIContent(toolId, 'manual');

    if (result.success) {
      // 获取生成的内容
      const aiContent = await prisma.toolAIContent.findUnique({
        where: { toolId },
      });

      return NextResponse.json({
        success: true,
        message: result.message,
        data: aiContent,
      });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[AI Generate] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
