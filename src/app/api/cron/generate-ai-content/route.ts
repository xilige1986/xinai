import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { generateAndSaveAIContent } from '@/lib/ai-content';

export const dynamic = 'force-dynamic';

/**
 * 定时任务：自动为没有 AI 介绍的工具生成内容
 * 可以通过以下方式触发：
 * 1. 外部定时服务（如 cron-job.org）定期调用此 API
 * 2. Vercel Cron Jobs（需要配置 vercel.json）
 * 3. 管理后台手动触发
 *
 * 安全验证：需要 ADMIN 权限或 CRON_SECRET 密钥
 */
export async function POST(request: NextRequest) {
  console.log('[AI Cron] Task started at:', new Date().toISOString());

  try {
    // 验证权限（支持两种方式：session 或 CRON_SECRET）
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    let isAuthorized = false;

    // 方式1：检查 CRON_SECRET
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      isAuthorized = true;
      console.log('[AI Cron] Authorized via CRON_SECRET');
    } else {
      // 方式2：检查 session
      const session = await getServerSession(authOptions);
      if (session && (session.user as any).role === 'ADMIN') {
        isAuthorized = true;
        console.log('[AI Cron] Authorized via session');
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 获取参数
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5'); // 每次处理数量，默认5个
    const force = searchParams.get('force') === 'true'; // 是否强制重新生成

    console.log('[AI Cron] Params:', { limit, force });

    // 查找需要生成 AI 内容的工具
    const where: any = {
      status: 1, // 只处理已发布的工具
    };

    if (!force) {
      // 不强制重新生成时，只查找没有 AI 内容的工具
      where.aiContent = null;
    }

    // 查找符合条件的工具
    const tools = await prisma.tool.findMany({
      where: {
        ...where,
        // 排除已经有 AI 内容的工具（如果不是强制模式）
        ...(force ? {} : {
          NOT: {
            aiContent: {
              content: {
                not: null,
              },
            },
          },
        }),
      },
      take: limit,
      orderBy: {
        createdAt: 'asc', // 优先处理较早创建的工具
      },
    });

    console.log(`[AI Cron] Found ${tools.length} tools to process`);

    if (tools.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有需要生成 AI 内容的工具',
        processed: 0,
        results: [],
      });
    }

    // 逐个生成 AI 内容
    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const tool of tools) {
      console.log(`[AI Cron] Processing tool: ${tool.name} (ID: ${tool.id})`);

      try {
        const result = await generateAndSaveAIContent(tool.id, 'system');

        results.push({
          toolId: tool.id,
          toolName: tool.name,
          success: result.success,
          message: result.message,
        });

        if (result.success) {
          successCount++;
          console.log(`[AI Cron] Success: ${tool.name}`);
        } else {
          failCount++;
          console.log(`[AI Cron] Failed: ${tool.name} - ${result.message}`);
        }

        // 添加延迟，避免 API 限流
        if (tools.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        console.error(`[AI Cron] Error processing ${tool.name}:`, errorMessage);

        results.push({
          toolId: tool.id,
          toolName: tool.name,
          success: false,
          message: errorMessage,
        });
        failCount++;
      }
    }

    console.log('[AI Cron] Task completed:', { successCount, failCount });

    return NextResponse.json({
      success: true,
      message: `处理完成：成功 ${successCount} 个，失败 ${failCount} 个`,
      processed: tools.length,
      successCount,
      failCount,
      results,
    });
  } catch (error) {
    console.error('[AI Cron] Task error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET 方法用于查看任务状态或统计
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 统计信息
    const totalTools = await prisma.tool.count({
      where: { status: 1 },
    });

    const toolsWithAI = await prisma.toolAIContent.count();

    const toolsWithoutAI = await prisma.tool.count({
      where: {
        status: 1,
        aiContent: null,
      },
    });

    const pendingTools = await prisma.tool.findMany({
      where: {
        status: 1,
        aiContent: null,
      },
      take: 10,
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, slug: true },
    });

    return NextResponse.json({
      stats: {
        total: totalTools,
        withAI: toolsWithAI,
        withoutAI: toolsWithoutAI,
        completionRate: totalTools > 0 ? Math.round((toolsWithAI / totalTools) * 100) : 0,
      },
      pendingTools,
    });
  } catch (error) {
    console.error('[AI Cron] Get stats error:', error);
    return NextResponse.json(
      { error: '获取统计信息失败' },
      { status: 500 }
    );
  }
}
