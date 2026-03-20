import { createHash } from 'crypto';
import { prisma } from './db';

// 检查是否禁用追踪
const isTrackingDisabled = () => {
  return process.env.DISABLE_TRACKING === 'true' || process.env.DISABLE_TRACKING === '1';
};

// 生成部署指纹
function generateFingerprint(): string {
  // 组合多个因素生成唯一指纹
  const factors = [
    process.env.VERCEL_URL || '',                    // Vercel 部署URL
    process.env.VERCEL_GIT_COMMIT_SHA || '',         // Git commit
    process.env.RAILWAY_STATIC_URL || '',            // Railway
    process.env.RENDER_EXTERNAL_URL || '',           // Render
    process.env.PUBLIC_URL || '',                     // 通用
    process.env.NEXT_PUBLIC_APP_URL || '',           // 应用URL
    process.env.DATABASE_URL?.split('@')[1] || '',   // 数据库host
    process.cwd(),                                    // 工作目录
  ].filter(Boolean);

  // 如果没有任何环境变量，生成随机指纹
  if (factors.length === 0) {
    factors.push(Date.now().toString() + Math.random().toString());
  }

  const data = factors.join('|');
  return createHash('sha256').update(data).digest('hex').slice(0, 32);
}

// 获取或创建部署指纹
export async function getOrCreateFingerprint(): Promise<string> {
  // 如果禁用追踪，返回空字符串
  if (isTrackingDisabled()) {
    return '';
  }

  const fingerprint = generateFingerprint();

  try {
    const existing = await prisma.deploymentFingerprint.findUnique({
      where: { fingerprint },
    });

    if (existing) {
      // 更新最后上报时间和计数
      await prisma.deploymentFingerprint.update({
        where: { fingerprint },
        data: {
          reportCount: { increment: 1 },
          lastSeenAt: new Date(),
        },
      });
    } else {
      // 创建新指纹记录
      await prisma.deploymentFingerprint.create({
        data: {
          fingerprint,
          domain: process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL || 'localhost',
          version: process.env.npm_package_version || '1.0.0',
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
        },
      });
    }

    return fingerprint;
  } catch (error) {
    console.error('[DeploymentFingerprint] Error:', error);
    return fingerprint;
  }
}

// 上报部署心跳（用于统计）
export async function reportHeartbeat(): Promise<void> {
  // 如果禁用追踪，直接返回
  if (isTrackingDisabled()) {
    return;
  }

  try {
    const fingerprint = generateFingerprint();

    await fetch('/api/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fingerprint,
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {
      // 静默失败，不影响功能
    });
  } catch {
    // 静默失败
  }
}

// 获取当前部署的指纹（用于管理后台显示）
export async function getCurrentFingerprint(): Promise<string> {
  if (isTrackingDisabled()) {
    return '';
  }
  return generateFingerprint();
}
