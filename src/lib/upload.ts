import { writeFile } from 'fs/promises';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * 保存上传文件到本地目录
 * @param file - 上传的文件
 * @param folder - 目标文件夹 (如 'tools', 'courses')
 * @returns 保存后的文件路径
 */
export async function saveUploadFile(
  file: File,
  folder: string
): Promise<string> {
  // 生成唯一文件名
  const timestamp = Date.now();
  const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${timestamp}_${originalName}`;

  // 目标目录
  const uploadDir = join(process.cwd(), 'public', 'uploads', folder);

  // 确保目录存在
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  // 文件路径
  const filePath = join(uploadDir, fileName);
  const relativePath = `/uploads/${folder}/${fileName}`;

  // 转换 File 为 Buffer 并保存
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(filePath, buffer);

  return relativePath;
}

/**
 * 验证上传文件类型
 * @param file - 上传的文件
 * @param allowedTypes - 允许的文件类型
 * @returns 是否通过验证
 */
export function validateFileType(
  file: File,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * 验证文件大小
 * @param file - 上传的文件
 * @param maxSizeMB - 最大文件大小 (MB)
 * @returns 是否通过验证
 */
export function validateFileSize(file: File, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}
