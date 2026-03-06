import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PUT(
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

    const body = await request.json();
    const {
      name,
      slug,
      shortDesc,
      description,
      websiteUrl,
      pricingType,
      status,
      categoryId,
      subCategoryId,
      useCaseId,
      sortOrder,
    } = body;

    // Validate required fields
    if (!name || !slug || !shortDesc || !description || !websiteUrl || !categoryId || !useCaseId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if slug is unique (excluding current tool)
    const existingTool = await prisma.tool.findFirst({
      where: {
        slug,
        id: { not: toolId },
      },
    });

    if (existingTool) {
      return NextResponse.json({ error: 'URL 标识已被使用' }, { status: 400 });
    }

    const updatedTool = await prisma.tool.update({
      where: { id: toolId },
      data: {
        name,
        slug,
        shortDesc,
        description,
        websiteUrl,
        pricingType,
        status: status ?? 1,
        categoryId,
        subCategoryId: subCategoryId || null,
        useCaseId,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json({ tool: updatedTool });
  } catch (error: any) {
    console.error('Failed to update tool:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update tool' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await prisma.tool.delete({
      where: { id: toolId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete tool:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete tool' },
      { status: 500 }
    );
  }
}
