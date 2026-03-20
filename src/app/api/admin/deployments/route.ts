import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getCurrentFingerprint } from '@/lib/deployment-fingerprint';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 检查是否禁用追踪
    if (process.env.DISABLE_TRACKING === 'true') {
      return NextResponse.json({
        currentFingerprint: '',
        tracking: 'disabled',
        stats: { total: 0, active: 0, recent: 0 },
        current: null,
        deployments: [],
      });
    }

    // 获取当前部署指纹
    const currentFingerprint = await getCurrentFingerprint();

    // 获取部署统计
    const [
      totalDeployments,
      activeDeployments,
      recentDeployments,
      currentDeployment,
    ] = await Promise.all([
      // 总部署数
      prisma.deploymentFingerprint.count(),
      // 活跃部署数（7天内有上报）
      prisma.deploymentFingerprint.count({
        where: {
          lastSeenAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          isActive: true,
        },
      }),
      // 最近30天新部署
      prisma.deploymentFingerprint.count({
        where: {
          firstSeenAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // 当前部署信息
      prisma.deploymentFingerprint.findUnique({
        where: { fingerprint: currentFingerprint },
      }),
    ]);

    // 获取部署列表（最近活跃的）
    const deployments = await prisma.deploymentFingerprint.findMany({
      orderBy: { lastSeenAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      currentFingerprint,
      stats: {
        total: totalDeployments,
        active: activeDeployments,
        recent: recentDeployments,
      },
      current: currentDeployment,
      deployments,
    });
  } catch (error) {
    console.error('[Deployment Stats API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
