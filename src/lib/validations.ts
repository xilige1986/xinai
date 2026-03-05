import { z } from 'zod';

// AI工具提交表单验证
export const toolSubmitSchema = z.object({
  name: z.string().min(2, '工具名称至少2个字符').max(100, '工具名称不能超过100个字符'),
  websiteUrl: z.string().url('请输入有效的网址'),
  shortDesc: z.string().min(10, '简短描述至少10个字符').max(200, '简短描述不能超过200个字符'),
  description: z.string().min(50, '详细描述至少50个字符').max(5000, '详细描述不能超过5000个字符'),
  categoryId: z.number().int().positive('请选择AI工具分类'),
  subCategoryId: z.number().int().optional(),
  useCaseId: z.number().int().positive('请选择使用场景'),
  pricingType: z.enum(['Free', 'Paid', 'Freemium']),
  imageUrl: z.string().optional(),
});

export type ToolSubmitInput = z.infer<typeof toolSubmitSchema>;

// 用户登录验证
export const loginSchema = z.object({
  username: z.string().min(3, '用户名至少3个字符'),
  password: z.string().min(6, '密码至少6个字符'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// 课程创建验证 (管理员)
export const courseCreateSchema = z.object({
  title: z.string().min(2, '课程标题至少2个字符').max(200, '课程标题不能超过200个字符'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug只能包含小写字母、数字和连字符'),
  description: z.string().min(50, '课程描述至少50个字符'),
  price: z.number().min(0, '价格不能为负数'),
  buyUrl: z.string().url('请输入有效的购买链接'),
  level: z.enum(['Beginner', 'Advanced']),
  toolIds: z.array(z.number()).optional(),
});

export type CourseCreateInput = z.infer<typeof courseCreateSchema>;
