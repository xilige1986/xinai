import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { writeFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '只允许上传 JPG, PNG, WebP, GIF 格式的图片' },
        { status: 400 }
      );
    }

    // 验证文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '图片大小不能超过 5MB' },
        { status: 400 }
      );
    }

    // 创建上传目录（兼容 standalone 模式）
    // standalone 模式下 process.cwd() 是 .next/standalone，需要回到项目根目录
    const isStandalone = process.cwd().includes('.next/standalone');
    const baseDir = isStandalone
      ? join(process.cwd(), '..', '..')
      : process.cwd();
    const uploadDir = join(baseDir, 'public', 'uploads', type);

    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    // 生成文件名
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${ext}`;
    const filepath = join(uploadDir, filename);

    // 写入文件到主目录
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    // 同时复制到 standalone 目录（如果存在）
    const standaloneUploadDir = join(process.cwd(), 'public', 'uploads', type);
    if (isStandalone && existsSync(join(process.cwd(), 'public'))) {
      if (!existsSync(standaloneUploadDir)) {
        mkdirSync(standaloneUploadDir, { recursive: true });
      }
      const standaloneFilepath = join(standaloneUploadDir, filename);
      await writeFile(standaloneFilepath, Buffer.from(bytes));
    }

    // 返回 URL
    const url = `/uploads/${type}/${filename}`;

    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: '图片上传失败' },
      { status: 500 }
    );
  }
}
