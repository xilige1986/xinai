import { prisma } from '@/lib/db';
import SubmitToolForm from './SubmitToolForm';

// 获取分类和子分类
async function getCategories() {
  return await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      subCategories: {
        orderBy: { id: 'asc' },
        select: { id: true, name: true },
      },
    },
  });
}

// 获取使用场景
async function getUseCases() {
  return await prisma.useCase.findMany({
    orderBy: { adoptionRate: 'desc' },
    select: {
      id: true,
      name: true,
    },
  });
}

export default async function SubmitPage() {
  const [categories, useCases] = await Promise.all([
    getCategories(),
    getUseCases(),
  ]);

  return <SubmitToolForm categories={categories} useCases={useCases} />;
}
