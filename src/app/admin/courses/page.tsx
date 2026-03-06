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
  ArrowLeft,
  BookOpen,
  DollarSign,
  Users,
} from 'lucide-react';

interface AdminCoursesPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

async function getCourses({
  status,
  search,
}: {
  status?: number;
  search?: string;
}) {
  const where: any = {};

  if (status !== undefined) {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  return await prisma.course.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      tools: {
        select: { id: true, name: true },
      },
    },
  });
}

export default async function AdminCoursesPage({ searchParams }: AdminCoursesPageProps) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const status = searchParams.status ? parseInt(searchParams.status as string) : undefined;
  const search = searchParams.search as string | undefined;

  const courses = await getCourses({ status, search });

  const statusFilter = [
    { value: undefined, label: '全部状态' },
    { value: 0, label: '已下架' },
    { value: 1, label: '已上架' },
  ];

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-200 bg-gray-50">
            已下架
          </Badge>
        );
      case 1:
        return (
          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
            已上架
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
            <h1 className="text-2xl font-bold">课程管理</h1>
            <p className="text-sm text-muted-foreground">管理 AI 商业化课程的发布和编辑</p>
          </div>
        </div>
        <Link href="/admin/courses/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            添加课程
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
              placeholder="搜索课程名称..."
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
          <Button type="submit" variant="secondary">
            筛选
          </Button>
        </form>
      </div>

      {/* Courses Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>课程信息</TableHead>
              <TableHead>价格</TableHead>
              <TableHead>学员数</TableHead>
              <TableHead>关联工具</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.length > 0 ? (
              courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {course.coverImage ? (
                        <img
                          src={course.coverImage}
                          alt={course.title}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                          <BookOpen className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate">{course.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
                          {course.description}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{course.price}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{course.studentCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {course.tools.slice(0, 2).map((tool) => (
                        <Badge key={tool.id} variant="secondary" className="text-xs">
                          {tool.name}
                        </Badge>
                      ))}
                      {course.tools.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{course.tools.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(course.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/course/${course.slug}`} target="_blank">
                            <Eye className="h-4 w-4 mr-2" />
                            查看
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/courses/${course.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            编辑
                          </Link>
                        </DropdownMenuItem>
                        <form action={`/api/courses/${course.id}/delete`} method="POST">
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
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  暂无课程数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
