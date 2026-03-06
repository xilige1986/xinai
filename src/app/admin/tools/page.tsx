import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Star,
} from 'lucide-react';

interface AdminToolsPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

async function getTools({
  status,
  search,
  categoryId,
}: {
  status?: number;
  search?: string;
  categoryId?: number;
}) {
  const where: any = {};

  if (status !== undefined) {
    where.status = status;
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { shortDesc: { contains: search, mode: 'insensitive' } },
    ];
  }

  return await prisma.tool.findMany({
    where,
    orderBy: [{ sortOrder: 'desc' }, { createdAt: 'desc' }],
    include: {
      category: true,
      subCategory: true,
      useCase: true,
    },
  });
}

async function getCategories() {
  return await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
  });
}

export default async function AdminToolsPage({ searchParams }: AdminToolsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const status = searchParams.status ? parseInt(searchParams.status as string) : undefined;
  const search = searchParams.search as string | undefined;
  const categoryId = searchParams.category ? parseInt(searchParams.category as string) : undefined;

  const [tools, categories] = await Promise.all([
    getTools({ status, search, categoryId }),
    getCategories(),
  ]);

  const statusFilter = [
    { value: undefined, label: '全部状态' },
    { value: 0, label: '待审核' },
    { value: 1, label: '已发布' },
    { value: 2, label: '已拒绝' },
  ];

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
            <Clock className="h-3 w-3 mr-1" />
            待审核
          </Badge>
        );
      case 1:
        return (
          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
            <CheckCircle className="h-3 w-3 mr-1" />
            已发布
          </Badge>
        );
      case 2:
        return (
          <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
            <XCircle className="h-3 w-3 mr-1" />
            已拒绝
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">工具管理</h1>
            <p className="text-sm text-muted-foreground">管理 AI 工具的发布、编辑和排序</p>
          </div>
        </div>
        <Link href="/admin/tools/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            添加工具
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <form className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="search"
              type="search"
              defaultValue={search}
              placeholder="搜索工具名称..."
              className="pl-10"
            />
          </div>
          <select
            name="status"
            defaultValue={status ?? ''}
            className="px-3 py-2 rounded-md border bg-white text-sm"
          >
            {statusFilter.map((s) => (
              <option key={s.label} value={s.value ?? ''}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            name="category"
            defaultValue={categoryId ?? ''}
            className="px-3 py-2 rounded-md border bg-white text-sm"
          >
            <option value="">全部分类</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <Button type="submit" variant="secondary">
            筛选
          </Button>
        </form>
      </div>

      {/* Tools Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">排序</TableHead>
              <TableHead>工具信息</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>定价</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">数据</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tools.length > 0 ? (
              tools.map((tool) => (
                <TableRow key={tool.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-500" />
                      <span className="text-sm font-medium">{tool.sortOrder}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {tool.imageUrl ? (
                        <img
                          src={tool.imageUrl}
                          alt={tool.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {tool.name[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{tool.name}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {tool.shortDesc}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{tool.category?.name}</p>
                      {tool.subCategory && (
                        <p className="text-muted-foreground text-xs">{tool.subCategory.name}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {tool.pricingType === 'Free' && '免费'}
                      {tool.pricingType === 'Paid' && '付费'}
                      {tool.pricingType === 'Freemium' && '免费增值'}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(tool.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="text-sm">
                      <p className="text-muted-foreground">👁 {tool.views}</p>
                      <p className="text-muted-foreground">❤️ {tool.likes}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/tool/${tool.slug}`} target="_blank">
                            <Eye className="h-4 w-4 mr-2" />
                            查看
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/tools/${tool.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            编辑
                          </Link>
                        </DropdownMenuItem>
                        {tool.status === 0 && (
                          <>
                            <form action={`/api/tools/${tool.id}/approve`} method="POST">
                              <button type="submit" className="w-full">
                                <DropdownMenuItem>
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                  通过审核
                                </DropdownMenuItem>
                              </button>
                            </form>
                            <form action={`/api/tools/${tool.id}/reject`} method="POST">
                              <button type="submit" className="w-full">
                                <DropdownMenuItem>
                                  <XCircle className="h-4 w-4 mr-2 text-red-500" />
                                  拒绝
                                </DropdownMenuItem>
                              </button>
                            </form>
                          </>
                        )}
                        <form action={`/api/tools/${tool.id}/delete`} method="POST">
                          <button type="submit" className="w-full">
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              删除
                            </DropdownMenuItem>
                          </button>
                        </form>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  暂无工具数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
