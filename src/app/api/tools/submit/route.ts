import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { toolSubmitSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证输入
    const result = toolSubmitSchema.safeParse(body);
    if (!result.success) {
      const errorMessage = result.error.issues[0]?.message || '验证失败';
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    const { name, websiteUrl, shortDesc, description, categoryId, subCategoryId, useCaseId, pricingType, imageUrl } = result.data;

    // 生成slug（URL友好的名称）
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // 检查slug是否已存在
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.tool.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // 创建工具（状态为待审）
    const tool = await prisma.tool.create({
      data: {
        name,
        slug,
        shortDesc,
        description,
        websiteUrl,
        imageUrl,
        pricingType,
        categoryId,
        subCategoryId: subCategoryId || null,
        useCaseId,
        status: 0, // 待审状态
      },
    });

    return NextResponse.json(
      { message: '工具提交成功，等待审核', tool },
      { status: 201 }
    );
  } catch (error) {
    console.error('工具提交错误:', error);
    return NextResponse.json(
      { error: '提交失败，请稍后重试' },
      { status: 500 }
    );
  }
}
