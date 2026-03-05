import { Prisma } from '@prisma/client';

// 从Prisma导出的基础类型
export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  subCategories?: SubCategory[];
  tools?: Tool[];
  createdAt: Date;
  updatedAt: Date;
};

export type SubCategory = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  categoryId: number;
  category?: Category;
  tools?: Tool[];
  createdAt: Date;
};

export type UseCase = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  adoptionRate: number;
  tools?: Tool[];
  createdAt: Date;
};

export type Tool = {
  id: number;
  name: string;
  slug: string;
  shortDesc: string;
  description: string;
  websiteUrl: string;
  imageUrl: string | null;
  pricingType: string;
  status: number;
  categoryId: number;
  category?: Category;
  subCategoryId: number | null;
  subCategory?: SubCategory | null;
  useCaseId: number;
  useCase?: UseCase;
  views: number;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
  courses?: Course[];
};

export type Course = {
  id: number;
  title: string;
  slug: string;
  description: string;
  coverImage: string | null;
  price: number;
  buyUrl: string;
  level: string;
  studentCount: number;
  status: number;
  createdAt: Date;
  tools?: Tool[];
};

// 定价类型样式映射
export const pricingTypeStyles: Record<string, { label: string; className: string }> = {
  Free: {
    label: '免费',
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  Paid: {
    label: '付费',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  Freemium: {
    label: '免费增值',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
};

// 课程等级样式映射
export const courseLevelStyles: Record<string, { label: string; className: string }> = {
  Beginner: {
    label: '入门',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  Advanced: {
    label: '进阶',
    className: 'bg-purple-100 text-purple-700 border-purple-200',
  },
};
