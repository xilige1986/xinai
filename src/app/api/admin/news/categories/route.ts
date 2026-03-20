import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// 获取所有分类
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await prisma.news.groupBy({
      by: ['category'],
      _count: { id: true },
    });

    return NextResponse.json({
      categories: categories.map((c) => ({
        name: c.category,
        count: c._count.id,
      })),
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { error: '获取分类失败' },
      { status: 500 }
    );
  }
}

// 添加新分类（通过创建一个空的草稿资讯来占位，或者只是返回成功，因为分类是动态创建的）
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: '分类名称不能为空' },
        { status: 400 }
      );
    }

    // 检查分类是否已存在
    const existing = await prisma.news.findFirst({
      where: { category: name.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: '分类已存在' },
        { status: 400 }
      );
    }

    // 创建一条草稿资讯来占位这个分类
    await prisma.news.create({
      data: {
        title: '分类占位',
        slug: `category-placeholder-${Date.now()}`,
        category: name.trim(),
        status: 0, // 草稿状态
        content: '',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json(
      { error: '创建分类失败' },
      { status: 500 }
    );
  }
}

// 更新分类名称
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { oldName, newName } = await request.json();

    if (!oldName || !newName || newName.trim() === '') {
      return NextResponse.json(
        { error: '分类名称不能为空' },
        { status: 400 }
      );
    }

    // 检查新名称是否已存在
    const existing = await prisma.news.findFirst({
      where: { category: newName.trim() },
    });

    if (existing && existing.category !== oldName) {
      return NextResponse.json(
        { error: '新分类名称已存在' },
        { status: 400 }
      );
    }

    // 批量更新所有使用该分类的资讯
    await prisma.news.updateMany({
      where: { category: oldName },
      data: { category: newName.trim() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update category error:', error);
    return NextResponse.json(
      { error: '更新分类失败' },
      { status: 500 }
    );
  }
}

// 删除分类
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { error: '分类名称不能为空' },
        { status: 400 }
      );
    }

    // 检查该分类下是否有已发布的资讯
    const publishedCount = await prisma.news.count({
      where: { category: name, status: 1 },
    });

    if (publishedCount > 0) {
      return NextResponse.json(
        { error: `该分类下还有 ${publishedCount} 条已发布资讯，无法删除` },
        { status: 400 }
      );
    }

    // 删除该分类下的草稿/占位资讯
    await prisma.news.deleteMany({
      where: { category: name, status: { in: [0, 2] } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json(
      { error: '删除分类失败' },
      { status: 500 }
    );
  }
}
