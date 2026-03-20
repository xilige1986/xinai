import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // 如果禁用追踪，静默返回成功
    if (process.env.DISABLE_TRACKING === 'true') {
      return NextResponse.json({ success: true, tracking: 'disabled' });
    }

    const body = await request.json();
    const { fingerprint, version, timestamp } = body;

    if (!fingerprint) {
      return NextResponse.json(
        { error: 'Fingerprint required' },
        { status: 400 }
      );
    }

    // 获取请求域名
    const referer = request.headers.get('referer') || '';
    const domain = referer.split('/')[2] || 'unknown';

    // 更新或创建指纹记录
    await prisma.deploymentFingerprint.upsert({
      where: { fingerprint },
      update: {
        reportCount: { increment: 1 },
        lastSeenAt: new Date(timestamp),
        version: version || '1.0.0',
        domain: domain || undefined,
        isActive: true,
      },
      create: {
        fingerprint,
        domain: domain || undefined,
        version: version || '1.0.0',
        firstSeenAt: new Date(timestamp),
        lastSeenAt: new Date(timestamp),
        reportCount: 1,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Heartbeat API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
